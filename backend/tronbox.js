require('dotenv').config();

module.exports = {
  networks: {
    development: {
      privateKey: process.env.PRIVATE_KEY,
      userFeePercentage: 100,
      feeLimit: 1000000000,
      fullHost: 'https://api.shasta.trongrid.io',
      network_id: '2'
    },
    shasta: {
      privateKey: process.env.PRIVATE_KEY,
      userFeePercentage: 50,
      feeLimit: 1000000000,
      fullHost: 'https://api.shasta.trongrid.io',
      network_id: '2'
    },
    mainnet: {
      privateKey: process.env.PRIVATE_KEY,
      userFeePercentage: 50,
      feeLimit: 1000000000,
      fullHost: 'https://api.trongrid.io',
      network_id: '1'
    },
    nile: {
      privateKey: process.env.PRIVATE_KEY,
      userFeePercentage: 50,
      feeLimit: 1000000000,
      fullHost: 'https://nile.trongrid.io',
      network_id: '3'
    }
  },
  compilers: {
    solc: {
      version: '0.8.20',
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
        evmVersion: 'shanghai',
        viaIR: true               //Implement viaIR to reduce deployment costs further
      }
    }
  }
};