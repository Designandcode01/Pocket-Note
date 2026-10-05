'use client'

import { useCallback, useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PwaClient() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null)
  const [online, setOnline] = useState(true)
  const [showIosHint, setShowIosHint] = useState(false)

  // Register the service worker (production only, so dev caching never confuses you)
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    if (process.env.NODE_ENV !== 'production') return

    let refreshing = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return
      refreshing = true
      window.location.reload()
    })

    navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .then((reg) => {
        if (reg.waiting && navigator.serviceWorker.controller) setWaiting(reg.waiting)
        reg.addEventListener('updatefound', () => {
          const sw = reg.installing
          sw?.addEventListener('statechange', () => {
            if (sw.state === 'installed' && navigator.serviceWorker.controller) setWaiting(sw)
          })
        })
        // Check for a new version whenever the app is reopened
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') reg.update().catch(() => {})
        })
      })
      .catch((err) => console.error('Service worker registration failed:', err))
  }, [])

  // Install prompt (Chromium) and iOS hint
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setInstallEvent(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => setInstallEvent(null)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)

    const ua = navigator.userAgent
    const isIos = /iPad|iPhone|iPod/.test(ua)
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    if (isIos && !standalone) setShowIosHint(true)

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  // Online / offline status
  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    update()
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  const install = useCallback(async () => {
    if (!installEvent) return
    await installEvent.prompt()
    await installEvent.userChoice
    setInstallEvent(null)
  }, [installEvent])

  return (
    <div className="bars" role="region" aria-label="App status">
      {!online && <div className="bar bar-offline">You&apos;re offline. Your notes are still saved on this device.</div>}
      {waiting && (
        <div className="bar">
          A new version is ready.
          <button onClick={() => waiting.postMessage({ type: 'SKIP_WAITING' })}>Update</button>
        </div>
      )}
      {installEvent && (
        <div className="bar">
          Install Pocket Notes for quick access.
          <button onClick={install}>Install</button>
        </div>
      )}
      {showIosHint && !installEvent && (
        <div className="bar">
          To install: tap Share, then &quot;Add to Home Screen&quot;.
          <button onClick={() => setShowIosHint(false)}>Dismiss</button>
        </div>
      )}
    </div>
  )
}
