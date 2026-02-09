// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SoulNFT is ERC1155, Ownable {

    struct SoulInfo {
        address creator;
        uint256 parentId;
        uint256 generation;
        uint256 forkCount;
        uint256 totalMinted;
        uint256 createdAt;
        string metadataUri;
    }

    mapping(uint256 => SoulInfo) public souls;
    uint256 public nextTokenId = 1;

    event SoulCreated(
        uint256 indexed tokenId,
        address indexed creator,
        uint256 parentId,
        uint256 generation
    );

    event SoulForked(
        uint256 indexed newTokenId,
        uint256 indexed parentTokenId,
        address indexed forker
    );

    constructor() ERC1155("") Ownable(msg.sender) {}

    function createSoul(
        string calldata metadataUri,
        uint256 initialSupply
    ) external returns (uint256 tokenId) {
        tokenId = nextTokenId++;

        souls[tokenId] = SoulInfo({
            creator: msg.sender,
            parentId: 0,
            generation: 0,
            forkCount: 0,
            totalMinted: initialSupply,
            createdAt: block.timestamp,
            metadataUri: metadataUri
        });

        _mint(msg.sender, tokenId, initialSupply, "");

        emit SoulCreated(tokenId, msg.sender, 0, 0);
    }

    function forkSoul(
        uint256 parentTokenId,
        string calldata metadataUri,
        uint256 initialSupply
    ) external returns (uint256 newTokenId) {
        require(souls[parentTokenId].creator != address(0), "Parent not exist");

        newTokenId = nextTokenId++;

        SoulInfo storage parent = souls[parentTokenId];
        parent.forkCount++;

        souls[newTokenId] = SoulInfo({
            creator: msg.sender,
            parentId: parentTokenId,
            generation: parent.generation + 1,
            forkCount: 0,
            totalMinted: initialSupply,
            createdAt: block.timestamp,
            metadataUri: metadataUri
        });

        _mint(msg.sender, newTokenId, initialSupply, "");

        emit SoulForked(newTokenId, parentTokenId, msg.sender);
        emit SoulCreated(newTokenId, msg.sender, parentTokenId, parent.generation + 1);
    }

    function mintMore(uint256 tokenId, uint256 amount) external {
        require(souls[tokenId].creator == msg.sender, "Not creator");
        souls[tokenId].totalMinted += amount;
        _mint(msg.sender, tokenId, amount, "");
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        return souls[tokenId].metadataUri;
    }

    function getLineage(uint256 tokenId) external view returns (uint256[] memory) {
        uint256 depth = souls[tokenId].generation;
        uint256[] memory ancestors = new uint256[](depth);

        uint256 current = tokenId;
        for (uint256 i = 0; i < depth; i++) {
            current = souls[current].parentId;
            ancestors[i] = current;
        }

        return ancestors;
    }
}
