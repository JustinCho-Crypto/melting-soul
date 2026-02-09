# 01. Smart Contracts

---

## Contract Structure

```
contracts/
├── SoulNFT.sol          # ERC-1155 Soul NFT
├── SoulSale.sol         # Sale/Purchase logic
└── Vault.sol            # Platform fee management
```

---

## 1. SoulNFT.sol (ERC-1155)

### Role
- Soul NFT minting
- Record Fork relationships (parentId, generation)
- Metadata URI management

### Data Structure

```solidity
struct SoulInfo {
    address creator;        // Creator
    uint256 parentId;       // Parent Soul ID (0 = Origin)
    uint256 generation;     // Generation (Origin = 0)
    uint256 forkCount;      // Number of times forked
    uint256 totalMinted;    // Total minted supply
    uint256 createdAt;      // Creation timestamp
    string metadataUri;     // Public metadata URI
}

mapping(uint256 => SoulInfo) public souls;
```

### Key Functions

```solidity
// Create Origin Soul
function createSoul(
    string calldata metadataUri,
    uint256 initialSupply
) external returns (uint256 tokenId);

// Fork (create new Soul based on existing)
function forkSoul(
    uint256 parentTokenId,
    string calldata metadataUri,
    uint256 initialSupply
) external returns (uint256 newTokenId);

// Additional minting (creator only)
function mintMore(uint256 tokenId, uint256 amount) external;

// Lineage query (ancestor list)
function getLineage(uint256 tokenId) external view returns (uint256[] memory);
```

### Full Code

```solidity
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
```

---

## 2. SoulSale.sol

### Role
- List for sale
- Process purchases (buy, buyWithPermit)
- Distribute fees/royalties

### Fee Structure

```solidity
uint256 public platformFeeBps = 250;    // 2.5%
uint256 public originRoyaltyBps = 500;  // 5%
uint256 public parentRoyaltyBps = 300;  // 3%
```

### Key Functions

```solidity
// List for sale
function list(
    uint256 tokenId,
    uint256 amount,
    uint256 pricePerUnit
) external returns (uint256 listingId);

// Buy (requires pre-approve)
function buy(uint256 listingId, uint256 amount) external;

// Buy with Permit
function buyWithPermit(
    uint256 listingId,
    uint256 amount,
    uint256 deadline,
    uint8 v, bytes32 r, bytes32 s
) external;

// Cancel listing
function cancelListing(uint256 listingId) external;
```

### Full Code

```solidity
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
    event Sold(uint256 indexed listingId, address indexed buyer, uint256 amount, uint256 totalPrice);
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

    function buy(uint256 listingId, uint256 amount) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active && amount > 0 && amount <= listing.amount, "Invalid");

        uint256 totalPrice = listing.pricePerUnit * amount;
        _executePurchase(listingId, amount, totalPrice);
    }

    function buyWithPermit(
        uint256 listingId,
        uint256 amount,
        uint256 deadline,
        uint8 v, bytes32 r, bytes32 s
    ) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active && amount > 0 && amount <= listing.amount, "Invalid");

        uint256 totalPrice = listing.pricePerUnit * amount;

        IERC20Permit(address(paymentToken)).permit(msg.sender, address(this), totalPrice, deadline, v, r, s);
        _executePurchase(listingId, amount, totalPrice);
    }

    function _executePurchase(uint256 listingId, uint256 amount, uint256 totalPrice) internal {
        Listing storage listing = listings[listingId];

        paymentToken.transferFrom(msg.sender, address(this), totalPrice);
        _distributePayment(listing.tokenId, listing.seller, totalPrice);
        soulNFT.safeTransferFrom(address(this), msg.sender, listing.tokenId, amount, "");

        listing.amount -= amount;
        if (listing.amount == 0) listing.active = false;

        emit Sold(listingId, msg.sender, amount, totalPrice);
    }

    function _distributePayment(uint256 tokenId, address seller, uint256 totalPrice) internal {
        (address creator, uint256 parentId, uint256 generation,,,,) = ISoulNFT(address(soulNFT)).souls(tokenId);

        uint256 platformFee = (totalPrice * platformFeeBps) / 10000;
        uint256 originRoyalty = 0;
        uint256 parentRoyalty = 0;

        if (generation > 0) {
            // Find Origin
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
```

---

## 3. Vault.sol

### Role
- Store platform fees
- Manage withdrawals

### Full Code

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Vault is Ownable {
    IERC20 public paymentToken;

    event Withdrawn(address indexed to, uint256 amount);

    constructor(address _paymentToken) Ownable(msg.sender) {
        paymentToken = IERC20(_paymentToken);
    }

    function withdraw(address to, uint256 amount) external onlyOwner {
        paymentToken.transfer(to, amount);
        emit Withdrawn(to, amount);
    }

    function balance() external view returns (uint256) {
        return paymentToken.balanceOf(address(this));
    }
}
```

---

## Foundry Project Structure

```
foundry/
├── src/
│   ├── SoulNFT.sol
│   ├── SoulSale.sol
│   └── Vault.sol
├── test/
│   └── SoulMarketplace.t.sol
├── script/
│   └── Deploy.s.sol
├── foundry.toml
└── .env
```

### foundry.toml

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc = "0.8.20"

[rpc_endpoints]
monad_testnet = "${RPC_URL}"
```

### Deploy.s.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SoulNFT.sol";
import "../src/SoulSale.sol";
import "../src/Vault.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address paymentToken = vm.envAddress("PAYMENT_TOKEN_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        SoulNFT soulNFT = new SoulNFT();
        Vault vault = new Vault(paymentToken);
        SoulSale soulSale = new SoulSale(address(soulNFT), paymentToken, address(vault));

        console.log("SoulNFT:", address(soulNFT));
        console.log("Vault:", address(vault));
        console.log("SoulSale:", address(soulSale));

        vm.stopBroadcast();
    }
}
```
