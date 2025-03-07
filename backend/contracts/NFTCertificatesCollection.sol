// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
//import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";

//import "@openzeppelin/contracts/access/AccessControl.sol";

contract NFTCertificatesCollection is ERC721, ERC721URIStorage, ERC721Burnable {
    // address public owner; // Address of the wallet's owner
    uint256 private _tokenIdsCounter;

    event AddressWhitelisted(address indexed account);
    event AddressRemovedFromWhitelist(address indexed account);
    event NFTMinted(address indexed recipient, uint256 tokenId, string uri);

    // Modifier to restrict certain functions to only the contract owner
    /* modifier onlyAdmin() {
        require(msg.sender == owner, "Only owner may call function");
        _;
    }*/

    constructor() ERC721("NFT Certificates", "NFTC") ERC721URIStorage() {
        //  owner = payable(msg.sender); // Assign the deployer as the owner
    }

    function safeMint(
        address recipient,
        uint256 tokenId,
        string memory uri
    ) external {
        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, uri);

        emit NFTMinted(recipient, tokenId, uri);
    }

    // Override functions required by Solidity
    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    /*
    // Function to change the owner of the contract
    function changeOwner(address _newOwnerAddress) external onlyAdmin {
        owner = _newOwnerAddress;
    }*/
}
