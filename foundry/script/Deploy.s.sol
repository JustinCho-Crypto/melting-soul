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
