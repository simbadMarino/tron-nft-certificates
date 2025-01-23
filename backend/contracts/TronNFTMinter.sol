// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./TronNFTCollection.sol"; // Import the NFT contract
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract TronNFTMinter is ReentrancyGuard, AccessControl {
    TronNFTCollection private nftContract; // Instance of the TronNFTCollection contract// Whitelist for eligible accounts
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    event AddressWhitelisted(address indexed account);
    event AddressRemovedFromWhitelist(address indexed account);
    event NFTMinted(address indexed recipient, uint256 tokenId, string uri);

    constructor(address _owner) {
        nftContract = TronNFTCollection(_owner); // Link the NFT contract
        _grantRole(ADMIN_ROLE, msg.sender); // Assign the deployer as the admin
    }

    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), "Caller is not an admin");
        _;
    }

    // Admin function to add addresses to the whitelist
    function addToWhitelist(
        address[] calldata accounts,
        string[] calldata uris
    ) external onlyAdmin {
        require(
            accounts.length == uris.length,
            "Accounts and URIs length mismatch"
        );
        for (uint256 i = 0; i < accounts.length; i++) {
            require(
                !nftContract.isMinter(accounts[i]),
                "Address is already whitelisted"
            );
            nftContract.addMinter(accounts[i], uris[i]); // Pass the URI to addMinter
            emit AddressWhitelisted(accounts[i]);
        }
    }

    // Admin function to remove addresses from the whitelist
    function removeFromWhitelist(
        address[] calldata accounts
    ) external onlyAdmin {
        for (uint256 i = 0; i < accounts.length; i++) {
            require(
                nftContract.isMinter(accounts[i]),
                "Address is not whitelisted"
            );
            nftContract.removeMinter(accounts[i]); // Remove the minter
            emit AddressRemovedFromWhitelist(accounts[i]);
        }
    }

    // Check if an address is whitelisted
    function isWhitelisted(address account) public view returns (bool) {
        return nftContract.isMinter(account);
    }

    // Function for whitelisted users to mint their NFTs
    function mintNFT(
        uint256 tokenId,
        string calldata uri
    ) external nonReentrant {
        require(nftContract.isMinter(msg.sender), "Address not whitelisted");
        require(bytes(uri).length > 0, "Invalid URI");

        // Mint the NFT via the linked TronNFTCollection contract
        nftContract.safeMint();

        emit NFTMinted(msg.sender, tokenId, uri);
    }
}
