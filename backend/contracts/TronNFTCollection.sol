// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
contract TronNFTCollection is ERC721, ERC721URIStorage, Ownable, ERC721Burnable, AccessControl {
    mapping(uint256 => string) private _certificateURIs; // Mapping for storing 
    mapping(address => bool) private _allowedMinters;
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    uint256 private _tokenIdsCounter;

    constructor(address _owner) ERC721("Tron NFT Collection", "TNC") ERC721URIStorage() Ownable(msg.sender) {
        _grantRole(ADMIN_ROLE, msg.sender); // Assign the deployer as the admin
    }

    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), "Caller is not an admin");
        _;
    }

    function safeMint(address to, uint256 tokenId, string memory uri) external {
        require(_allowedMinters[msg.sender], "Not allowed to mint");
        require(bytes(uri).length > 0, "Invalid URI");
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        _certificateURIs[tokenId] = uri;
    }

    // Retrieve the certificate URI for a token ID
    function certificateURI(uint256 tokenId) public view returns (string memory) {
        return _certificateURIs[tokenId];
    }

    // Override functions required by Solidity
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function addMinter(address minter) external onlyAdmin {
        //check if the address is not already a minter
        require(!_allowedMinters[minter], "Address already a minter");
        _allowedMinters[minter] = true;
    }

    function removeMinter(address minter) external onlyAdmin {
        //check if the address is a minter
        require(_allowedMinters[minter], "Address is not a minter");
        _allowedMinters[minter] = false;
    }

    function isMinter(address minter) public view returns (bool) {
        return _allowedMinters[minter];
    }

    function uploadCertificateURI(string memory uri) external onlyAdmin {
        //check if the URI is valid
        require(bytes(uri).length > 0, "Invalid URI");
        _tokenIdsCounter++;
        uint256 tokenId = _tokenIdsCounter;
        //check if the token ID exists
        _certificateURIs[tokenId] = uri;
    }

}
