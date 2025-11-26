"use client"

import { useState, useEffect } from 'react'
import '@rainbow-me/rainbowkit/styles.css'
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { celo, celoAlfajores } from 'wagmi/chains'
import { defineChain } from 'viem'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { http } from 'wagmi'

// Define Celo Sepolia chain with multiple RPC endpoints for speed
const celoSepolia = defineChain({
  id: 11142220,
  name: 'Celo Sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'CELO',
    symbol: 'CELO',
  },
  rpcUrls: {
    default: {
      http: [
        'https://forno.celo-sepolia.celo-testnet.org',
        'https://alfajores-forno.celo-testnet.org', // Fallback
      ],
    },
  },
  blockExplorers: {
    default: {
      name: 'Celo Sepolia Blockscout',
      url: 'https://celo-sepolia.blockscout.com',
    },
  },
  testnet: true,
})

// Create config with proper SSR handling
let config: any = null

function getWagmiConfig() {
  if (!config) {
    config = getDefaultConfig({
      appName: 'Celo NLTE',
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
      chains: [celoSepolia, celoAlfajores, celo], // Sepolia first as default
      transports: {
        [celo.id]: http(undefined, {
          batch: true,
          fetchOptions: { cache: 'no-store' },
          retryCount: 2,
          retryDelay: 500,
          timeout: 10_000,
        }),
        [celoAlfajores.id]: http(undefined, {
          batch: true,
          fetchOptions: { cache: 'no-store' },
          retryCount: 2,
          retryDelay: 500,
          timeout: 10_000,
        }),
        [celoSepolia.id]: http(undefined, {
          batch: true,
          fetchOptions: { cache: 'no-store' },
          retryCount: 2,
          retryDelay: 500,
          timeout: 10_000,
        }),
      },
      ssr: true,
    })
  }
  return config
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
})

function WalletProviderInner({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={getWagmiConfig()}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Show children without wallet functionality during SSR
  if (!mounted) {
    return <>{children}</>
  }

  return <WalletProviderInner>{children}</WalletProviderInner>
}
