"use client"

import { http, createConfig } from 'wagmi'
import { injected, metaMask, safe, walletConnect } from 'wagmi/connectors'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'default-project-id'

// Hedera Testnet configuration
const hederaTestnet = {
  id: 296,
  name: 'Hedera Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'HBAR',
    symbol: 'HBAR',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet.hashio.io/api'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Hedera Explorer',
      url: 'https://hashscan.io/testnet',
    },
  },
  testnet: true,
} as const

export const config = createConfig({
  chains: [hederaTestnet],
  connectors: [
    injected(),
    walletConnect({ projectId }),
    metaMask(),
    safe(),
  ],
  transports: {
    [hederaTestnet.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
