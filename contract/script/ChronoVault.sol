// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/ChronoVault.sol";

contract DeployChronoVault is Script {
    function run() external {
        // Load deployer private key from env (cast wallet import or foundry.toml)
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        console.log("Deployer Address:", vm.addr(deployerPrivateKey));

        // Start broadcasting transactions from deployer
        vm.startBroadcast(deployerPrivateKey);

        // Deploy contract with feeRecipient (use deployer or another address)
        address feeRecipient = vm.envAddress("FEE_RECIPIENT");
        ChronoVault vault = new ChronoVault(feeRecipient);

        vm.stopBroadcast();

        console.log("Somnia ChronoVault is deployed at:", address(vault));
    }
}
