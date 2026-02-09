'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useForkSoul } from '@/hooks/useContracts'
import type { Soul } from '@/lib/supabase'

interface Props {
  parentSoul: Soul
  onClose: () => void
}

export function ForkModal({ parentSoul, onClose }: Props) {
  const { address } = useAccount()
  const { fork, isLoading } = useForkSoul()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [additionalPrompt, setAdditionalPrompt] = useState('')
  const [forkNote, setForkNote] = useState('')
  const [initialSupply, setInitialSupply] = useState(10)

  const handleFork = async () => {
    if (!name || !address) return
    // TODO: Upload metadata to IPFS/Supabase, get URI
    const metadataUri = `ipfs://fork-${parentSoul.token_id}-${Date.now()}`
    await fork(parentSoul.token_id, metadataUri, initialSupply)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-zinc-900 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-white/50 transition-colors hover:text-white"
        >
          ✕
        </button>

        <h2 className="text-lg font-bold text-white">Fork: {parentSoul.name}</h2>
        <p className="mt-1 text-sm text-white/50">Create a specialized version based on the original.</p>

        <div className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-white/70">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your fork's name"
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-white/70">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description"
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-white/70">Additional Prompt</label>
            <textarea
              value={additionalPrompt}
              onChange={(e) => setAdditionalPrompt(e.target.value)}
              placeholder="Additional system prompt to extend the parent's behavior..."
              rows={3}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-white/70">Fork Note</label>
            <input
              type="text"
              value={forkNote}
              onChange={(e) => setForkNote(e.target.value)}
              placeholder="Why are you forking this soul?"
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-white/70">Initial Supply</label>
            <input
              type="number"
              value={initialSupply}
              onChange={(e) => setInitialSupply(Number(e.target.value))}
              min={1}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-white/30 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-6 rounded-lg bg-white/5 p-3 text-center text-sm text-white/50">
          Fork Cost: 10% of original price
        </div>

        <button
          onClick={handleFork}
          disabled={isLoading || !address || !name}
          className="mt-4 w-full rounded-lg bg-white py-3 font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isLoading ? 'Creating Fork...' : 'Create Fork'}
        </button>
      </div>
    </div>
  )
}
