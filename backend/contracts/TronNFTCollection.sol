// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract TronNFTCollection is
    ERC721,
    ERC721URIStorage,
    Ownable,
    ERC721Burnable,
    AccessControl
{
    mapping(uint256 => string) private _certificateURIs;
    mapping(address => string) private _allowedMinters;
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    uint256 private _tokenIdsCounter;
    uint256 private _certificateIdsCounter;

    event AddressWhitelisted(address indexed account);
    event AddressRemovedFromWhitelist(address indexed account);
    event NFTMinted(address indexed recipient, uint256 tokenId, string uri);
    event CertificateUploaded(uint256 certificateId, string uri);
    constructor(
        address _owner
    )
        ERC721("Tron NFT Collection", "TNC")
        ERC721URIStorage()
        Ownable(msg.sender)
    {
        _grantRole(ADMIN_ROLE, msg.sender); // Assign the deployer as the admin
    }

    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), "Caller is not an admin");
        _;
    }

    function safeMint() external {
        require(
            bytes(_allowedMinters[msg.sender]).length > 0,
            "Address not whitelisted"
        );
        string memory uri = _allowedMinters[msg.sender]; // Get the URI associated with the minter
        require(bytes(uri).length > 0, "Invalid URI");

        // Use _certificateIdsCounter as the token ID
        _certificateIdsCounter++;
        uint256 tokenId = _certificateIdsCounter;

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);
        _certificateURIs[tokenId] = uri;

        emit NFTMinted(msg.sender, tokenId, uri);
    }

    // Retrieve the certificate URI for a token ID
    function certificateURI(
        uint256 tokenId
    ) public view returns (string memory) {
        return _certificateURIs[tokenId];
    }

    // Override functions required by Solidity
    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(ERC721, ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function addMinter(address minter, string memory uri) external onlyAdmin {
        //check if the address is not already a minter
        require(
            bytes(_allowedMinters[minter]).length == 0,
            "Address is already a minter"
        );
        _allowedMinters[minter] = uri;
        emit AddressWhitelisted(minter);
    }

    function removeMinter(address minter) external onlyAdmin {
        //check if the address is a minter
        require(
            bytes(_allowedMinters[minter]).length > 0,
            "Address is not a minter"
        );
        delete _allowedMinters[minter];
        emit AddressRemovedFromWhitelist(minter);
    }

    function isMinter(address minter) public view returns (bool) {
        return bytes(_allowedMinters[minter]).length > 0;
    }

    function uploadCertificateURI(string memory uri) external onlyAdmin {
        //check if the URI is valid
        require(bytes(uri).length > 0, "Invalid URI");
        _certificateIdsCounter++;
        uint256 certificateId = _certificateIdsCounter;
        //check if the token ID exists
        _certificateURIs[certificateId] = uri;
        emit CertificateUploaded(certificateId, uri);
    }
}
