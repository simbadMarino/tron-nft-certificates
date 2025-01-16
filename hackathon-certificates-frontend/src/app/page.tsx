'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Button } from './components/ui/button'
import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import WhitelistManager from './whitelist-manager'
import Image from 'next/image'

const CONTRACT_ADDRESS = "TGC9gJg1MiG1cE3kRviRf7AqjWnS7pfUDg";
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
  isOwner?: boolean
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

      // Basic wallet info update
      const basicWalletInfo = {
        address,
        balance,
        network,
        isOwner: false,
        contractStatus: {
          isAvailable: false,
          message: ''
        }
      }

      // Only try to interact with contract if we're on Nile network
      if (network === 'Nile Testnet') {
        try {
          const contract = await window.tronWeb.contract().at(CONTRACT_ADDRESS)
          const owner = await contract.owner().call()
          const normalizedOwner = window.tronWeb.address.fromHex(owner)

          basicWalletInfo.isOwner = normalizedOwner === address
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

      // Only show warning for contract issues if we're connected
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
    initializeWallet()
  }, [initializeWallet])

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

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 p-4">
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
                      {walletInfo.isOwner ? 'Admin' : 'User'}
                    </span>
                  </p>
                </div>
                <div>
                  <strong className="text-sm text-gray-600">Balance</strong>
                  <p className="font-medium">{walletInfo.balance} TRX</p>
                </div>

                {/* Render WhitelistManager if user is contract owner and contract is available */}
                {walletInfo.isOwner && walletInfo.contractStatus?.isAvailable && (
                  <WhitelistManager contractAddress={CONTRACT_ADDRESS} />
                )}

                <Button
                  onClick={handleDisconnect}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
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