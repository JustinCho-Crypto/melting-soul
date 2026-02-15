'use client'

import { WagmiProvider, http } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'
import { type Chain } from 'viem'

const monadMainnet = {
  id: 143,
  name: 'Monad',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.monad.xyz'] }
  }
} as const satisfies Chain

const config = getDefaultConfig({
  appName: 'Melting Soul',
  projectId: 'melting-soul-dev',
  chains: [monadMainnet],
  transports: {
    [monadMainnet.id]: http()
  },
  ssr: true,
})

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
