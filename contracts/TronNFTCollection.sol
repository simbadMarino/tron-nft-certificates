// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TronNFTCollection is ERC721, ERC721URIStorage, Ownable {
    mapping(uint256 => string) private _certificateURIs; // Mapping for storing certificate URIs

    constructor(address _owner) ERC721("MyToken", "MTK") ERC721URIStorage() Ownable(_owner) {}

    function safeMint(address to, uint256 tokenId, string memory uri) public onlyOwner {
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
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
