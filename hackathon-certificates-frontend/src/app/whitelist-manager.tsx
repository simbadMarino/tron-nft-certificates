'use client'

import React, { useState } from 'react'
import { Button } from './components/ui/button'
import Link from 'next/link'
import { Loader2,Upload } from 'lucide-react'

interface WhitelistManagerProps {
    contractAddress: string
}

export default function WhitelistManager({ contractAddress }: WhitelistManagerProps) {
    const [addresses, setAddresses] = useState<string[]>([])
    const [manualAddress, setManualAddress] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    // Validate Tron address
    const isValidTronAddress = (address: string) => {
        return address.startsWith('T') && address.length === 34
    }

    // Handle manual address input
    const handleAddAddress = () => {
        setError('')
        if (!manualAddress.trim()) {
            setError('Please enter an address')
            return
        }

        if (!isValidTronAddress(manualAddress.trim())) {
            setError('Invalid Tron address format')
            return
        }

        if (addresses.includes(manualAddress.trim())) {
            setError('Address already in list')
            return
        }

        setAddresses([...addresses, manualAddress.trim()])
        setManualAddress('')
    }

    // Handle CSV file upload
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        setError('')
        const file = event.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string
                const lines = text.split(',')
                const newAddresses = lines
                    .map(line => line.trim())
                    .filter(address => {
                        if (!address) return false
                        if (!isValidTronAddress(address)) {
                            setError(`Invalid address format found: ${address}`)
                            return false
                        }
                        return true
                    })
                    .filter(address => !addresses.includes(address))

                if (newAddresses.length > 0) {
                    setAddresses([...addresses, ...newAddresses])
                }
            } catch (error) {
                console.error('Error processing CSV file:', error)
                setError('Error processing CSV file')
            }
            finally {
                event.target.value = ''
            }
        }
        reader.readAsText(file)
    }

    // Submit addresses to contract
    const handleSubmit = async () => {
        if (addresses.length === 0) {
            setError('Please add at least one address')
            return
        }

        setIsProcessing(true)
        setError('')
        setSuccess('')

        try {
            const contract = await window.tronWeb.contract().at(contractAddress)

            // Splitting addresses into chunks of 50 to avoid gas limits
            const chunkSize = 50
            let response = 'https://nile.tronscan.org/#/transaction/'
            for (let i = 0; i < addresses.length; i += chunkSize) {
                const chunk = addresses.slice(i, i + chunkSize)
                console.log('Adding chunk:', chunk)
                const result = await contract.addToWhitelist(chunk).send()
                response += result
                console.log('Result:', result)
            }

            setSuccess(response)
        } catch (error) {
            console.error('Contract interaction error:', error)
            setError('Failed to whitelist addresses. Please try again.')
        } finally {
            setIsProcessing(false)
            setAddresses([])
        }
    }
    return (
        <div className="space-y-4 mt-6 p-6 rounded-lg shadow-lg border border-red-600">
            <h3 className="text-xl font-bold">🚀 Whitelist Manager</h3>

            {/* Manual Address Input */}
            <div className="flex gap-2">
                <input
                    placeholder="address"
                    type="text"
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    className="flex-1 p-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <Button
                    onClick={handleAddAddress}
                    disabled={isProcessing}
                    className="bg-yellow-400 hover:bg-yellow-500 transition duration-300"
                >
                    Add
                </Button>
            </div>

            {/* CSV Upload */}
            <div className="flex items-center gap-4">
                <label className="flex-1">
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={isProcessing}
                    />
                    <div className="flex flec-col items-center justify-center h-48 p-3 rounded-lg border border-2 border-dashed border-gray-300 cursor-pointer transition duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400">
                        <Upload className="h-5 w-5" />
                        <span className="ml-2 text-gray-600">Upload CSV File</span>
                    </div>
                </label>
            </div>
            {/* Address List */}
            {addresses.length > 0 && (
                <div className="mt-4">
                    <p className="text-sm font-medium mb-2">
                        Addresses to be added to whitelist ({addresses.length}):
                    </p>
                    <textarea
                        value={addresses.join('\n')}
                        readOnly
                        className="h-32 text-sm font-mono bg-gray-800 p-2 rounded-lg text-white w-full"
                    />
                </div>
            )}
            <div>
                {/* Error/Success Messages */}
                {error && (
                    <p className="text-sm text-red-500">
                        {error}
                    </p>
                )}

                {success && (
                    <Link
                        href={`${success}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm py-2 px-4 bg-red-500 text-white rounded-[100vw] hover:bg-red-600 transition duration-300 mt-4"
                    >
                        View Transaction
                    </Link>
                )}
            </div>

            {/* Submit Button */}
            <Button
                onClick={handleSubmit}
                disabled={isProcessing || addresses.length === 0}
                className="w-full bg-green-500 hover:bg-green-600 transition duration-300"
            >
                {isProcessing ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                    </>
                ) : (
                    'Submit Addresses to Whitelist'
                )}
            </Button>
        </div >
    );
};