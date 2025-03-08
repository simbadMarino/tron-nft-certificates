// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";

contract NFTCertificatesCollection is ERC721, ERC721URIStorage, ERC721Burnable {
    uint256 private _tokenIdsCounter;
    address public owner;
    event AddressWhitelisted(address indexed account);
    event AddressRemovedFromWhitelist(address indexed account);
    event NFTMinted(address indexed recipient, uint256 tokenId, string uri);

    constructor() ERC721("NFT Certificates", "NFTC") ERC721URIStorage() {
        owner = payable(msg.sender); // Assign the deployer as the owner
    }

    // Modifier to restrict certain functions to only the contract owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner may call function");
        _;
    }

    function safeMint(
        address recipient,
        uint256 tokenId,
        string memory uri
    ) external onlyOwner {
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

    function changeOwner(address _newOwner) external onlyOwner {
        owner = _newOwner;
    }
}
