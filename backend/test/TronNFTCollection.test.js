const TronNFTMinter = artifacts.require("TronNFTMinter");
const TronNFTCollection = artifacts.require("TronNFTCollection");

import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";
use(chaiAsPromised);

contract("TronNFTMinter and TronNFTCollection", (accounts) => {
  const [owner, user1, user2] = accounts;

  let nftCollection;
  let nftMinter;

  beforeEach(async () => {
    // Deploy NFT collection contract
    nftCollection = await TronNFTCollection.new(owner, { from: owner });

    // Deploy minter contract
    nftMinter = await TronNFTMinter.new(nftCollection.address, { from: owner });
  });

  describe("Deployment", () => {
    it("should deploy TronNFTCollection and TronNFTMinter contracts", async () => {
      expect(nftCollection.address).to.exist;
      expect(nftMinter.address).to.exist;
    });
  });

  describe("Whitelist Management", () => {
    it("should allow the owner to add addresses to the whitelist", async () => {
      await nftMinter.addToWhitelist([user1, user2], { from: owner });

      const isUser1Whitelisted = await nftMinter.isWhitelisted(user1);
      const isUser2Whitelisted = await nftMinter.isWhitelisted(user2);

      expect(isUser1Whitelisted).to.be.true;
      expect(isUser2Whitelisted).to.be.true;
    });

    it("should allow the owner to remove addresses from the whitelist", async () => {
      await nftMinter.addToWhitelist([user1], { from: owner });

      const isUser1WhitelistedBefore = await nftMinter.isWhitelisted(user1);
      expect(isUser1WhitelistedBefore).to.be.true;

      await nftMinter.removeFromWhitelist([user1], { from: owner });

      const isUser1WhitelistedAfter = await nftMinter.isWhitelisted(user1);
      expect(isUser1WhitelistedAfter).to.be.false;
    });

    it("should only allow the owner to manage the whitelist", async () => {
      await expect(
        nftMinter.addToWhitelist([user1], { from: user2 })
      ).to.be.rejectedWith("Ownable: caller is not the owner");

      await expect(
        nftMinter.removeFromWhitelist([user1], { from: user2 })
      ).to.be.rejectedWith("Ownable: caller is not the owner");
    });
  });

  describe("Minting NFTs", () => {
    it("should allow whitelisted users to mint an NFT", async () => {
      await nftMinter.addToWhitelist([user1], { from: owner });

      const tokenId = 1;
      const uri = "https://example.com/certificate/1";

      await nftMinter.mintNFT(tokenId, uri, { from: user1 });

      const ownerOfToken = await nftCollection.ownerOf(tokenId);
      const tokenUri = await nftCollection.tokenURI(tokenId);

      expect(ownerOfToken).to.equal(user1);
      expect(tokenUri).to.equal(uri);
    });

    it("should not allow non-whitelisted users to mint an NFT", async () => {
      const tokenId = 2;
      const uri = "https://example.com/certificate/2";

      await expect(
        nftMinter.mintNFT(tokenId, uri, { from: user2 })
      ).to.be.rejectedWith("Address not whitelisted");
    });

    it("should prevent minting with duplicate token IDs", async () => {
      await nftMinter.addToWhitelist([user1], { from: owner });

      const tokenId = 3;
      const uri = "https://example.com/certificate/3";

      await nftMinter.mintNFT(tokenId, uri, { from: user1 });

      await expect(
        nftMinter.mintNFT(tokenId, uri, { from: user1 })
      ).to.be.rejectedWith("ERC721: token already minted");
    });

    it("should revert when minting with an invalid URI", async () => {
      await nftMinter.addToWhitelist([user1], { from: owner });

      const tokenId = 4;
      const emptyUri = "";

      await expect(
        nftMinter.mintNFT(tokenId, emptyUri, { from: user1 })
      ).to.be.rejectedWith("Invalid URI");
    });
  });

  describe("Certificate URI Retrieval", () => {
    it("should return the correct certificate URI for a minted token", async () => {
      await nftMinter.addToWhitelist([user1], { from: owner });

      const tokenId = 5;
      const uri = "https://example.com/certificate/5";

      await nftMinter.mintNFT(tokenId, uri, { from: user1 });

      const retrievedUri = await nftCollection.certificateURI(tokenId);
      expect(retrievedUri).to.equal(uri);
    });
  });

  describe("Ownership of NFT", () => {
    it("should transfer ownership of the NFT correctly", async () => {
      await nftMinter.addToWhitelist([user1], { from: owner });

      const tokenId = 6;
      const uri = "https://example.com/certificate/6";

      await nftMinter.mintNFT(tokenId, uri, { from: user1 });

      const nftOwner = await nftCollection.ownerOf(tokenId);
      expect(nftOwner).to.equal(user1);
    });
  });
});
