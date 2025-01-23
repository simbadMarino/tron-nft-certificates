const TronNFTCollection = artifacts.require("TronNFTCollection");
const TronNFTMinter = artifacts.require("TronNFTMinter");

module.exports = async function (deployer, network, accounts) {
  console.log(`Accounts available: ${accounts}`); // Log available accounts

  const owner = accounts; // Use the first account as the owner
  console.log(`Deploying contracts using owner account: ${owner}`);

  // 1. Deploy the TronNFTCollection contract
  await deployer.deploy(TronNFTCollection, owner);
  const nftContract = await TronNFTCollection.deployed();

  console.log(`TronNFTCollection deployed at: ${nftContract.address}`);

  // 2. Deploy the TronNFTMinter contract
  await deployer.deploy(TronNFTMinter, nftContract.address); // Pass NFT contract address to the minter
  const minterContract = await TronNFTMinter.deployed();

  console.log(`TronNFTMinter deployed at: ${minterContract.address}`);

  // 3. Grant ADMIN_ROLE to the Minter contract
  const ADMIN_ROLE = await nftContract.ADMIN_ROLE(); // Fetch ADMIN_ROLE directly from the contract
  await nftContract.grantRole(ADMIN_ROLE, minterContract.address, { from: owner });
  console.log(`Granted ADMIN_ROLE to TronNFTMinter: ${minterContract.address}`);

  // 4. Transfer ownership of the NFT contract to the Minter contract
  await nftContract.transferOwnership(minterContract.address, { from: owner });
  console.log(`Ownership of TronNFTCollection transferred to TronNFTMinter`);

  console.log("Deployment script completed successfully.");
};
