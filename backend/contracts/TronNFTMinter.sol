// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./TronNFTCollection.sol"; // Import the NFT contract
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract TronNFTMinter is ReentrancyGuard, AccessControl {
    TronNFTCollection private nftContract; // Instance of the TronNFTCollection contract// Whitelist for eligible accounts
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    mapping(uint256 => string) private _certificateURIs;
    mapping(address => string) private _whitelist;
    uint256 private _tokenIdsCounter;
    uint256 private _certificateIdsCounter;

    event AddressWhitelisted(address indexed account);
    event AddressRemovedFromWhitelist(address indexed account);
    event NFTMinted(address indexed recipient, uint256 tokenId, string uri);
    event CertificateUploaded(uint256 indexed tokenId, string uri);

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
                bytes(_whitelist[accounts[i]]).length == 0,
                "Address is already whitelisted"
            );
            _whitelist[accounts[i]] = uris[i];
            emit AddressWhitelisted(accounts[i]);
        }
    }

    // Admin function to remove addresses from the whitelist
    function removeFromWhitelist(
        address[] calldata accounts
    ) external onlyAdmin {
        for (uint256 i = 0; i < accounts.length; i++) {
            require(
                bytes(_whitelist[accounts[i]]).length > 0,
                "Address is not whitelisted"
            );
            delete _whitelist[accounts[i]];
            emit AddressRemovedFromWhitelist(accounts[i]);
        }
    }

    // Function for whitelisted users to mint their NFTs
    function mintNFT() external nonReentrant {
        require(
            bytes(_whitelist[msg.sender]).length > 0,
            "Address is not a whitelisted"
        );

        string memory uri = _whitelist[msg.sender]; // Get the URI associated with the minter
        require(bytes(uri).length > 0, "Invalid URI");

        uint256 tokenId = _tokenIdsCounter;
        _tokenIdsCounter++;

        // Mint the NFT via the linked TronNFTCollection contract
        nftContract.safeMint(msg.sender, tokenId, uri);
    }

    // Admin function to upload a certificate URI
    function uploadCertificateURI(string memory uri) external onlyAdmin {
        //check if the URI is valid
        require(bytes(uri).length > 0, "Invalid URI");
        _certificateIdsCounter++;
        uint256 certificateId = _certificateIdsCounter;
        //check if the token ID exists
        _certificateURIs[certificateId] = uri;
        emit CertificateUploaded(certificateId, uri);
    }

    function isWhitelisted(address account) public view returns (bool) {
        return bytes(_whitelist[account]).length > 0;
    }

    // Retrieve the certificate URI for a token ID
    function certificateURI(
        uint256 tokenId
    ) public view returns (string memory) {
        return _certificateURIs[tokenId];
    }
}
