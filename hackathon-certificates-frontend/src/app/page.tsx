'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Button } from './components/ui/button'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
declare global {
  interface Window {
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tronWeb: any

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tronLink: any
  }
}

interface WalletInfo {
  address: string
  balance: string
  network: string
}

interface NetworkStatus {
  message: string
  type: 'success' | 'error' | 'warning' | ''
}
export default function Home() {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isTronLinkInstalled, setIsTronLinkInstalled] = useState(false)
  const [status, setStatus] = useState<NetworkStatus>({ message: '', type: '' })
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null)

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

      if (walletInfo && walletInfo.network !== network) {
        setStatus({
          message: `Network switched to ${network}`,
          type: 'warning'
        })
      }

      setWalletInfo({
        address,
        balance,
        network
      })
    } catch (error) {
      if (error instanceof Error) {
        setStatus({
          message: `Error fetching wallet info: ${error.message}`,
          type: 'error'
        })
      }
    }
  }, [walletInfo])

  const checkTronLink = async () => {
    return window.tronWeb && window.tronWeb.ready
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
      
      const isAlreadyConnected = await checkTronLink()
      if (isAlreadyConnected) {
        setIsConnected(true)
        setStatus({
          message: 'Already connected!',
          type: 'success'
        })
        await updateWalletInfo()
        return
      }

      await window.tronLink.request({ method: 'tron_requestAccounts' })
      
      const connected = await checkTronLink()
      if (connected) {
        setIsConnected(true)
        setStatus({
          message: 'Successfully connected!',
          type: 'success'
        })
        await updateWalletInfo()
      } else {
        setStatus({
          message: 'Connection failed. Please try again.',
          type: 'error'
        })
      }
    } catch (error) {
      if (error instanceof Error) {
        setStatus({
          message: `Error connecting wallet: ${error.message}`,
          type: 'error'
        })
      }
    } finally {
      setIsConnecting(false)
    }
  }

  // Initial TronLink detection
  useEffect(() => {
    const detectTronLink = async () => {
      let attempts = 0
      const maxAttempts = 10

      const checkForTronLink = async () => {
        if (typeof window.tronWeb !== 'undefined') {
          setIsTronLinkInstalled(true)
          
          // If TronLink is found and already authorized, connect automatically
          if (window.tronWeb.ready) {
            await connectWallet()
          }
          return true
        }
        return false
      }

      const attemptDetection = async () => {
        const detected = await checkForTronLink()
        if (!detected && attempts < maxAttempts) {
          attempts++
          setTimeout(attemptDetection, 500)
        }
      }

      await attemptDetection()
    }

    detectTronLink()
  }, [])

  // Handle wallet events
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleMessage = async (e: MessageEvent) => {
      if (e.data.message?.action === 'setAccount' || e.data.message?.action === 'setNode') {
        await updateWalletInfo()
      }

      if (e.data.message?.action === 'disconnect') {
        setIsConnected(false)
        setWalletInfo(null)
        setStatus({
          message: 'Wallet disconnected',
          type: 'warning'
        })
      }

      // Handle wallet unlock
      if (e.data.message?.action === 'unlock') {
        await connectWallet()
      }
    }

    window.addEventListener('message', handleMessage)
    
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [updateWalletInfo])

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return ''
    }
  }

  const getButtonText = () => {
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
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">TronLink Connector</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            <Button
              onClick={handleButtonClick}
              disabled={isConnected || isConnecting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {getButtonText()}
            </Button>

            {status.message && (
              <div
                className={`p-3 rounded-lg w-full text-sm border flex items-center gap-2 ${getStatusColor(
                  status.type
                )}`}
              >
                {status.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                {status.message}
              </div>
            )}

            {walletInfo && (
              <div className="w-full space-y-3 bg-gray-50 p-4 rounded-lg border">
                <div>
                  <strong className="text-sm text-gray-600">Network</strong>
                  <p className="font-medium">{walletInfo.network}</p>
                </div>
                <div>
                  <strong className="text-sm text-gray-600">Address</strong>
                  <p className="font-medium text-sm break-all">{walletInfo.address}</p>
                </div>
                <div>
                  <strong className="text-sm text-gray-600">Balance</strong>
                  <p className="font-medium">{walletInfo.balance} TRX</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}