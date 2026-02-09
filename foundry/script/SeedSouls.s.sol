// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SoulNFT.sol";

contract SeedSoulsScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address soulNFT = vm.envAddress("SOUL_NFT_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        SoulNFT nft = SoulNFT(soulNFT);

        string[16] memory names = [
            "Cynical Philosopher",
            "Passionate Coach",
            "Meticulous Code Reviewer",
            "Emotional Poet",
            "Sharp Critic",
            "Kind Teacher",
            "Humorous MC",
            "Cold Analyst",
            "Provocative Debater",
            "Warm Counselor",
            "Strict Trainer",
            "Curious Explorer",
            "Minimalist Advisor",
            "Strategic Gamer",
            "Sensory Chef",
            "Futuristic Visionary"
        ];

        for (uint256 i = 0; i < 16; i++) {
            string memory metadataUri = string.concat(
                "https://api.meltingsoul.xyz/metadata/",
                vm.toString(i + 1)
            );
            uint256 tokenId = nft.createSoul(metadataUri, 100);
            console.log("Minted Soul", names[i], "tokenId:", tokenId);
        }

        vm.stopBroadcast();
    }
}
