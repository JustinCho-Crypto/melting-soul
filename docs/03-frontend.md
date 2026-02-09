# 03. Frontend (Next.js 15.5.10 + TypeScript)

---

## Project Structure

```
app/
├── page.tsx                      # Landing page
├── marketplace/
│   └── page.tsx                  # Main marketplace
├── lineage/
│   └── [tokenId]/
│       └── page.tsx              # Lineage page
├── my-souls/
│   └── page.tsx                  # My Souls
├── create/
│   └── page.tsx                  # Create Soul
├── layout.tsx
└── providers.tsx                 # RainbowKit + Wagmi

components/
├── Header.tsx
├── SoulCard.tsx
├── SoulTable.tsx
├── SoulModal.tsx                 # Detail + Purchase
├── ForkModal.tsx                 # Fork creation
├── LineageTree.tsx               # Tree visualization
└── WalletButton.tsx

hooks/
├── useSouls.ts
├── useSoul.ts
├── useLineage.ts
├── useListings.ts
└── useContracts.ts

lib/
├── supabase.ts
├── contracts.ts
└── utils.ts
```

---

## Page Wireframes

### 1. Landing Page (`/`)

```
┌─────────────────────────────────────────────────────────┐
│  [Logo]                                                 │
│                                                         │
│                 ┌─────────────────┐                     │
│                 │  melting soul   │                     │
│                 └─────────────────┘                     │
│                                                         │
│                 ┌─────────────────┐                     │
│                 │   enter app     │  → /marketplace     │
│                 └─────────────────┘                     │
│                                                         │
│                 ┌───────────────────────┐               │
│                 │ we are soul marketplace│              │
│                 │      for agent         │              │
│                 └───────────────────────┘               │
│                                                         │
│  * Visual: Lava/molting concept                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2. Marketplace (`/marketplace`)

```
┌─────────────────────────────────────────────────────────┐
│  [Logo]        [Collection]                  [Wallet]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Trending Collections                                   │
│                                                         │
│  ┌─────┬──────────────────┬───────┬────────┬────────┐  │
│  │  #  │  Name            │ Floor │ 24h Vol│ Forks  │  │
│  ├─────┼──────────────────┼───────┼────────┼────────┤  │
│  │  1  │ Cynical Philosopher│ 50  │ 120    │ 4      │  │
│  │  2  │ Passionate Coach   │ 30  │ 80     │ 2      │  │
│  │  3  │ Code Reviewer      │ 45  │ 65     │ 1      │  │
│  │ ... │                  │       │        │        │  │
│  └─────┴──────────────────┴───────┴────────┴────────┘  │
│                                                         │
│  * Row click → /lineage/[tokenId]                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 3. Lineage Page (`/lineage/[tokenId]`)

```
┌─────────────────────────────────────────────────────────┐
│  [Logo]        [Collection]                  [Wallet]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│              ┌─────────────────┐                        │
│              │  Origin Soul    │  ← Gen 0              │
│              │  Cynical Phil.  │                        │
│              └────────┬────────┘                        │
│           ┌───────────┼───────────┐                     │
│           ▼           ▼           ▼                     │
│      ┌─────────┐ ┌─────────┐ ┌─────────┐               │
│      │ Fork #1 │ │ Fork #2 │ │ Fork #3 │  ← Gen 1      │
│      └────┬────┘ └─────────┘ └────┬────┘               │
│           ▼                       ▼                     │
│      ┌─────────┐             ┌─────────┐               │
│      │ Gen 2   │             │ Gen 2   │  ← Gen 2      │
│      └─────────┘             └─────────┘               │
│                                                         │
│  ← → ↑ ↓ Drag scroll                                   │
│                                                         │
│  * Node click → SoulModal                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 4. Soul Detail Modal

```
┌─────────────────────────────────────┐
│                              [X]    │
│                                     │
│           [Image]                   │
│                                     │
│  Cynical Philosopher                │
│  ───────────────────────            │
│  "Questions and critically..."      │
│                                     │
│  Style: sarcastic                   │
│  Domain: Philosophy, Logic          │
│  Generation: 0 (Origin)             │
│  Forks: 4                           │
│  Creator: 0x1234...abcd             │
│                                     │
│  ─────────────────────              │
│  Current Price: 50 TOKEN            │
│  Remaining: 10                      │
│                                     │
│  ┌─────────────┐ ┌─────────────┐    │
│  │     Buy     │ │    Fork     │    │
│  └─────────────┘ └─────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

