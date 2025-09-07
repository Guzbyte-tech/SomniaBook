// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/SomniaBook.sol";

contract DeploySomniaBook is Script {
    function run() external {
        // Load deployer private key from env (cast wallet import or foundry.toml)
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Start broadcasting transactions from deployer
        vm.startBroadcast(deployerPrivateKey);

        // Deploy contract with feeRecipient (use deployer or another address)
        address feeRecipient = vm.envAddress("FEE_RECIPIENT");
        SomniaBook somniaBook = new SomniaBook(feeRecipient);

        vm.stopBroadcast();

        console.log("SomniaBook deployed at:", address(somniaBook));
    }
}
