const TronNFTCollection = artifacts.require("TronNFTCollection");
const TronNFTMinter = artifacts.require("TronNFTMinter");

module.exports = async function (deployer, network, accounts) {
  console.log(`Accounts available: ${accounts}`); // Log the accounts
  const owner = accounts; // Use the first account as the owner

  // Deploy the TronNFTCollection contract
  await deployer.deploy(TronNFTCollection, owner);
  const nftContract = await TronNFTCollection.deployed();

  console.log(`TronNFTCollection deployed at: ${nftContract.address}`);

  // Deploy the TronNFTMinter contract
  await deployer.deploy(TronNFTMinter, owner);
  const minterContract = await TronNFTMinter.deployed();

  console.log(`TronNFTMinter deployed at: ${minterContract.address}`);

  // Transfer ownership of the NFT contract to the Minter contract
  await nftContract.transferOwnership(minterContract.address);
  console.log(`Ownership of TronNFTCollection transferred to TronNFTMinter`);
};
