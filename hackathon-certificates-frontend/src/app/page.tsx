'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Button } from './components/ui/button'
import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import Image from 'next/image'
import WhitelistManager from './whitelist-manager'

const CONTRACT_ADDRESS = "TYgLz2zNmhemJu85JALs5uV6AJmbkB6sgh";
const NFT_CONTRACT_ADDRESS = "TWBJzXxJEBmyxgRY17Yy5rqrjULrprydxT";
const WALLET_CONNECTED_KEY = 'tronlink_connected'
const LAST_CONNECTED_ADDRESS = 'tronlink_address'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tronWeb?: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tronLink?: any
  }
}

interface WalletInfo {
  address: string
  balance: string
  network: string
  isAdmin?: boolean
  isWhitelisted?: boolean
  contractStatus?: {
    isAvailable: boolean
    message: string
  }
}

interface NetworkStatus {
  message: string
  type: 'success' | 'error' | 'warning' | 'info' | ''
}

export default function Home() {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isTronLinkInstalled, setIsTronLinkInstalled] = useState(false)
  const [status, setStatus] = useState<NetworkStatus>({ message: '', type: '' })
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isMinting, setIsMinting] = useState(false)
  const [activeTab, setActiveTab] = useState<'mint' | 'whitelist' | 'nftHistory'>('mint')
  const [nftHistory, setNftHistory] = useState<string>();
  const [showAlert, setShowAlert] = useState(false);

  const getNetworkName = (fullNodeHost: string): string => {
    if (fullNodeHost.includes('shasta')) return 'Shasta Testnet'
    if (fullNodeHost.includes('nile')) return 'Nile Testnet'
    return 'Mainnet'
  }

  const updateWalletInfo = useCallback(async () => {
    if (!window.tronWeb?.ready) return

    try {
      const address = window.tronWeb.defaultAddress.base58
      const balanceInSun = await window.tronWeb.trx.getBalance(address)
      const balance = (balanceInSun / 1000000).toFixed(6)
      const network = getNetworkName(window.tronWeb.fullNode.host)

      const basicWalletInfo = {
        address,
        balance,
        network,
        isAdmin: false,
        isWhitelisted: false,
        contractStatus: {
          isAvailable: false,
          message: ''
        }
      }

      if (network === 'Nile Testnet') {
        try {
          const contract = await window.tronWeb.contract().at(CONTRACT_ADDRESS)
          const adminRole = await contract.ADMIN_ROLE().call()

          // Check if address has the ADMIN_ROLE
          const isAdmin = await contract.hasRole(adminRole, address).call()

          // Check if address is whitelisted
          const isWhitelisted = await contract.isWhitelisted(address).call()
          console.log('isWhitelisted:', isWhitelisted, 'address:', address)

          basicWalletInfo.isAdmin = isAdmin
          basicWalletInfo.isWhitelisted = isWhitelisted

          basicWalletInfo.contractStatus = {
            isAvailable: true,
            message: 'Contract connected successfully'
          }
        } catch (contractError) {
          basicWalletInfo.contractStatus = {
            isAvailable: false,
            message: 'Contract not found on Nile Testnet' + contractError
          }
        }
      } else {
        basicWalletInfo.contractStatus = {
          isAvailable: false,
          message: 'Contract is only available on Nile Testnet'
        }
      }

      localStorage.setItem(LAST_CONNECTED_ADDRESS, address)
      setWalletInfo(basicWalletInfo)

      if (isConnected && !basicWalletInfo.contractStatus.isAvailable) {
        setStatus({
          message: basicWalletInfo.contractStatus.message,
          type: 'warning'
        })
      }

    } catch (error) {
      console.error('Error updating wallet info:', error)
      if (error instanceof Error) {
        setStatus({
          message: `Error fetching wallet info: ${error.message}`,
          type: 'error'
        })
      }
    }
  }, [isConnected])

  const handleMint = async () => {
    if (!window.tronWeb?.ready || !walletInfo?.contractStatus?.isAvailable) return

    try {
      setIsMinting(true)
      setStatus({ message: 'Initiating minting process...', type: 'info' })

      const contract = await window.tronWeb.contract().at(CONTRACT_ADDRESS)

      // Call mintNFT function
      const transaction = await contract.mintNFT().send()

      console.log('Transaction:', transaction)

      setStatus({
        message: 'NFT minted successfully!',
        type: 'success'
      })

    } catch (error) {
      console.error('Minting error:', error)
      setStatus({
        message: error instanceof Error ? error.message : 'Failed to mint NFT',
        type: 'error'
      })
    } finally {
      setIsMinting(false)
    }
  }

  const connectWallet = async () => {
    if (!isTronLinkInstalled) {
      setStatus({
        message: 'Please install TronLink wallet!',
        type: 'error'
      })
      return
    }

    try {
      setIsConnecting(true)
      await window.tronLink.request({ method: 'tron_requestAccounts' })

      const address = window.tronWeb?.defaultAddress?.base58
      if (address) {
        setIsConnected(true)
        await updateWalletInfo()
        setStatus({
          message: 'Successfully connected!',
          type: 'success'
        })
        localStorage.setItem(WALLET_CONNECTED_KEY, 'true')
      }
    } catch (error) {
      console.error('Error connecting wallet:', error)
      setStatus({
        message: 'Failed to connect to TronLink.',
        type: 'error'
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const initializeWallet = useCallback(async () => {
    if (typeof window.tronWeb !== 'undefined') {
      setIsTronLinkInstalled(true)

      const wasConnected = localStorage.getItem(WALLET_CONNECTED_KEY) === 'true'
      const lastAddress = localStorage.getItem(LAST_CONNECTED_ADDRESS)

      if (wasConnected && lastAddress) {
        const currentAddress = window.tronWeb.defaultAddress.base58
        if (currentAddress === lastAddress) {
          setIsConnected(true)
          await updateWalletInfo()
          setStatus({
            message: 'Wallet reconnected successfully.',
            type: 'success'
          })
        } else {
          setStatus({
            message: 'Wallet address changed. Please reconnect.',
            type: 'warning'
          })
        }
      }
    } else {
      setIsTronLinkInstalled(false)
    }

    setIsInitializing(false)
  }, [updateWalletInfo])

  useEffect(() => {
    initializeWallet();

    // Check user status on page load
    if (walletInfo && !walletInfo.isWhitelisted && !walletInfo.isAdmin) {
      setShowAlert(true);
    }
  }, [initializeWallet, walletInfo]);

  const handleDisconnect = () => {
    setIsConnected(false)
    setWalletInfo(null)
    localStorage.removeItem(WALLET_CONNECTED_KEY)
    localStorage.removeItem(LAST_CONNECTED_ADDRESS)
    setStatus({
      message: 'Wallet disconnected',
      type: 'warning'
    })
  }

  const getButtonText = () => {
    if (isInitializing) return 'Initializing...'
    if (!isTronLinkInstalled) return 'Install TronLink'
    if (isConnecting) return 'Connecting...'
    if (isConnected) return 'Connected'
    return 'Connect TronLink'
  }

  const handleButtonClick = () => {
    if (!isTronLinkInstalled) {
      window.open('https://chrome.google.com/webstore/detail/tronlink/ibnejdfjmmkpcnlpebklmnkoeoihofec', '_blank')
    } else {
      connectWallet()
    }
  }

  const fetchNftHistory = async () => {
    if (!walletInfo?.address) return;

    try {
      const nftContract = await window.tronWeb.contract().at(NFT_CONTRACT_ADDRESS);
      const tokenId = await nftContract.balanceOf(walletInfo.address).call();
      const tokenURI = await nftContract.tokenURI(tokenId).call();

      setNftHistory(tokenURI);
    } catch (error) {
      console.error('Error fetching NFT history:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'nftHistory') {
      fetchNftHistory();
    }
  }, [activeTab]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            <Image
              src="/tron-logo.jpeg"
              alt="Tron Logo"
              width={32}
              height={32}
              className="mr-2 inline-block"
            />
            Tron NFTs Collection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            {isConnected ? null : <Button
              onClick={handleButtonClick}
              disabled={isConnected || isConnecting || isInitializing}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {getButtonText()}
            </Button>}

            {status.message && (
              <div
                className={`p-3 rounded-lg w-full text-sm border flex items-center gap-2 ${status.type === 'success'
                  ? 'bg-green-100 text-green-800 border-green-200'
                  : status.type === 'error'
                    ? 'bg-red-100 text-red-800 border-red-200'
                    : status.type === 'info'
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                }`}
              >
                {status.type === 'success' ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : status.type === 'info' ? (
                  <Info className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                {status.message}
              </div>
            )}

            {showAlert && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                  <h2 className="text-lg font-bold mb-4">Access Denied</h2>
                  <p>You are not whitelisted and cannot mint NFTs.</p>
                  <Button onClick={() => setShowAlert(false)} className="mt-4 bg-red-500 text-white rounded-full">
                    Close
                  </Button>
                </div>
              </div>
            )}

            {walletInfo && (
              <div className="w-full space-y-4 bg-gray-50 p-4 rounded-lg border">
                <div>
                  <strong className="text-sm text-gray-600">Network</strong>
                  <p className="font-medium">{walletInfo.network}</p>
                </div>
                <div>
                  <strong className="text-sm text-gray-600">Address</strong>
                  <p className="font-medium text-sm break-all">
                    {walletInfo.address}
                    <span className="ml-2 text-white bg-red-600 px-2 py-1 rounded-[100vw] text-xs">
                      {walletInfo.isAdmin ? 'Admin' : walletInfo.isWhitelisted ? 'Whitelisted' : 'User'}
                    </span>
                  </p>
                </div>
                <div>
                  <strong className="text-sm text-gray-600">Balance</strong>
                  <p className="font-medium">{walletInfo.balance} TRX</p>
                </div>

                <div className="flex space-x-2 mt-4 w-full">
                  {walletInfo?.isWhitelisted && (
                    <Button
                      onClick={() => setActiveTab('mint')}
                      className={`rounded-full transition-all duration-300 ${activeTab === 'mint' ? 'bg-gradient-to-r from-green-400 to-blue-500 text-white shadow-lg' : 'bg-gradient-to-r from-green-200 to-blue-200 hover:bg-gray-300 text-gray-700'}`}
                    >
                      Mint NFT
                    </Button>
                  )}
                  {walletInfo?.isAdmin && (
                    <Button
                      onClick={() => setActiveTab('whitelist')}
                      className={`rounded-full transition-all duration-300 ${activeTab === 'whitelist' ? 'bg-gradient-to-r from-green-400 to-blue-500 text-white shadow-lg' : 'bg-gradient-to-r from-green-200 to-blue-200 hover:bg-gray-300 text-gray-700'}`}
                    >
                      Whitelist Manager
                    </Button>
                  )}
                  {walletInfo?.isWhitelisted && (
                    <Button
                      onClick={() => setActiveTab('nftHistory')}
                      className={`rounded-full transition-all duration-300 ${activeTab === 'nftHistory' ? 'bg-gradient-to-r from-green-400 to-blue-500 text-white shadow-lg' : 'bg-gradient-to-r from-green-200 to-blue-200 hover:bg-gray-300 text-gray-700'}`}
                    >
                      NFT History
                    </Button>
                  )}
                </div>

                {activeTab === 'mint' && walletInfo?.isWhitelisted && walletInfo.contractStatus?.isAvailable && (
                  <div className="space-y-4 mt-6 p-4 rounded-lg shadow-lg border border-red-600">
                    <h3 className="text-xl font-bold">🚀 Mint NFT</h3>
                    <Button
                      onClick={handleMint}
                      disabled={isMinting}
                      className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white shadow-lg hover:bg-green-700 text-white rounded-full transition-all duration-300"
                    >
                      {isMinting ? 'Minting...' : 'Mint NFT'}
                    </Button>
                  </div>
                )}

                {activeTab === 'whitelist' && walletInfo.isAdmin && walletInfo.contractStatus?.isAvailable && (
                  <WhitelistManager contractAddress={CONTRACT_ADDRESS} />
                )}

                {activeTab === 'nftHistory' && (
                  <div className="space-y-4 mt-6 p-4 rounded-lg shadow-lg border border-red-600">
                    <h3 className="text-xl font-bold">🖼️ NFT History</h3>
                    {nftHistory && (
                      <Image src={nftHistory} alt="NFT" width={100} height={100} />
                    )}

                    {!nftHistory && (
                      <p>No NFT history found.</p>
                    )}
                  </div>
                )}

                <Button
                  onClick={handleDisconnect}
                  className="w-full bg-red-600 hover:bg-red-700 text-white rounded-full transition-all duration-300"
                >
                  Disconnect
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}