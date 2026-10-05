export const metadata = { title: 'Offline · Pocket Notes' }

export default function OfflinePage() {
  return (
    <main className="wrap">
      <h1>You&apos;re offline</h1>
      <p className="lede">This page isn&apos;t saved on your device yet. Reconnect and try again, or go back to a page you&apos;ve already opened.</p>
      <a className="btn" href="/">Back to notes</a>
    </main>
  )
}
