'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useForkSoul } from '@/hooks/useContracts'
import type { Soul } from '@/lib/types'

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
    const metadataUri = `ipfs://fork-${parentSoul.token_id}-${Date.now()}`
    await fork(parentSoul.token_id, metadataUri, initialSupply)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-void-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-astral-border bg-dark-nebula p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-nebula-gray transition-colors hover:text-ghost-white"
        >
          ✕
        </button>

        <h2 className="text-lg font-bold text-ghost-white">
          Fork: <span className="text-soul-purple">{parentSoul.name}</span>
        </h2>
        <p className="mt-1 text-sm text-astral-gray">
          Create a specialized version based on the original.
        </p>

        <div className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-astral-gray">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your fork's name"
              className="rounded-lg border border-astral-border bg-dark-nebula px-3 py-2.5 text-ghost-white placeholder:text-void-gray focus:border-soul-purple focus:outline-none focus:ring-1 focus:ring-soul-purple/30"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-astral-gray">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description"
              className="rounded-lg border border-astral-border bg-dark-nebula px-3 py-2.5 text-ghost-white placeholder:text-void-gray focus:border-soul-purple focus:outline-none focus:ring-1 focus:ring-soul-purple/30"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-astral-gray">Additional Prompt</label>
            <textarea
              value={additionalPrompt}
              onChange={(e) => setAdditionalPrompt(e.target.value)}
              placeholder="Additional system prompt..."
              rows={3}
              className="rounded-lg border border-astral-border bg-dark-nebula px-3 py-2.5 text-ghost-white placeholder:text-void-gray focus:border-soul-purple focus:outline-none focus:ring-1 focus:ring-soul-purple/30"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-astral-gray">Fork Note</label>
            <input
              type="text"
              value={forkNote}
              onChange={(e) => setForkNote(e.target.value)}
              placeholder="Why are you forking this soul?"
              className="rounded-lg border border-astral-border bg-dark-nebula px-3 py-2.5 text-ghost-white placeholder:text-void-gray focus:border-soul-purple focus:outline-none focus:ring-1 focus:ring-soul-purple/30"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-astral-gray">Initial Supply</label>
            <input
              type="number"
              value={initialSupply}
              onChange={(e) => setInitialSupply(Number(e.target.value))}
              min={1}
              className="rounded-lg border border-astral-border bg-dark-nebula px-3 py-2.5 text-ghost-white focus:border-soul-purple focus:outline-none focus:ring-1 focus:ring-soul-purple/30"
            />
          </div>
        </div>

        <div className="mt-5 rounded-lg bg-void-surface p-3 text-center text-sm text-astral-gray">
          Fork Cost: <span className="font-semibold text-soul-purple">10%</span> of original price
        </div>

        <button
          onClick={handleFork}
          disabled={isLoading || !address || !name}
          className="mt-4 w-full rounded-lg gradient-button py-3 font-semibold text-ghost-white shadow-[0_4px_14px_rgba(168,85,247,0.4)] transition-all hover:shadow-[0_4px_20px_rgba(168,85,247,0.6)] active:scale-[0.98] disabled:opacity-50"
        >
          {isLoading ? 'Creating Fork...' : 'Create Fork'}
        </button>
      </div>
    </div>
  )
}
