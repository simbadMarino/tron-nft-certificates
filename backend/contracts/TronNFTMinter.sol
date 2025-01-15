// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./TronNFTCollection.sol"; // Import the NFT contract
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TronNFTMinter is Ownable, ReentrancyGuard {
    TronNFTCollection private nftContract; // Instance of the TronNFTCollection contract
    mapping(address => bool) private whitelistedAddresses; // Whitelist for eligible accounts

    event AddressWhitelisted(address indexed account);
    event AddressRemovedFromWhitelist(address indexed account);
    event NFTMinted(address indexed recipient, uint256 tokenId, string uri);

    constructor(address _owner) Ownable(_owner) {
        nftContract = TronNFTCollection(_owner); // Link the NFT contract
    }

    // Admin function to add addresses to the whitelist
    function addToWhitelist(address[] calldata accounts) external onlyOwner {
        for (uint256 i = 0; i < accounts.length; i++) {
            // Check if the address is not already whitelisted
            require(!whitelistedAddresses[accounts[i]], "Address is already whitelisted");

            // Add the address to the whitelist
            whitelistedAddresses[accounts[i]] = true;
            emit AddressWhitelisted(accounts[i]);
        }
    }

    // Admin function to remove addresses from the whitelist
    function removeFromWhitelist(address[] calldata accounts) external onlyOwner {
        for (uint256 i = 0; i < accounts.length; i++) {
            // Check if the address is whitelisted
            require(whitelistedAddresses[accounts[i]], "Address is not whitelisted");

            // Remove the address from the whitelist
            whitelistedAddresses[accounts[i]] = false;
            emit AddressRemovedFromWhitelist(accounts[i]);
        }
    }

    // Check if an address is whitelisted
    function isWhitelisted(address account) public view returns (bool) {
        return whitelistedAddresses[account];
    }

    // Function for whitelisted users to mint their NFTs
    function mintNFT(uint256 tokenId, string calldata uri) external nonReentrant {
        require(whitelistedAddresses[msg.sender], "Address not whitelisted");
        require(bytes(uri).length > 0, "Invalid URI");

        // Mint the NFT via the linked TronNFTCollection contract
        nftContract.safeMint(msg.sender, tokenId, uri);

        emit NFTMinted(msg.sender, tokenId, uri);
    }
}
