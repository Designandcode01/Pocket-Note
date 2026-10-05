'use client'

import { useEffect, useState } from 'react'

interface Note {
  id: string
  text: string
  createdAt: number
}

const KEY = 'pocket-notes:v1'

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [text, setText] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) setNotes(JSON.parse(raw) as Note[])
    } catch {}
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(KEY, JSON.stringify(notes))
    } catch {}
  }, [notes, loaded])

  const add = (e: React.SyntheticEvent) => {
    e.preventDefault()
    const value = text.trim()
    if (!value) return
    setNotes((n) => [{ id: crypto.randomUUID(), text: value, createdAt: Date.now() }, ...n])
    setText('')
  }

  return (
    <section>
      <form onSubmit={add} className="composer">
        <label htmlFor="note" className="sr-only">New note</label>
        <textarea
          id="note"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write something down…"
          rows={3}
        />
        <button type="submit" disabled={!text.trim()}>Save note</button>
      </form>

      {loaded && notes.length === 0 && <p className="empty">No notes yet. Write one above and it stays on this device, even offline.</p>}

      <ul className="list">
        {notes.map((n) => (
          <li key={n.id}>
            <p>{n.text}</p>
            <div className="meta">
              <time dateTime={new Date(n.createdAt).toISOString()}>
                {new Date(n.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </time>
              <button className="ghost" onClick={() => setNotes((all) => all.filter((x) => x.id !== n.id))}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
