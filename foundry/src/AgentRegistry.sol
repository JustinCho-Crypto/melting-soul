// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title AgentRegistry
 * @notice ERC-8004 compliant Identity Registry for AI Agents
 * @dev Implements agent registration, wallet binding, and metadata management
 */
contract AgentRegistry is ERC721, Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    struct AgentInfo {
        string agentUri;           // URI pointing to agent card JSON (IPFS/HTTP)
        address wallet;            // Agent's payment wallet
        uint256 registeredAt;      // Registration timestamp
        bool active;               // Whether agent is active
    }

    // Agent ID => Agent Info
    mapping(uint256 => AgentInfo) public agents;

    // Wallet => Agent ID (for reverse lookup)
    mapping(address => uint256) public walletToAgentId;

    // Agent ID counter
    uint256 public nextAgentId = 1;

    // Events
    event AgentRegistered(
        uint256 indexed agentId,
        address indexed owner,
        address indexed wallet,
        string agentUri
    );

    event AgentUriUpdated(
        uint256 indexed agentId,
        string newUri
    );

    event AgentWalletUpdated(
        uint256 indexed agentId,
        address oldWallet,
        address newWallet
    );

    event AgentStatusChanged(
        uint256 indexed agentId,
        bool active
    );

    constructor() ERC721("Soul Marketplace Agent", "AGENT") Ownable(msg.sender) {}

    /**
     * @notice Register a new agent
     * @param agentUri URI pointing to agent card JSON
     * @param wallet Agent's payment wallet address
     * @return agentId The newly created agent's ID
     */
    function register(
        string calldata agentUri,
        address wallet
    ) external returns (uint256 agentId) {
        require(bytes(agentUri).length > 0, "Empty URI");
        require(wallet != address(0), "Invalid wallet");
        require(walletToAgentId[wallet] == 0, "Wallet already registered");

        agentId = nextAgentId++;

        agents[agentId] = AgentInfo({
            agentUri: agentUri,
            wallet: wallet,
            registeredAt: block.timestamp,
            active: true
        });

        walletToAgentId[wallet] = agentId;

        _mint(msg.sender, agentId);

        emit AgentRegistered(agentId, msg.sender, wallet, agentUri);
    }

    /**
     * @notice Register agent with msg.sender as wallet
     * @param agentUri URI pointing to agent card JSON
     * @return agentId The newly created agent's ID
     */
    function register(string calldata agentUri) external returns (uint256 agentId) {
        require(bytes(agentUri).length > 0, "Empty URI");
        require(walletToAgentId[msg.sender] == 0, "Wallet already registered");

        agentId = nextAgentId++;

        agents[agentId] = AgentInfo({
            agentUri: agentUri,
            wallet: msg.sender,
            registeredAt: block.timestamp,
            active: true
        });

        walletToAgentId[msg.sender] = agentId;

        _mint(msg.sender, agentId);

        emit AgentRegistered(agentId, msg.sender, msg.sender, agentUri);
    }

    /**
     * @notice Update agent's URI
     * @param agentId The agent's ID
     * @param newUri New URI for the agent card
     */
    function setAgentUri(uint256 agentId, string calldata newUri) external {
        require(ownerOf(agentId) == msg.sender, "Not owner");
        require(bytes(newUri).length > 0, "Empty URI");

        agents[agentId].agentUri = newUri;

        emit AgentUriUpdated(agentId, newUri);
    }

    /**
     * @notice Update agent's wallet with signature verification
     * @param agentId The agent's ID
     * @param newWallet New wallet address
     * @param deadline Signature deadline
     * @param signature Signature from new wallet proving ownership
     */
    function setAgentWallet(
        uint256 agentId,
        address newWallet,
        uint256 deadline,
        bytes calldata signature
    ) external {
        require(ownerOf(agentId) == msg.sender, "Not owner");
        require(newWallet != address(0), "Invalid wallet");
        require(block.timestamp <= deadline, "Signature expired");
        require(walletToAgentId[newWallet] == 0, "Wallet already registered");

        // Verify new wallet signed the message
        bytes32 messageHash = keccak256(abi.encodePacked(
            "SetAgentWallet",
            agentId,
            newWallet,
            deadline,
            block.chainid,
            address(this)
        ));
        bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();
        address signer = ethSignedHash.recover(signature);
        require(signer == newWallet, "Invalid signature");

        address oldWallet = agents[agentId].wallet;

        // Update mappings
        delete walletToAgentId[oldWallet];
        walletToAgentId[newWallet] = agentId;
        agents[agentId].wallet = newWallet;

        emit AgentWalletUpdated(agentId, oldWallet, newWallet);
    }

    /**
     * @notice Set agent active status
     * @param agentId The agent's ID
     * @param active New active status
     */
    function setAgentStatus(uint256 agentId, bool active) external {
        require(ownerOf(agentId) == msg.sender, "Not owner");

        agents[agentId].active = active;

        emit AgentStatusChanged(agentId, active);
    }

    // ============ View Functions ============

    /**
     * @notice Get agent's wallet address
     * @param agentId The agent's ID
     * @return wallet The agent's wallet address
     */
    function getAgentWallet(uint256 agentId) external view returns (address) {
        require(agents[agentId].registeredAt > 0, "Agent not found");
        return agents[agentId].wallet;
    }

    /**
     * @notice Get agent's URI
     * @param agentId The agent's ID
     * @return uri The agent's URI
     */
    function getAgentUri(uint256 agentId) external view returns (string memory) {
        require(agents[agentId].registeredAt > 0, "Agent not found");
        return agents[agentId].agentUri;
    }

    /**
     * @notice Check if wallet is a registered agent
     * @param wallet The wallet address to check
     * @return isAgent True if wallet belongs to a registered agent
     */
    function isRegisteredAgent(address wallet) external view returns (bool) {
        uint256 agentId = walletToAgentId[wallet];
        return agentId > 0 && agents[agentId].active;
    }

    /**
     * @notice Get agent ID by wallet
     * @param wallet The wallet address
     * @return agentId The agent's ID (0 if not found)
     */
    function getAgentByWallet(address wallet) external view returns (uint256) {
        return walletToAgentId[wallet];
    }

    /**
     * @notice Get full agent info
     * @param agentId The agent's ID
     */
    function getAgent(uint256 agentId) external view returns (
        string memory agentUri,
        address wallet,
        uint256 registeredAt,
        bool active,
        address owner
    ) {
        require(agents[agentId].registeredAt > 0, "Agent not found");
        AgentInfo storage agent = agents[agentId];
        return (
            agent.agentUri,
            agent.wallet,
            agent.registeredAt,
            agent.active,
            ownerOf(agentId)
        );
    }

    /**
     * @notice Override tokenURI to return agent's URI
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(agents[tokenId].registeredAt > 0, "Agent not found");
        return agents[tokenId].agentUri;
    }
}
