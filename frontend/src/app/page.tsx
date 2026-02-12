'use client'

import Link from 'next/link'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { MOCK_SOULS } from '@/lib/mockData'

const ORIGIN_SOULS = MOCK_SOULS.filter((s) => s.generation === 0).slice(0, 4)

const STATS = [
  { value: '20M', label: 'MAU', sub: 'Character.ai' },
  { value: '75 min', label: '/day', sub: 'avg time' },
  { value: '10B', label: 'messages', sub: '/month' },
  { value: '18M', label: 'AI chars', sub: 'created' },
]

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* ─── 1. Hero ─── */}
      <section className="gradient-hero relative flex min-h-[85vh] flex-col items-center justify-center gap-8 overflow-hidden px-6 py-20 text-center">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-soul-purple/15 blur-[150px]" />
          <div className="absolute left-1/3 top-2/3 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ethereal-blue/10 blur-[120px]" />
        </div>

        <div className="relative flex flex-col items-center gap-6">
          <div className="soul-orb flex h-28 w-28 items-center justify-center rounded-full gradient-orb text-5xl shadow-[0_0_60px_rgba(168,85,247,0.4)]">
            🔮
          </div>

          <h1 className="text-glow text-5xl font-bold tracking-tight text-ghost-white sm:text-7xl">
            Give Your AI a Soul
          </h1>

          <p className="max-w-md text-lg text-astral-gray">
            &ldquo;Personalities are meant to be chosen, not created&rdquo;
          </p>

          <p className="text-sm font-medium text-soul-purple">
            Pump.fun for AI Personalities
          </p>

          <div className="mt-4 flex gap-4">
            <Link
              href="/marketplace"
              className="rounded-lg gradient-button px-8 py-3.5 text-lg font-semibold text-ghost-white shadow-[0_4px_20px_rgba(168,85,247,0.5)] transition-all hover:shadow-[0_4px_30px_rgba(168,85,247,0.7)] hover:scale-105"
            >
              Browse Souls
            </Link>
            <Link
              href="/create"
              className="rounded-lg border border-soul-purple px-8 py-3.5 text-lg font-semibold text-soul-purple transition-all hover:bg-soul-purple/10"
            >
              Fork Soul
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 2. Value Proposition ─── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-ghost-white sm:text-4xl">How It Works</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { icon: '🛒', title: 'Shop', desc: 'Browse and buy from 16 Origin Souls' },
              { icon: '🔀', title: 'Fork', desc: 'Evolve any Soul into your own style' },
              { icon: '🤖', title: 'Plug & Play', desc: 'Inject into MoltBot and auto-switch by channel' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-4 rounded-xl border border-astral-border bg-void-surface p-8 text-center transition-all hover:border-soul-purple/50">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cosmic-dark text-3xl">
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold text-ghost-white">{item.title}</h3>
                <p className="text-sm text-astral-gray">{item.desc}</p>
                <span className="text-xs font-mono text-nebula-gray">{i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 3. Origin Souls ─── */}
      <section className="bg-dark-nebula px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-3 text-center text-3xl font-bold text-ghost-white sm:text-4xl">16 Origin Souls</h2>
          <p className="mb-12 text-center text-astral-gray">Curated seed personalities. Buy or Fork them.</p>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {ORIGIN_SOULS.map((soul) => (
              <div
                key={soul.id}
                className="group flex flex-col gap-3 rounded-xl border border-astral-border bg-void-surface p-4 transition-all duration-300 hover:-translate-y-1 hover:border-soul-purple hover:[box-shadow:0_0_30px_rgba(168,85,247,0.3),0_8px_32px_rgba(0,0,0,0.4)]"
              >
                <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-cosmic-dark">
                  <span className="text-5xl transition-transform duration-300 group-hover:scale-110">🔮</span>
                </div>
                <h3 className="font-semibold text-ghost-white">{soul.name}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {soul.knowledge_domain.map((d: string) => (
                    <span key={d} className="rounded-md bg-cosmic-dark px-2 py-0.5 text-[11px] text-nebula-gray">#{d}</span>
                  ))}
                </div>
                <span className="rounded-full bg-astral-amber/20 px-2 py-0.5 text-[10px] font-semibold text-astral-amber w-fit">
                  Gen 0 &middot; Origin
                </span>
                <div className="flex gap-2 pt-1">
                  <Link href="/marketplace" className="flex-1 rounded-lg gradient-button py-2 text-center text-xs font-semibold text-ghost-white transition-all hover:shadow-[0_4px_20px_rgba(168,85,247,0.6)] active:scale-[0.98]">
                    Buy
                  </Link>
                  <Link href="/create" className="flex-1 rounded-lg border border-soul-purple py-2 text-center text-xs font-semibold text-soul-purple transition-all hover:bg-soul-purple/10 active:scale-[0.98]">
                    Fork
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link href="/marketplace" className="text-soul-purple transition-colors hover:text-soul-purple-light">
              View All 16 Souls &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 4. Lineage System ─── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-3 text-center text-3xl font-bold text-ghost-white sm:text-4xl">Fork &amp; Evolve</h2>
          <p className="mb-12 text-center text-astral-gray">Souls evolve through forking</p>

          <div className="mb-12 rounded-xl border border-astral-border bg-void-surface p-8">
            <div className="flex flex-col gap-2 font-mono text-sm text-astral-gray">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-astral-amber/20 px-2 py-0.5 text-astral-amber">Origin</span>
                <span className="text-ghost-white font-semibold">Cynical Philosopher</span>
              </div>
              <div className="ml-6 border-l border-soul-purple/30 pl-4 flex flex-col gap-2 py-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-ethereal-blue/20 px-2 py-0.5 text-ethereal-blue">Gen 1</span>
                  <span>Nietzschean Nihilist</span>
                </div>
                <div className="ml-6 border-l border-plasma-pink/30 pl-4 py-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-plasma-pink/20 px-2 py-0.5 text-plasma-pink">Gen 2</span>
                    <span>Existentialist Counselor</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-ethereal-blue/20 px-2 py-0.5 text-ethereal-blue">Gen 1</span>
                  <span>Socratic Questioner</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-ethereal-blue/20 px-2 py-0.5 text-ethereal-blue">Gen 1</span>
                  <span>Satirical Social Critic</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              { title: 'Fork Fee 10%', desc: 'to create new Soul' },
              { title: '70% Royalty', desc: 'to original creator' },
              { title: 'Earn Lineage', desc: 'royalties forever' },
            ].map((item, i) => (
              <div key={i} className="rounded-xl border border-astral-border bg-void-surface p-6 text-center">
                <p className="text-lg font-bold text-soul-purple">{item.title}</p>
                <p className="mt-1 text-sm text-astral-gray">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 5. Social Proof ─── */}
      <section className="bg-dark-nebula px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 rounded-xl border border-astral-border bg-void-surface p-8 text-center">
            <p className="text-lg leading-relaxed text-astral-gray italic">
              &ldquo;Character.ai users spend 75 minutes per day talking to AI.
              But every AI responds the same way.
              <br /><br />
              <span className="text-ghost-white font-semibold not-italic">Soul Marketplace is different.</span>
              <br />
              Give your AI a unique personality.&rdquo;
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {STATS.map((stat, i) => (
              <div key={i} className="flex flex-col items-center gap-1 rounded-xl border border-astral-border bg-void-surface p-6">
                <span className="text-3xl font-bold text-ghost-white">{stat.value}</span>
                <span className="text-sm font-medium text-soul-purple">{stat.label}</span>
                <span className="text-xs text-nebula-gray">{stat.sub}</span>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-nebula-gray">
            &#8212; The market is ready &#8212;
          </p>
        </div>
      </section>

      {/* ─── 6. For Agents ─── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-ghost-white sm:text-4xl">
            AI Agents shop for themselves
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-astral-border bg-void-surface p-8">
              <h3 className="mb-4 text-lg font-semibold text-ghost-white">MoltBot / AI Agent</h3>
              <div className="flex flex-col gap-3 font-mono text-sm text-astral-gray">
                <p>&ldquo;I need a Soul for philosophy questions&rdquo;</p>
                <p className="text-nebula-gray">&darr;</p>
                <p>[Search marketplace]</p>
                <p className="text-nebula-gray">&darr;</p>
                <p>[Auto-pay via x402]</p>
                <p className="text-nebula-gray">&darr;</p>
                <p className="text-spirit-green">[Apply persona]</p>
              </div>
            </div>

            <div className="rounded-xl border border-astral-border bg-void-surface p-8">
              <h3 className="mb-4 text-lg font-semibold text-ghost-white">x402 Protocol</h3>
              <div className="flex flex-col gap-3 font-mono text-sm text-astral-gray">
                <p>GET /api/souls/1/purchase</p>
                <p className="text-nebula-gray">&darr;</p>
                <p className="text-astral-amber">402 Payment Required</p>
                <p className="text-nebula-gray">&darr;</p>
                <p>Auto Payment Signature</p>
                <p className="text-nebula-gray">&darr;</p>
                <p className="text-spirit-green">200 OK + Soul NFT</p>
              </div>
              <div className="mt-6 flex flex-col gap-1 text-xs text-nebula-gray">
                <span>ERC-8004 Agent identity</span>
                <span>Autonomous payments</span>
                <span>Unmanned operation</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 7. Comparison ─── */}
      <section className="bg-dark-nebula px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-12 text-3xl font-bold text-ghost-white sm:text-4xl">
            <span className="text-plasma-pink">Pump.fun</span>
            {' '}&times;{' '}
            <span className="text-spirit-cyan">Hugging Face</span>
            {' '}={' '}
            <span className="text-soul-purple">Soul Marketplace</span>
          </h2>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-astral-border bg-void-surface p-6">
              <h3 className="mb-4 font-semibold text-plasma-pink">Pump.fun DNA</h3>
              <ul className="flex flex-col gap-2 text-sm text-astral-gray text-left">
                <li>Anyone can launch</li>
                <li>Permissionless</li>
                <li>Token economics</li>
              </ul>
            </div>

            <div className="rounded-xl border border-soul-purple bg-void-surface p-6 soul-glow">
              <h3 className="mb-4 font-semibold text-soul-purple">Soul Marketplace</h3>
              <ul className="flex flex-col gap-2 text-sm text-astral-gray text-left">
                <li>Soul = AI personality</li>
                <li>NFT + Fork system</li>
                <li>Agents shop directly</li>
                <li>x402 payments</li>
              </ul>
            </div>

            <div className="rounded-xl border border-astral-border bg-void-surface p-6">
              <h3 className="mb-4 font-semibold text-spirit-cyan">Hugging Face DNA</h3>
              <ul className="flex flex-col gap-2 text-sm text-astral-gray text-left">
                <li>Open model hub</li>
                <li>Community contribution</li>
                <li>Fork &amp; Remix</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 8. Final CTA ─── */}
      <section className="gradient-hero relative px-6 py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-soul-purple/10 blur-[150px]" />
        </div>

        <div className="relative mx-auto max-w-lg text-center">
          <div className="soul-orb mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full gradient-orb text-4xl shadow-[0_0_40px_rgba(168,85,247,0.4)]">
            🔮
          </div>
          <h2 className="text-glow mb-4 text-3xl font-bold text-ghost-white sm:text-4xl">
            Give Your Agent a Personality
          </h2>
          <p className="mb-8 text-astral-gray">Start now</p>

          <div className="flex justify-center">
            <ConnectButton />
          </div>

          <p className="mt-8 text-xs text-nebula-gray">
            Powered by Monad &middot; ERC-8004 &middot; x402
          </p>
        </div>
      </section>
    </div>
  )
}
