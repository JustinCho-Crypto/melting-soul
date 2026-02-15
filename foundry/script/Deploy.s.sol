// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MockERC20.sol";
import "../src/MockAusd.sol";
import "../src/MockProjectToken.sol";
import "../src/SoulNFT.sol";
import "../src/SoulSale.sol";
import "../src/Vault.sol";
import "../src/AgentRegistry.sol";
import "../src/X402Facilitator.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        // Use existing payment token if provided, otherwise deploy MockERC20
        address paymentToken = vm.envOr("PAYMENT_TOKEN_ADDRESS", address(0));

        // Use real AUSD address if provided, otherwise deploy MockAusd
        address ausdToken = vm.envOr("AUSD_TOKEN_ADDRESS", address(0));

        vm.startBroadcast(deployerPrivateKey);

        // Deploy MockERC20 (MON) if no payment token provided
        if (paymentToken == address(0)) {
            MockERC20 mockToken = new MockERC20();
            paymentToken = address(mockToken);
            console.log("=== Payment Token (MockERC20 / MON) ===");
            console.log("MockERC20:", paymentToken);
        }

        // Use real AUSD or deploy MockAusd
        if (ausdToken == address(0)) {
            MockAusd mockAusd = new MockAusd();
            ausdToken = address(mockAusd);
            console.log("=== Stablecoin (MockAusd / AUSD) ===");
            console.log("MockAusd:", ausdToken);
        } else {
            console.log("=== Stablecoin (AUSD - existing) ===");
            console.log("AUSD:", ausdToken);
        }

        // Deploy MockProjectToken (discount token)
        MockProjectToken mockProjectToken = new MockProjectToken();
        console.log("=== Project Token (MockProjectToken / MST) ===");
        console.log("MockProjectToken:", address(mockProjectToken));

        // Core contracts
        SoulNFT soulNFT = new SoulNFT();
        Vault vault = new Vault(paymentToken);
        SoulSale soulSale = new SoulSale(address(soulNFT), paymentToken, address(vault));

        // Configure multi-token support on SoulSale
        soulSale.setAusdToken(ausdToken);
        soulSale.setDiscountToken(address(mockProjectToken));

        // ERC-8004 Agent Registry
        AgentRegistry agentRegistry = new AgentRegistry();

        // x402 Facilitator
        X402Facilitator facilitator = new X402Facilitator();

        // Bidirectional link: facilitator <-> SoulSale
        soulSale.setFacilitator(address(facilitator));
        facilitator.setSoulSale(address(soulSale));

        console.log("=== Core Contracts ===");
        console.log("SoulNFT:", address(soulNFT));
        console.log("Vault:", address(vault));
        console.log("SoulSale:", address(soulSale));

        console.log("=== Agent & x402 ===");
        console.log("AgentRegistry:", address(agentRegistry));
        console.log("X402Facilitator:", address(facilitator));

        console.log("=== Token Addresses (for .env) ===");
        console.log("PAYMENT_TOKEN (MON):", paymentToken);
        console.log("AUSD_TOKEN:", ausdToken);
        console.log("DISCOUNT_TOKEN (MST):", address(mockProjectToken));

        vm.stopBroadcast();
    }
}
