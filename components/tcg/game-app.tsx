'use client'

import { useCallback, useEffect, useState } from 'react'
import type { CardDef } from '@/lib/tcg/data'
import { getDailyStatus, getState, useGame } from '@/lib/tcg/store'
import { setAudioMuted } from '@/lib/tcg/audio'
import { AmbientField } from './ambient-field'
import { Binder } from './binder'
import { CoinToss } from './coin-toss'
import { DailyModal } from './daily-modal'
import { InspectModal } from './inspect-modal'
import { PackStudio } from './pack-studio'
import { RedeemModal } from './redeem-modal'
import { TopBar, type Tab } from './top-bar'

export function GameApp() {
  const game = useGame()
  const [tab, setTab] = useState<Tab>('packs')
  const [dailyOpen, setDailyOpen] = useState(false)
  const [redeemOpen, setRedeemOpen] = useState(false)
  const [inspecting, setInspecting] = useState<CardDef | null>(null)

  useEffect(() => {
    if (!getDailyStatus(getState()).claimedToday) setDailyOpen(true)
  }, [])

  useEffect(() => {
    setAudioMuted(game.muted)
  }, [game.muted])

  const closeDaily = useCallback(() => setDailyOpen(false), [])
  const closeRedeem = useCallback(() => setRedeemOpen(false), [])

  return (
    <>
      <AmbientField />
      <TopBar
        tab={tab}
        onTab={setTab}
        onOpenDaily={() => setDailyOpen(true)}
        onOpenRedeem={() => setRedeemOpen(true)}
      />
      <div id="tcg-shake-root">
        <main className="mx-auto max-w-7xl px-4 py-6 sm:py-10">
          <h1 className="sr-only">Arcana Pulls — Anime TCG Pack Opening Simulator</h1>
          {tab === 'packs' && <PackStudio onViewBinder={() => setTab('binder')} onOpenRedeem={() => setRedeemOpen(true)} />}
          {tab === 'binder' && <Binder onInspect={setInspecting} />}
          {tab === 'coin' && <CoinToss />}
        </main>
      </div>
      {dailyOpen && <DailyModal onClose={closeDaily} />}
      {redeemOpen && <RedeemModal onClose={closeRedeem} />}
      {inspecting && (
        <InspectModal
          card={inspecting}
          count={game.collection[inspecting.id] ?? 0}
          onClose={() => setInspecting(null)}
        />
      )}
    </>
  )
}
