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
    IERC20 public paymentToken;       // MON (default payment token)
    IERC20 public ausdToken;          // AUSD stablecoin (full price)
    IERC20 public discountToken;      // Project token (discounted price)
    address public vault;
    address public facilitator;

    uint256 public platformFeeBps = 250;
    uint256 public originRoyaltyBps = 400;
    uint256 public parentRoyaltyBps = 350;
    uint256 public discountBps = 2000;    // 20% discount for project token

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

    constructor(address _soulNFT, address _paymentToken, address _vault) Ownable(msg.sender) {
        soulNFT = IERC1155(_soulNFT);
        paymentToken = IERC20(_paymentToken);
        vault = _vault;
    }

    modifier onlyFacilitator() {
        require(msg.sender == facilitator, "Not facilitator");
        _;
    }

    // ============ Admin Functions ============

    function setFacilitator(address _facilitator) external onlyOwner {
        address oldFacilitator = facilitator;
        facilitator = _facilitator;
        emit FacilitatorUpdated(oldFacilitator, _facilitator);
    }

    function setAusdToken(address _ausdToken) external onlyOwner {
        ausdToken = IERC20(_ausdToken);
    }

    function setDiscountToken(address _discountToken) external onlyOwner {
        discountToken = IERC20(_discountToken);
    }

    // ============ Listing ============

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

    // ============ Buy Functions ============

    /// @notice Buy with MON (default payment token) - full price
    function buy(uint256 listingId, uint256 amount, address to) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active && amount > 0 && amount <= listing.amount, "Invalid");

        uint256 totalPrice = listing.pricePerUnit * amount;
        _executePurchase(listingId, amount, totalPrice, to, paymentToken);
    }

    /// @notice Buy with AUSD stablecoin - full price
    function buyWithAusd(uint256 listingId, uint256 amount, address to) external nonReentrant {
        require(address(ausdToken) != address(0), "AUSD not configured");
        Listing storage listing = listings[listingId];
        require(listing.active && amount > 0 && amount <= listing.amount, "Invalid");

        uint256 totalPrice = listing.pricePerUnit * amount;
        _executePurchase(listingId, amount, totalPrice, to, ausdToken);
    }

    /// @notice Buy with project discount token - discounted price (20% off)
    function buyWithDiscountToken(uint256 listingId, uint256 amount, address to) external nonReentrant {
        require(address(discountToken) != address(0), "Discount token not configured");
        Listing storage listing = listings[listingId];
        require(listing.active && amount > 0 && amount <= listing.amount, "Invalid");

        uint256 totalPrice = listing.pricePerUnit * amount;
        uint256 discountedPrice = totalPrice - (totalPrice * discountBps) / 10000;
        _executePurchase(listingId, amount, discountedPrice, to, discountToken);
    }

    /// @notice Buy with permit (MON)
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
        _executePurchase(listingId, amount, totalPrice, to, paymentToken);
    }

    // ============ Internal ============

    function _executePurchase(
        uint256 listingId,
        uint256 amount,
        uint256 totalPrice,
        address to,
        IERC20 token
    ) internal {
        require(to != address(0), "Invalid recipient");
        Listing storage listing = listings[listingId];

        token.transferFrom(msg.sender, address(this), totalPrice);
        _distributePayment(listing.tokenId, listing.seller, totalPrice, token);
        soulNFT.safeTransferFrom(address(this), to, listing.tokenId, amount, "");

        listing.amount -= amount;
        if (listing.amount == 0) listing.active = false;

        emit Sold(listingId, msg.sender, to, amount, totalPrice);
    }

    function _distributePayment(
        uint256 tokenId,
        address seller,
        uint256 totalPrice,
        IERC20 token
    ) internal {
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

    // ============ Cancel ============

    function cancelListing(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender && listing.active, "Invalid");

        listing.active = false;
        soulNFT.safeTransferFrom(address(this), msg.sender, listing.tokenId, listing.amount, "");

        emit ListingCancelled(listingId);
    }

    // ============ x402 ============

    /**
     * @notice Purchase via x402 protocol - called by facilitator after payment settlement
     * @dev Payment has already been transferred by the facilitator contract
     * @param listingId The listing to purchase from
     * @param amount Number of tokens to purchase
     * @param buyer The agent/buyer who paid (for event logging)
     * @param recipient Address to receive the Soul NFT
     * @param paymentHash The settlement hash from X402Facilitator
     * @param tokenUsed The ERC20 token used for payment
     */
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

        // If paying with discount token, apply discount
        if (tokenUsed == address(discountToken) && address(discountToken) != address(0)) {
            totalPrice = totalPrice - (totalPrice * discountBps) / 10000;
        }

        // Payment already transferred to this contract by facilitator
        // Distribute to seller and royalty recipients
        _distributePayment(listing.tokenId, listing.seller, totalPrice, IERC20(tokenUsed));

        // Transfer Soul NFT to recipient
        soulNFT.safeTransferFrom(address(this), recipient, listing.tokenId, amount, "");

        listing.amount -= amount;
        if (listing.amount == 0) listing.active = false;

        emit SoldViaX402(listingId, buyer, recipient, amount, paymentHash);
    }

    // ============ Fee Management ============

    function setFees(uint256 _platform, uint256 _origin, uint256 _parent) external onlyOwner {
        require(_platform + _origin + _parent <= 3000, "Too high");
        platformFeeBps = _platform;
        originRoyaltyBps = _origin;
        parentRoyaltyBps = _parent;
    }

    // ============ View ============

    /// @notice Calculate discounted price for project token
    function getDiscountedPrice(uint256 price) external view returns (uint256) {
        return price - (price * discountBps) / 10000;
    }
}
