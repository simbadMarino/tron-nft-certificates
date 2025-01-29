# Tron NFT Collection

## Description
This project is a certificate minting application that allows users to create and manage digital certificates on the blockchain. It consists of a frontend built with Next.js and a backend that utilizes TronBox for smart contract management.

## User Experience Guide

### For Normal Users
- When a normal user who is not whitelisted attempts to access the dApp:
  - A popup will appear stating: "You cannot mint NFTs as you are not whitelisted by the admin."

### For Admin Users
- When an admin user accesses the dApp:
  - Two tabs will be available:
    - **Whitelist Manager**: Allows the admin to whitelist users.
    - **Blacklist Manager**: Allows the admin to ban users.

### For Whitelisted Users
- When a whitelisted user arrives at the dApp:
  - Two tabs will appear:
    - **Mint NFT**: The user can mint NFTs.
    - **NFT History**: The user can view the history of minted NFTs.
  
## Installation
### Backend
1. Navigate to the backend directory:
   ```bash
   cd hackathon-certificate-minting/backend
   ```
2. Install TronBox globally:
   ```bash
   npm install -g tronbox
   ```
3. Install project dependencies:
   ```bash
   npm install
   ```

4. Update the .env file and Add your own private key:
   ```bash
   cp .env.example .env
   ```


### Frontend
1. Navigate to the frontend directory:
   ```bash
   cd hackathon-certificate-minting/hackathon-certificates-frontend
   ```
2. Install project dependencies:
   ```bash
   npm install
   ```

## Usage
### Backend
To deploy contracts using TronBox, run:
```bash
tronbox migrate --network nile
```

### Frontend
To start the frontend application, run:
```bash
npm run dev
```

## Folder Structure
```
hackathon-certificate-minting/
├── hackathon-certificates-frontend/
└── backend/
```

## Contributing
Contributions are welcome! Please fork the repository and submit a pull request.

## License
This project is licensed under the MIT License.
