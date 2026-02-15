// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
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
    IERC20 public ausdToken;
    IERC20 public discountToken;
    address public vault;
    address public facilitator;

    uint256 public platformFeeBps = 250;
    uint256 public originRoyaltyBps = 400;
    uint256 public parentRoyaltyBps = 350;
    uint256 public discountBps = 2000;

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
    event FacilitatorUpdated(address indexed oldFacilitator, address indexed newFacilitator);
    event SoldViaX402(uint256 indexed listingId, address indexed buyer, address indexed recipient, uint256 amount, bytes32 paymentHash);

    constructor(address _soulNFT, address _ausdToken, address _discountToken, address _vault) Ownable(msg.sender) {
        soulNFT = IERC1155(_soulNFT);
        ausdToken = IERC20(_ausdToken);
        discountToken = IERC20(_discountToken);
        vault = _vault;
    }

    receive() external payable {}

    modifier onlyFacilitator() {
        require(msg.sender == facilitator, "Not facilitator");
        _;
    }

    function setFacilitator(address _facilitator) external onlyOwner {
        address oldFacilitator = facilitator;
        facilitator = _facilitator;
        emit FacilitatorUpdated(oldFacilitator, _facilitator);
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

    // --- Buy with Native MON (payable) ---
    function buy(uint256 listingId, uint256 amount, address to) external payable nonReentrant {
        require(to != address(0), "Invalid recipient");
        Listing storage listing = listings[listingId];
        require(listing.active && amount > 0 && amount <= listing.amount, "Invalid");

        uint256 totalPrice = listing.pricePerUnit * amount;
        require(msg.value == totalPrice, "Incorrect MON amount");

        // Checks-Effects-Interactions: update state first
        listing.amount -= amount;
        if (listing.amount == 0) listing.active = false;

        _distributePaymentMON(listing.tokenId, listing.seller, totalPrice);
        soulNFT.safeTransferFrom(address(this), to, listing.tokenId, amount, "");

        emit Sold(listingId, msg.sender, to, amount, totalPrice);
    }

    // --- Buy with aUSD (ERC20, full price) ---
    function buyWithAusd(uint256 listingId, uint256 amount, address to) external nonReentrant {
        require(to != address(0), "Invalid recipient");
        Listing storage listing = listings[listingId];
        require(listing.active && amount > 0 && amount <= listing.amount, "Invalid");

        uint256 totalPrice = listing.pricePerUnit * amount;

        // Checks-Effects-Interactions: update state first
        listing.amount -= amount;
        if (listing.amount == 0) listing.active = false;

        ausdToken.transferFrom(msg.sender, address(this), totalPrice);
        _distributePaymentERC20(ausdToken, listing.tokenId, listing.seller, totalPrice);
        soulNFT.safeTransferFrom(address(this), to, listing.tokenId, amount, "");

        emit Sold(listingId, msg.sender, to, amount, totalPrice);
    }

    // --- Buy with $SOUL discount token (ERC20, 20% off) ---
    function buyWithDiscountToken(uint256 listingId, uint256 amount, address to) external nonReentrant {
        require(to != address(0), "Invalid recipient");
        Listing storage listing = listings[listingId];
        require(listing.active && amount > 0 && amount <= listing.amount, "Invalid");

        uint256 totalPrice = getDiscountedPrice(listing.pricePerUnit * amount);

        // Checks-Effects-Interactions: update state first
        listing.amount -= amount;
        if (listing.amount == 0) listing.active = false;

        discountToken.transferFrom(msg.sender, address(this), totalPrice);
        _distributePaymentERC20(discountToken, listing.tokenId, listing.seller, totalPrice);
        soulNFT.safeTransferFrom(address(this), to, listing.tokenId, amount, "");

        emit Sold(listingId, msg.sender, to, amount, totalPrice);
    }

    // --- Buy via x402 protocol ---
    function buyViaX402(
        uint256 listingId,
        uint256 amount,
        address buyer,
        address recipient,
        bytes32 paymentHash,
        address tokenUsed
    ) external onlyFacilitator nonReentrant {
        require(recipient != address(0), "Invalid recipient");
        Listing storage listing = listings[listingId];
        require(listing.active && amount > 0 && amount <= listing.amount, "Invalid listing");

        uint256 totalPrice = listing.pricePerUnit * amount;
        if (tokenUsed == address(discountToken)) {
            totalPrice = getDiscountedPrice(totalPrice);
        }

        // Checks-Effects-Interactions: update state first
        listing.amount -= amount;
        if (listing.amount == 0) listing.active = false;

        // Payment already transferred to this contract by facilitator
        _distributePaymentERC20(IERC20(tokenUsed), listing.tokenId, listing.seller, totalPrice);
        soulNFT.safeTransferFrom(address(this), recipient, listing.tokenId, amount, "");

        emit SoldViaX402(listingId, buyer, recipient, amount, paymentHash);
    }

    // --- Distribution: Native MON ---
    function _distributePaymentMON(uint256 tokenId, address seller, uint256 totalPrice) internal {
        (, uint256 parentId, uint256 generation,,,,) = ISoulNFT(address(soulNFT)).souls(tokenId);

        uint256 platformFee = (totalPrice * platformFeeBps) / 10000;
        uint256 originRoyalty = 0;
        uint256 parentRoyalty = 0;

        if (generation > 0) {
            address originCreator = _findOriginCreator(tokenId);

            originRoyalty = (totalPrice * originRoyaltyBps) / 10000;
            _sendMON(originCreator, originRoyalty);

            if (generation > 1) {
                (address parentCreator,,,,,,) = ISoulNFT(address(soulNFT)).souls(parentId);
                parentRoyalty = (totalPrice * parentRoyaltyBps) / 10000;
                _sendMON(parentCreator, parentRoyalty);
            }
        }

        _sendMON(vault, platformFee);
        _sendMON(seller, totalPrice - platformFee - originRoyalty - parentRoyalty);
    }

    // --- Distribution: ERC20 ---
    function _distributePaymentERC20(IERC20 token, uint256 tokenId, address seller, uint256 totalPrice) internal {
        (, uint256 parentId, uint256 generation,,,,) = ISoulNFT(address(soulNFT)).souls(tokenId);

        uint256 platformFee = (totalPrice * platformFeeBps) / 10000;
        uint256 originRoyalty = 0;
        uint256 parentRoyalty = 0;

        if (generation > 0) {
            address originCreator = _findOriginCreator(tokenId);

            originRoyalty = (totalPrice * originRoyaltyBps) / 10000;
            token.transfer(originCreator, originRoyalty);

            if (generation > 1) {
                (address parentCreator,,,,,,) = ISoulNFT(address(soulNFT)).souls(parentId);
                parentRoyalty = (totalPrice * parentRoyaltyBps) / 10000;
                token.transfer(parentCreator, parentRoyalty);
            }
        }

        token.transfer(vault, platformFee);
        token.transfer(seller, totalPrice - platformFee - originRoyalty - parentRoyalty);
    }

    // --- Helpers ---
    function _findOriginCreator(uint256 tokenId) internal view returns (address) {
        uint256 originId = tokenId;
        while (true) {
            (address c, uint256 pId, uint256 gen,,,,) = ISoulNFT(address(soulNFT)).souls(originId);
            if (gen == 0) {
                return c;
            }
            originId = pId;
        }
        revert("Origin not found");
    }

    function _sendMON(address to, uint256 amount) internal {
        (bool success, ) = to.call{value: amount}("");
        require(success, "MON transfer failed");
    }

    function getDiscountedPrice(uint256 price) public view returns (uint256) {
        return (price * (10000 - discountBps)) / 10000;
    }

    function setDiscount(uint256 _discountBps) external onlyOwner {
        require(_discountBps <= 5000, "Discount too high");
        discountBps = _discountBps;
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
