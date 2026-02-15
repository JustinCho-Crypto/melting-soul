// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SoulNFT.sol";
import "../src/SoulSale.sol";
import "../src/Vault.sol";
import "../src/AgentRegistry.sol";
import "../src/X402Facilitator.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        address ausdToken = vm.envAddress("AUSD_TOKEN_ADDRESS");
        address discountToken = vm.envAddress("DISCOUNT_TOKEN_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        // Core contracts
        SoulNFT soulNFT = new SoulNFT();
        Vault vault = new Vault();
        SoulSale soulSale = new SoulSale(address(soulNFT), ausdToken, discountToken, address(vault));

        // ERC-8004 Agent Registry
        AgentRegistry agentRegistry = new AgentRegistry();

        // x402 Facilitator
        X402Facilitator facilitator = new X402Facilitator();

        // Link facilitator to SoulSale
        soulSale.setFacilitator(address(facilitator));

        console.log("=== Core Contracts ===");
        console.log("SoulNFT:", address(soulNFT));
        console.log("Vault:", address(vault));
        console.log("SoulSale:", address(soulSale));

        console.log("=== Token Addresses ===");
        console.log("aUSD Token:", ausdToken);
        console.log("Discount Token:", discountToken);

        console.log("=== Agent & x402 ===");
        console.log("AgentRegistry:", address(agentRegistry));
        console.log("X402Facilitator:", address(facilitator));

        vm.stopBroadcast();
    }
}