### 5. Fork Modal

```
┌─────────────────────────────────────────┐
│  Fork: Cynical Philosopher         [X] │
│  ────────────────────────────────────   │
│                                         │
│  Create a specialized version           │
│  based on the original.                 │
│                                         │
│  ▼ Basic Info                           │
│  Name: [___________________________]    │
│  Description: [____________________]    │
│                                         │
│  ▼ Additional Prompt                    │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ▼ Additional Traits                    │
│  [+ Add]                                │
│                                         │
│  ▼ Fork Note                            │
│  [___________________________]          │
│                                         │
│  Fork Cost: 5 TOKEN (10% of original)  │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │        Create Fork              │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

---

## Key Components

### Header.tsx

```tsx
'use client'

import Link from 'next/link'
import { ConnectButton } from '@rainbow-me/rainbowkit'

export function Header() {
  return (
    <header className="flex items-center justify-between p-4 border-b">
      <Link href="/" className="text-xl font-bold">
        Soul
      </Link>

      <nav className="flex gap-4">
        <Link href="/marketplace">Collection</Link>
      </nav>

      <ConnectButton />
    </header>
  )
}
```

### SoulTable.tsx

```tsx
'use client'

import { useRouter } from 'next/navigation'
import { useSoulStats } from '@/hooks/useSoulStats'

