// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SoulNFT.sol";
import "../src/SoulSale.sol";
import "../src/Vault.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20 {
    constructor() ERC20("Mock", "MCK") {
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
    MockToken public token;

    address public deployer = address(this);
    address public alice = address(0xA);
    address public bob = address(0xB);

    function setUp() public {
        token = new MockToken();
        soulNFT = new SoulNFT();
        vault = new Vault(address(token));
        soulSale = new SoulSale(address(soulNFT), address(token), address(vault));

        token.mint(alice, 10_000 ether);
        token.mint(bob, 10_000 ether);
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

    // --- SoulSale Tests ---

    function test_listAndBuy() public {
        vm.prank(alice);
        soulNFT.createSoul("ipfs://soul1", 100);

        vm.prank(alice);
        soulNFT.setApprovalForAll(address(soulSale), true);

        vm.prank(alice);
        uint256 listingId = soulSale.list(1, 10, 1 ether);
        assertEq(listingId, 1);

        vm.prank(bob);
        token.approve(address(soulSale), 5 ether);

        vm.prank(bob);
        soulSale.buy(1, 5);

        assertEq(soulNFT.balanceOf(bob, 1), 5);
    }

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

    function test_feeDistribution_origin() public {
        // Alice creates origin soul
        vm.prank(alice);
        soulNFT.createSoul("ipfs://origin", 100);

        // Bob forks it
        vm.prank(bob);
        uint256 forkId = soulNFT.forkSoul(1, "ipfs://fork", 50);

        // Bob lists fork
        vm.prank(bob);
        soulNFT.setApprovalForAll(address(soulSale), true);

        vm.prank(bob);
        soulSale.list(forkId, 10, 100 ether);

        // Alice (buyer here, different from creator) buys fork
        uint256 aliceBalBefore = token.balanceOf(alice);

        vm.prank(alice);
        token.approve(address(soulSale), 100 ether);

        vm.prank(alice);
        soulSale.buy(1, 1);

        // Alice (origin creator) should get 5% royalty = 5 ether
        // But alice is also the buyer, so net = -100 + 5 = -95
        uint256 aliceBalAfter = token.balanceOf(alice);
        uint256 aliceSpent = aliceBalBefore - aliceBalAfter;
        assertEq(aliceSpent, 95 ether);

        // Vault gets 2.5% = 2.5 ether
        assertEq(token.balanceOf(address(vault)), 2.5 ether);
    }

    // --- Vault Tests ---

    function test_vaultWithdraw() public {
        token.transfer(address(vault), 100 ether);
        vault.withdraw(alice, 50 ether);
        assertEq(token.balanceOf(alice), 10_050 ether);
        assertEq(token.balanceOf(address(vault)), 50 ether);
    }

    function test_vaultBalance() public {
        token.transfer(address(vault), 100 ether);
        assertEq(vault.balance(), 100 ether);
    }
}
