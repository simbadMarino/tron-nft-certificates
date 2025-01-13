const TronNFTCollection = artifacts.require("TronNFTCollection");

module.exports = function(deployer) {
  deployer.deploy(TronNFTCollection, "TronNFT", "TNFT", "https://your-metadata-base-uri/");
};