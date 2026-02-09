'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useCreateSoul } from '@/hooks/useContracts'

export default function CreatePage() {
  const { address, isConnected } = useAccount()
  const { create, isLoading } = useCreateSoul()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [style, setStyle] = useState('')
  const [domains, setDomains] = useState('')
  const [initialSupply, setInitialSupply] = useState(100)

  const handleCreate = async () => {
    if (!name || !address) return
    // TODO: Upload metadata to IPFS/Supabase, get URI
    const metadataUri = `ipfs://soul-${Date.now()}`
    await create(metadataUri, initialSupply)
  }

  if (!isConnected) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8">
        <span className="text-4xl">🔮</span>
        <h2 className="text-xl font-bold text-white">Connect your wallet</h2>
        <p className="text-white/50">Connect your wallet to create a Soul</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg p-6">
      <div className="flex flex-col gap-2 pb-6">
        <h1 className="text-3xl font-bold text-white">Create Soul</h1>
        <p className="text-white/50">Mint a new origin AI Agent Soul</p>
      </div>

      <div className="flex flex-col gap-5 rounded-xl border border-white/10 bg-white/[0.02] p-6">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-white/70">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Cynical Philosopher"
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-white/70">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your Soul's personality and purpose..."
            rows={3}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-white/70">Conversation Style</label>
          <input
            type="text"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            placeholder="e.g. sarcastic, formal, gentle"
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-white/70">Knowledge Domains</label>
          <input
            type="text"
            value={domains}
            onChange={(e) => setDomains(e.target.value)}
            placeholder="e.g. philosophy, logic (comma separated)"
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-white/70">Initial Supply</label>
          <input
            type="number"
            value={initialSupply}
            onChange={(e) => setInitialSupply(Number(e.target.value))}
            min={1}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white focus:border-white/30 focus:outline-none"
          />
        </div>

        <button
          onClick={handleCreate}
          disabled={isLoading || !name}
          className="mt-2 w-full rounded-lg bg-white py-3 font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isLoading ? 'Creating...' : 'Create Soul'}
        </button>
      </div>
    </div>
  )
}
