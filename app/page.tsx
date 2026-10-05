import Notes from './notes'

export default function Home() {
  return (
    <main className="wrap">
      <h1>Pocket Notes</h1>
      <p className="lede">Notes that live on your device and work without a connection.</p>
      <Notes />
    </main>
  )
}
