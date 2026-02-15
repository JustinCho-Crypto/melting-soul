// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SoulNFT.sol";
import "../src/SoulSale.sol";
import "../src/Vault.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20 {
    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {
        _mint(msg.sender, 1_000_000 ether);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract SoulMarketplaceTest is Test {
    SoulNFT public soulNFT;
    SoulSale public soulSale;
    Vault public vault;
    MockToken public ausdToken;
    MockToken public discountToken;

    address public deployer = address(this);
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");

    function setUp() public {
        ausdToken = new MockToken("aUSD", "aUSD");
        discountToken = new MockToken("SOUL", "SOUL");
        soulNFT = new SoulNFT();
        vault = new Vault();
        soulSale = new SoulSale(address(soulNFT), address(ausdToken), address(discountToken), address(vault));

        ausdToken.mint(alice, 10_000 ether);
        ausdToken.mint(bob, 10_000 ether);
        discountToken.mint(alice, 10_000 ether);
        discountToken.mint(bob, 10_000 ether);
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
    }

    // --- SoulNFT Tests ---

    function test_createSoul() public {
        vm.prank(alice);
        uint256 tokenId = soulNFT.createSoul("ipfs://soul1", 100);

        assertEq(tokenId, 1);
        assertEq(soulNFT.balanceOf(alice, 1), 100);

        (address creator, uint256 parentId, uint256 gen, uint256 forkCount, uint256 totalMinted,,) = soulNFT.souls(1);
        assertEq(creator, alice);
        assertEq(parentId, 0);
        assertEq(gen, 0);
        assertEq(forkCount, 0);
        assertEq(totalMinted, 100);
    }

    function test_forkSoul() public {
        vm.prank(alice);
        soulNFT.createSoul("ipfs://soul1", 100);

        vm.prank(bob);
        uint256 forkId = soulNFT.forkSoul(1, "ipfs://fork1", 50);

        assertEq(forkId, 2);
        assertEq(soulNFT.balanceOf(bob, 2), 50);

        (address creator, uint256 parentId, uint256 gen,,,, ) = soulNFT.souls(2);
        assertEq(creator, bob);
        assertEq(parentId, 1);
        assertEq(gen, 1);

        (,,, uint256 forkCount,,,) = soulNFT.souls(1);
        assertEq(forkCount, 1);
    }

    function test_forkSoul_revert_invalidParent() public {
        vm.prank(bob);
        vm.expectRevert("Parent not exist");
        soulNFT.forkSoul(999, "ipfs://bad", 10);
    }

    function test_mintMore() public {
        vm.prank(alice);
        soulNFT.createSoul("ipfs://soul1", 100);

        vm.prank(alice);
        soulNFT.mintMore(1, 50);

        assertEq(soulNFT.balanceOf(alice, 1), 150);
        (,,,, uint256 totalMinted,,) = soulNFT.souls(1);
        assertEq(totalMinted, 150);
    }

    function test_mintMore_revert_notCreator() public {
        vm.prank(alice);
        soulNFT.createSoul("ipfs://soul1", 100);

        vm.prank(bob);
        vm.expectRevert("Not creator");
        soulNFT.mintMore(1, 50);
    }

    function test_uri() public {
        vm.prank(alice);
        soulNFT.createSoul("ipfs://soul1", 100);

        assertEq(soulNFT.uri(1), "ipfs://soul1");
    }

    function test_getLineage() public {
        vm.prank(alice);
        soulNFT.createSoul("ipfs://origin", 100);

        vm.prank(bob);
        soulNFT.forkSoul(1, "ipfs://gen1", 50);

        vm.prank(alice);
        soulNFT.forkSoul(2, "ipfs://gen2", 25);

        uint256[] memory lineage = soulNFT.getLineage(3);
        assertEq(lineage.length, 2);
        assertEq(lineage[0], 2);
        assertEq(lineage[1], 1);
    }

    // --- SoulSale: Buy with MON (native) ---

    function test_buyWithMON() public {
        vm.prank(alice);
        soulNFT.createSoul("ipfs://soul1", 100);

        vm.prank(alice);
        soulNFT.setApprovalForAll(address(soulSale), true);

        vm.prank(alice);
        soulSale.list(1, 10, 1 ether);

        vm.prank(bob);
        soulSale.buy{value: 5 ether}(1, 5, bob);

        assertEq(soulNFT.balanceOf(bob, 1), 5);
    }

    function test_buyWithMON_revert_incorrectValue() public {
        vm.prank(alice);
        soulNFT.createSoul("ipfs://soul1", 100);

        vm.prank(alice);
        soulNFT.setApprovalForAll(address(soulSale), true);

        vm.prank(alice);
        soulSale.list(1, 10, 1 ether);

        vm.prank(bob);
        vm.expectRevert("Incorrect MON amount");
        soulSale.buy{value: 3 ether}(1, 5, bob);
    }

    // --- SoulSale: Buy with aUSD (ERC20, full price) ---

    function test_buyWithAusd() public {
        vm.prank(alice);
        soulNFT.createSoul("ipfs://soul1", 100);

        vm.prank(alice);
        soulNFT.setApprovalForAll(address(soulSale), true);

        vm.prank(alice);
        soulSale.list(1, 10, 1 ether);

        vm.prank(bob);
        ausdToken.approve(address(soulSale), 5 ether);

        vm.prank(bob);
        soulSale.buyWithAusd(1, 5, bob);

        assertEq(soulNFT.balanceOf(bob, 1), 5);
    }

    // --- SoulSale: Buy with $SOUL discount token (80% price) ---

    function test_buyWithDiscountToken() public {
        vm.prank(alice);
        soulNFT.createSoul("ipfs://soul1", 100);

        vm.prank(alice);
        soulNFT.setApprovalForAll(address(soulSale), true);

        vm.prank(alice);
        soulSale.list(1, 10, 100 ether);

        // Discounted price: 100 * 80% = 80 ether per unit, 5 units = 400 ether
        vm.prank(bob);
        discountToken.approve(address(soulSale), 400 ether);

        vm.prank(bob);
        soulSale.buyWithDiscountToken(1, 5, bob);

        assertEq(soulNFT.balanceOf(bob, 1), 5);
    }

    // --- Discount price calculation ---

    function test_getDiscountedPrice() public view {
        // 20% discount: 100 -> 80
        assertEq(soulSale.getDiscountedPrice(100), 80);
        assertEq(soulSale.getDiscountedPrice(1000), 800);
        assertEq(soulSale.getDiscountedPrice(1 ether), 0.8 ether);
    }

    // --- Fee Distribution: MON gen1 (4% origin, 2.5% platform) ---

    function test_feeDistribution_MON_gen1() public {
        // Alice creates origin soul
        vm.prank(alice);
        soulNFT.createSoul("ipfs://origin", 100);

        // Bob forks it (gen 1)
        vm.prank(bob);
        uint256 forkId = soulNFT.forkSoul(1, "ipfs://fork", 50);

        // Bob lists fork
        vm.prank(bob);
        soulNFT.setApprovalForAll(address(soulSale), true);

        vm.prank(bob);
        soulSale.list(forkId, 10, 10 ether);

        address charlie = makeAddr("charlie");
        vm.deal(charlie, 100 ether);

        uint256 aliceBalBefore = alice.balance;
        uint256 vaultBalBefore = address(vault).balance;

        vm.prank(charlie);
        soulSale.buy{value: 10 ether}(1, 1, charlie);

        // Alice (origin creator) gets 4% = 0.4 ether
        assertEq(alice.balance - aliceBalBefore, 0.4 ether);
        // Vault gets 2.5% = 0.25 ether
        assertEq(address(vault).balance - vaultBalBefore, 0.25 ether);
    }

    // --- Fee Distribution: MON gen2 (4% origin, 3.5% parent, 2.5% platform) ---

    function test_feeDistribution_MON_gen2() public {
        // Alice creates origin soul (gen 0)
        vm.prank(alice);
        soulNFT.createSoul("ipfs://origin", 100);

        // Bob forks it (gen 1)
        vm.prank(bob);
        soulNFT.forkSoul(1, "ipfs://gen1", 50);

        // Charlie forks bob's (gen 2)
        address charlie = makeAddr("charlie2");
        vm.prank(charlie);
        uint256 gen2Id = soulNFT.forkSoul(2, "ipfs://gen2", 25);

        // Charlie lists gen2
        vm.prank(charlie);
        soulNFT.setApprovalForAll(address(soulSale), true);

        vm.prank(charlie);
        soulSale.list(gen2Id, 5, 100 ether);

        address dave = makeAddr("dave");
        vm.deal(dave, 200 ether);

        uint256 aliceBalBefore = alice.balance;
        uint256 bobBalBefore = bob.balance;
        uint256 vaultBalBefore = address(vault).balance;
        uint256 charlieBalBefore = charlie.balance;

        vm.prank(dave);
        soulSale.buy{value: 100 ether}(1, 1, dave);

        // Alice (origin) gets 4% = 4 ether
        assertEq(alice.balance - aliceBalBefore, 4 ether);
        // Bob (parent) gets 3.5% = 3.5 ether
        assertEq(bob.balance - bobBalBefore, 3.5 ether);
        // Vault gets 2.5% = 2.5 ether
        assertEq(address(vault).balance - vaultBalBefore, 2.5 ether);
        // Charlie (seller) gets remainder: 100 - 4 - 3.5 - 2.5 = 90 ether
        assertEq(charlie.balance - charlieBalBefore, 90 ether);
    }

    // --- Vault Tests ---

    function test_vaultWithdraw() public {
        // Send native MON to vault
        vm.deal(address(vault), 100 ether);
        vault.withdraw(alice, 50 ether);
        assertEq(alice.balance, 150 ether); // alice had 100 from setUp + 50

        // Send ERC20 to vault
        ausdToken.transfer(address(vault), 100 ether);
        vault.withdrawToken(address(ausdToken), bob, 50 ether);
        assertEq(ausdToken.balanceOf(bob), 10_050 ether); // bob had 10_000 from setUp + 50
    }

    function test_vaultBalance() public {
        vm.deal(address(vault), 100 ether);
        assertEq(vault.balance(), 100 ether);
    }

    function test_vaultBalanceOf() public {
        ausdToken.transfer(address(vault), 100 ether);
        assertEq(vault.balanceOf(address(ausdToken)), 100 ether);
    }

    // --- Cancel Listing ---

    function test_cancelListing() public {
        vm.prank(alice);
        soulNFT.createSoul("ipfs://soul1", 100);

        vm.prank(alice);
        soulNFT.setApprovalForAll(address(soulSale), true);

        vm.prank(alice);
        soulSale.list(1, 10, 1 ether);

        vm.prank(alice);
        soulSale.cancelListing(1);

        assertEq(soulNFT.balanceOf(alice, 1), 100);
    }

    // --- Buy to other address ---

    function test_buyToOtherAddress() public {
        address charlie = makeAddr("charlie3");

        vm.prank(alice);
        soulNFT.createSoul("ipfs://soul1", 100);

        vm.prank(alice);
        soulNFT.setApprovalForAll(address(soulSale), true);

        vm.prank(alice);
        soulSale.list(1, 10, 1 ether);

        // Bob pays MON, but NFT goes to Charlie
        vm.prank(bob);
        soulSale.buy{value: 5 ether}(1, 5, charlie);

        assertEq(soulNFT.balanceOf(charlie, 1), 5);
        assertEq(soulNFT.balanceOf(bob, 1), 0);
    }
}
