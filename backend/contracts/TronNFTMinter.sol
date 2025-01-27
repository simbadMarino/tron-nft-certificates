// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./TronNFTCollection.sol"; // Import the NFT contract
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract TronNFTMinter is ReentrancyGuard, AccessControl {
    TronNFTCollection private nftContract; // Instance of the TronNFTCollection contract// Whitelist for eligible accounts
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    uint256 private _tokenIdsCounter;
    mapping(address => uint256) private _nftCount;
    mapping(address => string[]) private _whitelist;

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
            _whitelist[accounts[i]].push(uris[i]); // Store each URI

            emit AddressWhitelisted(accounts[i]);
        }
    }

    // Admin function to remove addresses from the whitelist
    function removeFromWhitelist(
        address[] calldata accounts
    ) external onlyAdmin {
        for (uint256 i = 0; i < accounts.length; i++) {
            require(
                _whitelist[accounts[i]].length > 0,
                "Address is not whitelisted"
            );
            delete _whitelist[accounts[i]];
            emit AddressRemovedFromWhitelist(accounts[i]);
        }
    }

    // Function for whitelisted users to mint their NFTs
    function mintNFT() external nonReentrant {
        require(
            _whitelist[msg.sender].length > 0,
            "Address is not whitelisted"
        );

        uint256 nftCount = _nftCount[msg.sender]; // Get the count of minted NFTs
        require(
            nftCount < _whitelist[msg.sender].length,
            "No more NFTs to mint"
        );

        string memory uri = _whitelist[msg.sender][nftCount]; // Get the next URI to mint
        require(bytes(uri).length > 0, "Invalid URI");

        _tokenIdsCounter++;
        uint256 tokenId = _tokenIdsCounter;

        // Mint the NFT via the linked TronNFTCollection contract
        nftContract.safeMint(msg.sender, tokenId, uri);

        _nftCount[msg.sender]++; // Increment the nft count for the user
        emit NFTMinted(msg.sender, tokenId, uri);
    }

    function isWhitelisted(address account) public view returns (bool) {
        return _whitelist[account].length > 0;
    }

    function hasMinted(address account) public view returns (bool) {
        return _nftCount[account] == _whitelist[account].length;
    }

    function getMintedNFTCount(address account) public view returns (uint256) {
        return _nftCount[account];
    }

    // Retrieve the certificate URI for a given account
    function certificateURI(
        address account
    ) public view returns (string[] memory) {
        return _whitelist[account];
    }
}