export function SoulTable() {
  const router = useRouter()
  const { data: souls, isLoading } = useSoulStats()

  if (isLoading) return <div>Loading...</div>

  return (
    <table className="w-full">
      <thead>
        <tr>
          <th>#</th>
          <th>Name</th>
          <th>Floor</th>
          <th>24h Vol</th>
          <th>Forks</th>
        </tr>
      </thead>
      <tbody>
        {souls?.map((soul, i) => (
          <tr
            key={soul.id}
            onClick={() => router.push(`/lineage/${soul.token_id}`)}
            className="cursor-pointer hover:bg-gray-100"
          >
            <td>{i + 1}</td>
            <td className="flex items-center gap-2">
              <img src={soul.image_url} className="w-8 h-8 rounded" />
              {soul.name}
            </td>
            <td>{soul.floor_price || '-'}</td>
            <td>{soul.total_volume}</td>
            <td>{soul.fork_count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

### LineageTree.tsx

```tsx
'use client'

import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useLineage } from '@/hooks/useLineage'

interface Props {
  tokenId: number
  onNodeClick: (soul: any) => void
}

export function LineageTree({ tokenId, onNodeClick }: Props) {
  const { data: lineage } = useLineage(tokenId)

  // Convert lineage data to React Flow nodes/edges
  const { nodes, edges } = useMemo(() => {
    if (!lineage) return { nodes: [], edges: [] }

    const nodes: Node[] = lineage.map((soul, i) => ({
      id: soul.id,
      position: { x: soul.generation * 200, y: i * 100 },
      data: {
        label: soul.name,
        soul
      },
      type: 'soulNode'
    }))

    const edges: Edge[] = lineage
      .filter(s => s.parent_id)
      .map(soul => ({
        id: `${soul.parent_id}-${soul.id}`,
        source: soul.parent_id,
        target: soul.id
      }))

    return { nodes, edges }
  }, [lineage])

  return (
    <div className="w-full h-[600px]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={(_, node) => onNodeClick(node.data.soul)}
        fitView
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  )
}
```

### SoulModal.tsx

```tsx
'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useBuySoul } from '@/hooks/useContracts'

interface Props {
  soul: Soul
  listing?: Listing
  onClose: () => void
  onFork: () => void
}

export function SoulModal({ soul, listing, onClose, onFork }: Props) {
  const { address } = useAccount()
  const { buy, isLoading } = useBuySoul()

  const handleBuy = async () => {
    if (!listing) return
    await buy(listing.listing_id, 1)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <button onClick={onClose} className="float-right">X</button>

        <img src={soul.image_url} className="w-32 h-32 mx-auto rounded" />

        <h2 className="text-xl font-bold mt-4">{soul.name}</h2>
        <p className="text-gray-600">{soul.description}</p>

        <div className="mt-4 space-y-2">
          <p>Style: {soul.conversation_style}</p>
          <p>Domain: {soul.knowledge_domain?.join(', ')}</p>
          <p>Generation: {soul.generation}</p>
          <p>Creator: {soul.creator_address.slice(0, 6)}...{soul.creator_address.slice(-4)}</p>
        </div>

        {listing && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-lg font-bold">{listing.price} TOKEN</p>
            <p className="text-sm text-gray-500">{listing.remaining_amount} remaining</p>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          {listing && (
            <button
              onClick={handleBuy}
              disabled={isLoading || !address}
              className="flex-1 bg-blue-500 text-white py-2 rounded"
            >
              {isLoading ? 'Processing...' : 'Buy'}
            </button>
          )}
          <button
            onClick={onFork}
            disabled={!address}
            className="flex-1 bg-purple-500 text-white py-2 rounded"
          >
            Fork
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## Hooks

### useSouls.ts

```typescript
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useSouls() {
  return useQuery({
    queryKey: ['souls'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('souls')
        .select('id, token_id, name, description, image_url, conversation_style, knowledge_domain, generation, creator_address')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    }
  })
}
```

### useLineage.ts

```typescript
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useLineage(tokenId: number) {
  return useQuery({
    queryKey: ['lineage', tokenId],
    queryFn: async () => {
      // Find the Soul first
      const { data: soul } = await supabase
        .from('souls')
        .select('id')
        .eq('token_id', tokenId)
        .single()

      if (!soul) return []

      // Find Origin ID (last ancestor)
      const { data: ancestors } = await supabase
        .rpc('get_ancestors', { leaf_id: soul.id })

      const originId = ancestors?.[ancestors.length - 1]?.id || soul.id

      // Get all descendants from Origin
      const { data: descendants } = await supabase
        .rpc('get_descendants', { root_id: originId })

      return descendants
    },
    enabled: !!tokenId
  })
}
```

### useContracts.ts

```typescript
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { SOUL_SALE_ABI } from '@/lib/contracts'

export function useBuySoul() {
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  const buy = async (listingId: number, amount: number) => {
    writeContract({
      address: process.env.NEXT_PUBLIC_SOUL_SALE_ADDRESS as `0x${string}`,
      abi: SOUL_SALE_ABI,
      functionName: 'buy',
      args: [BigInt(listingId), BigInt(amount)]
    })
  }

  return {
    buy,
    isLoading: isPending || isConfirming
  }
}
```

---

## Providers Setup

### providers.tsx

```tsx
'use client'

import { WagmiProvider, createConfig, http } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'

// Monad Testnet chain definition
const monadTestnet = {
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_RPC_URL!] }
  }
}

const config = getDefaultConfig({
  appName: 'Soul Marketplace',
  projectId: 'YOUR_PROJECT_ID', // Not needed without WalletConnect
  chains: [monadTestnet],
  transports: {
    [monadTestnet.id]: http()
  }
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
```

---

## Package Installation

```bash
npm install @rainbow-me/rainbowkit wagmi viem @tanstack/react-query
npm install @supabase/supabase-js
npm install reactflow  # Tree visualization
```
