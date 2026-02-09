// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface ISoulNFT {
    function souls(uint256 tokenId) external view returns (
        address creator,
        uint256 parentId,
        uint256 generation,
        uint256 forkCount,
        uint256 totalMinted,
        uint256 createdAt,
        string memory metadataUri
    );
}

contract SoulSale is ERC1155Holder, Ownable, ReentrancyGuard {

    IERC1155 public soulNFT;
    IERC20 public paymentToken;
    address public vault;

    uint256 public platformFeeBps = 250;
    uint256 public originRoyaltyBps = 500;
    uint256 public parentRoyaltyBps = 300;

    struct Listing {
        address seller;
        uint256 tokenId;
        uint256 amount;
        uint256 pricePerUnit;
        bool active;
    }

    mapping(uint256 => Listing) public listings;
    uint256 public nextListingId = 1;

    event Listed(uint256 indexed listingId, address indexed seller, uint256 indexed tokenId, uint256 amount, uint256 pricePerUnit);
    event Sold(uint256 indexed listingId, address indexed buyer, address indexed recipient, uint256 amount, uint256 totalPrice);
    event ListingCancelled(uint256 indexed listingId);

    constructor(address _soulNFT, address _paymentToken, address _vault) Ownable(msg.sender) {
        soulNFT = IERC1155(_soulNFT);
        paymentToken = IERC20(_paymentToken);
        vault = _vault;
    }

    function list(uint256 tokenId, uint256 amount, uint256 pricePerUnit) external returns (uint256 listingId) {
        require(amount > 0 && pricePerUnit > 0, "Invalid params");

        soulNFT.safeTransferFrom(msg.sender, address(this), tokenId, amount, "");

        listingId = nextListingId++;
        listings[listingId] = Listing({
            seller: msg.sender,
            tokenId: tokenId,
            amount: amount,
            pricePerUnit: pricePerUnit,
            active: true
        });

        emit Listed(listingId, msg.sender, tokenId, amount, pricePerUnit);
    }

    function buy(uint256 listingId, uint256 amount, address to) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active && amount > 0 && amount <= listing.amount, "Invalid");

        uint256 totalPrice = listing.pricePerUnit * amount;
        _executePurchase(listingId, amount, totalPrice, to);
    }

    function buyWithPermit(
        uint256 listingId,
        uint256 amount,
        address to,
        uint256 deadline,
        uint8 v, bytes32 r, bytes32 s
    ) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active && amount > 0 && amount <= listing.amount, "Invalid");

        uint256 totalPrice = listing.pricePerUnit * amount;

        IERC20Permit(address(paymentToken)).permit(msg.sender, address(this), totalPrice, deadline, v, r, s);
        _executePurchase(listingId, amount, totalPrice, to);
    }

    function _executePurchase(uint256 listingId, uint256 amount, uint256 totalPrice, address to) internal {
        require(to != address(0), "Invalid recipient");
        Listing storage listing = listings[listingId];

        paymentToken.transferFrom(msg.sender, address(this), totalPrice);
        _distributePayment(listing.tokenId, listing.seller, totalPrice);
        soulNFT.safeTransferFrom(address(this), to, listing.tokenId, amount, "");

        listing.amount -= amount;
        if (listing.amount == 0) listing.active = false;

        emit Sold(listingId, msg.sender, to, amount, totalPrice);
    }

    function _distributePayment(uint256 tokenId, address seller, uint256 totalPrice) internal {
        (, uint256 parentId, uint256 generation,,,,) = ISoulNFT(address(soulNFT)).souls(tokenId);

        uint256 platformFee = (totalPrice * platformFeeBps) / 10000;
        uint256 originRoyalty = 0;
        uint256 parentRoyalty = 0;

        if (generation > 0) {
            uint256 originId = tokenId;
            address originCreator;
            while (true) {
                (address c, uint256 pId, uint256 gen,,,,) = ISoulNFT(address(soulNFT)).souls(originId);
                if (gen == 0) {
                    originCreator = c;
                    break;
                }
                originId = pId;
            }

            originRoyalty = (totalPrice * originRoyaltyBps) / 10000;
            paymentToken.transfer(originCreator, originRoyalty);

            if (generation > 1) {
                (address parentCreator,,,,,,) = ISoulNFT(address(soulNFT)).souls(parentId);
                parentRoyalty = (totalPrice * parentRoyaltyBps) / 10000;
                paymentToken.transfer(parentCreator, parentRoyalty);
            }
        }

        paymentToken.transfer(vault, platformFee);
        paymentToken.transfer(seller, totalPrice - platformFee - originRoyalty - parentRoyalty);
    }

    function cancelListing(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender && listing.active, "Invalid");

        listing.active = false;
        soulNFT.safeTransferFrom(address(this), msg.sender, listing.tokenId, listing.amount, "");

        emit ListingCancelled(listingId);
    }

    function setFees(uint256 _platform, uint256 _origin, uint256 _parent) external onlyOwner {
        require(_platform + _origin + _parent <= 3000, "Too high");
        platformFeeBps = _platform;
        originRoyaltyBps = _origin;
        parentRoyaltyBps = _parent;
    }
}
