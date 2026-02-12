// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title X402Facilitator
 * @notice Facilitator contract for x402 protocol payments
 * @dev Implements 2-signature flow: Agent signs PaymentPayload, Facilitator submits on-chain
 *
 * Flow:
 * 1. Agent creates PaymentPayload and signs with EIP-712
 * 2. Agent must have approved this contract to spend tokens
 * 3. Server calls settle() with agent's signature
 * 4. Contract verifies signature and executes transferFrom
 */
contract X402Facilitator is EIP712, Ownable, ReentrancyGuard {
    using ECDSA for bytes32;

    // ============ Types ============

    struct PaymentPayload {
        address from;        // Agent wallet (payer)
        address to;          // Recipient (seller/marketplace)
        address token;       // Payment token address
        uint256 amount;      // Amount to transfer
        uint256 nonce;       // Unique nonce for replay protection
        uint256 deadline;    // Expiration timestamp
        bytes32 paymentRef;   // Optional paymentRef ID for tracking
    }

    // EIP-712 TypeHash
    bytes32 public constant PAYMENT_TYPEHASH = keccak256(
        "PaymentPayload(address from,address to,address token,uint256 amount,uint256 nonce,uint256 deadline,bytes32 paymentRef)"
    );

    // ============ State ============

    // Nonce tracking: agent => nonce => used
    mapping(address => mapping(uint256 => bool)) public usedNonces;

    // Next suggested nonce for each agent
    mapping(address => uint256) public nextNonce;

    // Authorized operators who can call settle
    mapping(address => bool) public operators;

    // Settlement records
    mapping(bytes32 => bool) public settlements;

    // ============ Events ============

    event PaymentSettled(
        bytes32 indexed paymentHash,
        address indexed from,
        address indexed to,
        address token,
        uint256 amount,
        bytes32 paymentRef
    );

    event OperatorUpdated(address indexed operator, bool authorized);

    // ============ Constructor ============

    constructor() EIP712("SoulMarketplace", "1") Ownable(msg.sender) {
        operators[msg.sender] = true;
    }

    // ============ Operator Management ============

    /**
     * @notice Add or remove an operator
     * @param operator Address to update
     * @param authorized Whether to authorize or revoke
     */
    function setOperator(address operator, bool authorized) external onlyOwner {
        operators[operator] = authorized;
        emit OperatorUpdated(operator, authorized);
    }

    modifier onlyOperator() {
        require(operators[msg.sender], "Not authorized operator");
        _;
    }

    // ============ Core Functions ============

    /**
     * @notice Verify a payment signature without executing
     * @param payload The payment payload
     * @param signature The agent's EIP-712 signature
     * @return valid Whether the signature is valid
     * @return signer The recovered signer address
     */
    function verify(
        PaymentPayload calldata payload,
        bytes calldata signature
    ) public view returns (bool valid, address signer) {
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

        bytes32 digest = _hashTypedDataV4(structHash);
        signer = ECDSA.recover(digest, signature);

        valid = (
            signer == payload.from &&
            block.timestamp <= payload.deadline &&
            !usedNonces[payload.from][payload.nonce]
        );
    }

    /**
     * @notice Settle a payment - verify signature and execute transfer
     * @param payload The payment payload
     * @param signature The agent's EIP-712 signature
     * @return paymentHash Unique hash of this settlement
     */
    function settle(
        PaymentPayload calldata payload,
        bytes calldata signature
    ) external onlyOperator nonReentrant returns (bytes32 paymentHash) {
        // Validate
        require(block.timestamp <= payload.deadline, "Payment expired");
        require(!usedNonces[payload.from][payload.nonce], "Nonce already used");
        require(payload.amount > 0, "Zero amount");
        require(payload.to != address(0), "Invalid recipient");

        // Verify signature
        (bool valid, address signer) = verify(payload, signature);
        require(valid && signer == payload.from, "Invalid signature");

        // Mark nonce as used
        usedNonces[payload.from][payload.nonce] = true;

        // Update next nonce suggestion
        if (payload.nonce >= nextNonce[payload.from]) {
            nextNonce[payload.from] = payload.nonce + 1;
        }

        // Create payment hash
        paymentHash = keccak256(abi.encodePacked(
            payload.from,
            payload.to,
            payload.token,
            payload.amount,
            payload.nonce,
            block.timestamp
        ));

        // Record settlement
        settlements[paymentHash] = true;

        // Execute transfer (agent must have approved this contract)
        IERC20(payload.token).transferFrom(
            payload.from,
            payload.to,
            payload.amount
        );

        emit PaymentSettled(
            paymentHash,
            payload.from,
            payload.to,
            payload.token,
            payload.amount,
            payload.paymentRef
        );
    }

    /**
     * @notice Batch settle multiple payments
     * @param payloads Array of payment payloads
     * @param signatures Array of corresponding signatures
     * @return paymentHashes Array of settlement hashes
     */
    function settleBatch(
        PaymentPayload[] calldata payloads,
        bytes[] calldata signatures
    ) external onlyOperator nonReentrant returns (bytes32[] memory paymentHashes) {
        require(payloads.length == signatures.length, "Length mismatch");

        paymentHashes = new bytes32[](payloads.length);

        for (uint256 i = 0; i < payloads.length; i++) {
            PaymentPayload calldata payload = payloads[i];

            require(block.timestamp <= payload.deadline, "Payment expired");
            require(!usedNonces[payload.from][payload.nonce], "Nonce already used");
            require(payload.amount > 0, "Zero amount");

            (bool valid, address signer) = verify(payload, signatures[i]);
            require(valid && signer == payload.from, "Invalid signature");

            usedNonces[payload.from][payload.nonce] = true;

            if (payload.nonce >= nextNonce[payload.from]) {
                nextNonce[payload.from] = payload.nonce + 1;
            }

            bytes32 paymentHash = keccak256(abi.encodePacked(
                payload.from,
                payload.to,
                payload.token,
                payload.amount,
                payload.nonce,
                block.timestamp
            ));

            settlements[paymentHash] = true;
            paymentHashes[i] = paymentHash;

            IERC20(payload.token).transferFrom(
                payload.from,
                payload.to,
                payload.amount
            );

            emit PaymentSettled(
                paymentHash,
                payload.from,
                payload.to,
                payload.token,
                payload.amount,
                payload.paymentRef
            );
        }
    }

    // ============ View Functions ============

    /**
     * @notice Get the next suggested nonce for an agent
     * @param agent The agent's wallet address
     * @return nonce The next available nonce
     */
    function getNonce(address agent) external view returns (uint256) {
        return nextNonce[agent];
    }

    /**
     * @notice Check if a nonce has been used
     * @param agent The agent's wallet address
     * @param nonce The nonce to check
     * @return used Whether the nonce has been used
     */
    function isNonceUsed(address agent, uint256 nonce) external view returns (bool) {
        return usedNonces[agent][nonce];
    }

    /**
     * @notice Check if a payment has been settled
     * @param paymentHash The payment hash to check
     * @return settled Whether the payment has been settled
     */
    function isSettled(bytes32 paymentHash) external view returns (bool) {
        return settlements[paymentHash];
    }

    /**
     * @notice Get the EIP-712 domain separator
     * @return The domain separator hash
     */
    function getDomainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    /**
     * @notice Get the typed data hash for a payment payload
     * @param payload The payment payload
     * @return The EIP-712 typed data hash for signing
     */
    function getPayloadHash(PaymentPayload calldata payload) external view returns (bytes32) {
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
        return _hashTypedDataV4(structHash);
    }
}
