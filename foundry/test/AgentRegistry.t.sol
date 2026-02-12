// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/AgentRegistry.sol";

contract AgentRegistryTest is Test {
    AgentRegistry public registry;

    address public deployer = address(this);
    address public alice = address(0xA);
    address public bob = address(0xB);

    uint256 public aliceKey = 0xA11CE;
    uint256 public bobKey = 0xB0B;

    function setUp() public {
        registry = new AgentRegistry();
        vm.label(alice, "Alice");
        vm.label(bob, "Bob");
    }

    // --- Registration Tests ---

    function test_register_withWallet() public {
        vm.prank(alice);
        uint256 agentId = registry.register("ipfs://agent1", bob);

        assertEq(agentId, 1);
        assertEq(registry.ownerOf(agentId), alice);
        assertEq(registry.getAgentWallet(agentId), bob);
        assertEq(registry.walletToAgentId(bob), 1);
        assertTrue(registry.isRegisteredAgent(bob));
    }

    function test_register_selfAsWallet() public {
        vm.prank(alice);
        uint256 agentId = registry.register("ipfs://agent1");

        assertEq(agentId, 1);
        assertEq(registry.ownerOf(agentId), alice);
        assertEq(registry.getAgentWallet(agentId), alice);
        assertTrue(registry.isRegisteredAgent(alice));
    }

    function test_register_revert_emptyUri() public {
        vm.prank(alice);
        vm.expectRevert("Empty URI");
        registry.register("", bob);
    }

    function test_register_revert_zeroWallet() public {
        vm.prank(alice);
        vm.expectRevert("Invalid wallet");
        registry.register("ipfs://agent1", address(0));
    }

    function test_register_revert_walletAlreadyRegistered() public {
        vm.prank(alice);
        registry.register("ipfs://agent1", bob);

        vm.prank(alice);
        vm.expectRevert("Wallet already registered");
        registry.register("ipfs://agent2", bob);
    }

    // --- Update Tests ---

    function test_setAgentUri() public {
        vm.prank(alice);
        uint256 agentId = registry.register("ipfs://agent1");

        vm.prank(alice);
        registry.setAgentUri(agentId, "ipfs://agent1-updated");

        assertEq(registry.getAgentUri(agentId), "ipfs://agent1-updated");
    }

    function test_setAgentUri_revert_notOwner() public {
        vm.prank(alice);
        uint256 agentId = registry.register("ipfs://agent1");

        vm.prank(bob);
        vm.expectRevert();
        registry.setAgentUri(agentId, "ipfs://hacked");
    }

    function test_setAgentStatus() public {
        vm.prank(alice);
        uint256 agentId = registry.register("ipfs://agent1");

        assertTrue(registry.isRegisteredAgent(alice));

        vm.prank(alice);
        registry.setAgentStatus(agentId, false);

        assertFalse(registry.isRegisteredAgent(alice));
    }

    // --- Wallet Update with Signature ---

    function test_setAgentWallet() public {
        address newWallet = vm.addr(bobKey);

        vm.prank(alice);
        uint256 agentId = registry.register("ipfs://agent1");

        uint256 deadline = block.timestamp + 1 hours;

        // Create signature from new wallet
        bytes32 messageHash = keccak256(abi.encodePacked(
            "SetAgentWallet",
            agentId,
            newWallet,
            deadline,
            block.chainid,
            address(registry)
        ));
        bytes32 ethSignedHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            messageHash
        ));

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(bobKey, ethSignedHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.prank(alice);
        registry.setAgentWallet(agentId, newWallet, deadline, signature);

        assertEq(registry.getAgentWallet(agentId), newWallet);
        assertEq(registry.walletToAgentId(newWallet), agentId);
        assertEq(registry.walletToAgentId(alice), 0);
    }

    // --- View Functions ---

    function test_getAgent() public {
        vm.prank(alice);
        uint256 agentId = registry.register("ipfs://agent1", bob);

        (
            string memory agentUri,
            address wallet,
            uint256 registeredAt,
            bool active,
            address owner
        ) = registry.getAgent(agentId);

        assertEq(agentUri, "ipfs://agent1");
        assertEq(wallet, bob);
        assertGt(registeredAt, 0);
        assertTrue(active);
        assertEq(owner, alice);
    }

    function test_tokenURI() public {
        vm.prank(alice);
        uint256 agentId = registry.register("ipfs://agent1");

        assertEq(registry.tokenURI(agentId), "ipfs://agent1");
    }

    function test_getAgentByWallet() public {
        vm.prank(alice);
        uint256 agentId = registry.register("ipfs://agent1", bob);

        assertEq(registry.getAgentByWallet(bob), agentId);
        assertEq(registry.getAgentByWallet(alice), 0);
    }
}
