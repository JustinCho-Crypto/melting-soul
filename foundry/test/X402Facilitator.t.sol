// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/X402Facilitator.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20 {
    constructor() ERC20("Mock", "MCK") {
        _mint(msg.sender, 1_000_000 ether);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract X402FacilitatorTest is Test {
    X402Facilitator public facilitator;
    MockToken public token;

    address public deployer = address(this);
    address public operator = address(0x0);
    address public seller = address(0x5);

    // Agent with known private key
    uint256 public agentKey = 0xA6E47;
    address public agent;

    bytes32 public constant PAYMENT_TYPEHASH = keccak256(
        "PaymentPayload(address from,address to,address token,uint256 amount,uint256 nonce,uint256 deadline,bytes32 paymentRef)"
    );

    function setUp() public {
        agent = vm.addr(agentKey);

        facilitator = new X402Facilitator();
        token = new MockToken();

        // Give agent some tokens
        token.mint(agent, 10_000 ether);

        // Agent approves facilitator
        vm.prank(agent);
        token.approve(address(facilitator), type(uint256).max);

        vm.label(agent, "Agent");
        vm.label(seller, "Seller");
    }

    // --- Helper Functions ---

    function _createPayload(
        uint256 amount,
        uint256 nonce,
        uint256 deadline
    ) internal view returns (X402Facilitator.PaymentPayload memory) {
        return X402Facilitator.PaymentPayload({
            from: agent,
            to: seller,
            token: address(token),
            amount: amount,
            nonce: nonce,
            deadline: deadline,
            paymentRef: bytes32(uint256(1))
        });
    }

    function _signPayload(
        X402Facilitator.PaymentPayload memory payload
    ) internal view returns (bytes memory) {
        bytes32 structHash = keccak256(abi.encode(
            PAYMENT_TYPEHASH,
            payload.from,
            payload.to,
            payload.token,
            payload.amount,
            payload.nonce,
            payload.deadline,
            payload.paymentRef
        ));

        bytes32 digest = keccak256(abi.encodePacked(
            "\x19\x01",
            facilitator.getDomainSeparator(),
            structHash
        ));

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(agentKey, digest);
        return abi.encodePacked(r, s, v);
    }

    // --- Operator Tests ---

    function test_constructor_setsDeployerAsOperator() public view {
        assertTrue(facilitator.operators(deployer));
    }

    function test_setOperator() public {
        address newOperator = address(0x123);

        facilitator.setOperator(newOperator, true);
        assertTrue(facilitator.operators(newOperator));

        facilitator.setOperator(newOperator, false);
        assertFalse(facilitator.operators(newOperator));
    }

    function test_setOperator_revert_notOwner() public {
        vm.prank(agent);
        vm.expectRevert();
        facilitator.setOperator(agent, true);
    }

    // --- Verify Tests ---

    function test_verify_validSignature() public {
        X402Facilitator.PaymentPayload memory payload = _createPayload(
            100 ether,
            0,
            block.timestamp + 1 hours
        );
        bytes memory signature = _signPayload(payload);

        (bool valid, address signer) = facilitator.verify(payload, signature);

        assertTrue(valid);
        assertEq(signer, agent);
    }

    function test_verify_expiredDeadline() public {
        X402Facilitator.PaymentPayload memory payload = _createPayload(
            100 ether,
            0,
            block.timestamp - 1 // expired
        );
        bytes memory signature = _signPayload(payload);

        (bool valid,) = facilitator.verify(payload, signature);
        assertFalse(valid);
    }

    function test_verify_usedNonce() public {
        X402Facilitator.PaymentPayload memory payload = _createPayload(
            100 ether,
            0,
            block.timestamp + 1 hours
        );
        bytes memory signature = _signPayload(payload);

        // First settle
        facilitator.settle(payload, signature);

        // Verify again - should fail
        (bool valid,) = facilitator.verify(payload, signature);
        assertFalse(valid);
    }

    // --- Settle Tests ---

    function test_settle_success() public {
        X402Facilitator.PaymentPayload memory payload = _createPayload(
            100 ether,
            0,
            block.timestamp + 1 hours
        );
        bytes memory signature = _signPayload(payload);

        uint256 agentBalBefore = token.balanceOf(agent);
        uint256 sellerBalBefore = token.balanceOf(seller);

        bytes32 paymentHash = facilitator.settle(payload, signature);

        assertEq(token.balanceOf(agent), agentBalBefore - 100 ether);
        assertEq(token.balanceOf(seller), sellerBalBefore + 100 ether);
        assertTrue(facilitator.isSettled(paymentHash));
        assertTrue(facilitator.isNonceUsed(agent, 0));
        assertEq(facilitator.getNonce(agent), 1);
    }

    function test_settle_revert_notOperator() public {
        X402Facilitator.PaymentPayload memory payload = _createPayload(
            100 ether,
            0,
            block.timestamp + 1 hours
        );
        bytes memory signature = _signPayload(payload);

        vm.prank(agent);
        vm.expectRevert("Not authorized operator");
        facilitator.settle(payload, signature);
    }

    function test_settle_revert_expired() public {
        X402Facilitator.PaymentPayload memory payload = _createPayload(
            100 ether,
            0,
            block.timestamp - 1
        );
        bytes memory signature = _signPayload(payload);

        vm.expectRevert("Payment expired");
        facilitator.settle(payload, signature);
    }

    function test_settle_revert_nonceUsed() public {
        X402Facilitator.PaymentPayload memory payload = _createPayload(
            100 ether,
            0,
            block.timestamp + 1 hours
        );
        bytes memory signature = _signPayload(payload);

        facilitator.settle(payload, signature);

        // Try again with same nonce
        X402Facilitator.PaymentPayload memory payload2 = _createPayload(
            50 ether,
            0, // same nonce
            block.timestamp + 1 hours
        );
        bytes memory signature2 = _signPayload(payload2);

        vm.expectRevert("Nonce already used");
        facilitator.settle(payload2, signature2);
    }

    function test_settle_revert_zeroAmount() public {
        X402Facilitator.PaymentPayload memory payload = _createPayload(
            0, // zero amount
            0,
            block.timestamp + 1 hours
        );
        bytes memory signature = _signPayload(payload);

        vm.expectRevert("Zero amount");
        facilitator.settle(payload, signature);
    }

    // --- Batch Settle Tests ---

    function test_settleBatch_success() public {
        X402Facilitator.PaymentPayload[] memory payloads = new X402Facilitator.PaymentPayload[](2);
        bytes[] memory signatures = new bytes[](2);

        payloads[0] = _createPayload(100 ether, 0, block.timestamp + 1 hours);
        payloads[1] = _createPayload(50 ether, 1, block.timestamp + 1 hours);

        signatures[0] = _signPayload(payloads[0]);
        signatures[1] = _signPayload(payloads[1]);

        uint256 agentBalBefore = token.balanceOf(agent);

        bytes32[] memory hashes = facilitator.settleBatch(payloads, signatures);

        assertEq(hashes.length, 2);
        assertEq(token.balanceOf(agent), agentBalBefore - 150 ether);
        assertEq(token.balanceOf(seller), 150 ether);
    }

    // --- View Functions ---

    function test_getNonce() public {
        assertEq(facilitator.getNonce(agent), 0);

        X402Facilitator.PaymentPayload memory payload = _createPayload(
            100 ether,
            5, // skip nonces
            block.timestamp + 1 hours
        );
        bytes memory signature = _signPayload(payload);
        facilitator.settle(payload, signature);

        assertEq(facilitator.getNonce(agent), 6);
    }

    function test_getPayloadHash() public {
        X402Facilitator.PaymentPayload memory payload = _createPayload(
            100 ether,
            0,
            block.timestamp + 1 hours
        );

        bytes32 hash = facilitator.getPayloadHash(payload);
        assertTrue(hash != bytes32(0));
    }
}
