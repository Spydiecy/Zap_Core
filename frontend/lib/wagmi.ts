"use client"

import { http, createConfig } from 'wagmi'
import { injected, metaMask, safe, walletConnect } from 'wagmi/connectors'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'default-project-id'

// X Layer Testnet configuration
const xLayerTestnet = {
  id: 195,
  name: 'X Layer Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'OKB',
    symbol: 'OKB',
  },
  rpcUrls: {
    default: {
      http: ['https://xlayertestrpc.okx.com'],
    },
  },
  blockExplorers: {
    default: {
      name: 'OKLink Explorer',
      url: 'https://www.oklink.com/xlayer-test',
    },
  },
  testnet: true,
} as const

export const config = createConfig({
  chains: [xLayerTestnet],
  connectors: [
    injected(),
    walletConnect({ projectId }),
    metaMask(),
    safe(),
  ],
  transports: {
    [xLayerTestnet.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
