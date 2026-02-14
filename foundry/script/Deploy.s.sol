// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MockERC20.sol";
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

        vm.startBroadcast(deployerPrivateKey);

        // Deploy MockERC20 if no payment token provided
        if (paymentToken == address(0)) {
            MockERC20 mockToken = new MockERC20();
            paymentToken = address(mockToken);
            console.log("=== Payment Token (MockERC20) ===");
            console.log("MockERC20:", paymentToken);
        }

        // Core contracts
        SoulNFT soulNFT = new SoulNFT();
        Vault vault = new Vault(paymentToken);
        SoulSale soulSale = new SoulSale(address(soulNFT), paymentToken, address(vault));

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

        vm.stopBroadcast();
    }
}
