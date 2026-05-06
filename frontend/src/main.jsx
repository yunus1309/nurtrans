import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:18000'

function SegmentRow({ segment, onSave }) {
  const [target, setTarget] = useState(segment.target)
  const border = segment.status === 'done' ? '3px solid #2e7d32' : segment.status === 'in_progress' ? '3px solid #ef6c00' : '3px solid #c62828'

  return (
    <div style={{ border, borderRadius: 8, padding: 8, marginBottom: 8 }}>
      <div><strong>Quelle:</strong> {segment.source}</div>
      <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Übersetzung" style={{ width: '100%', marginTop: 6 }} />
      <div style={{ marginTop: 6 }}>
        <button onClick={() => onSave(segment, target, 'in_progress')}>Zwischenspeichern</button>
        <button onClick={() => onSave(segment, target, 'done')} style={{ marginLeft: 8 }}>Fertig</button>
      </div>
    </div>
  )
}

function App() {
  const [tab, setTab] = useState('translate')
  const [segments, setSegments] = useState([])
  const [glossary, setGlossary] = useState([])
  const [entry, setEntry] = useState({ source_term: '', target_term: '', description: '' })

  const load = async () => {
    setSegments(await fetch(`${API}/segments`).then(r => r.json()))
    setGlossary(await fetch(`${API}/glossary`).then(r => r.json()))
  }

  useEffect(() => { load() }, [])

  const saveSegment = async (segment, target, status) => {
    await fetch(`${API}/segments/${segment.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target, status, version: segment.version })
    })
    await load()
  }

  const addGlossary = async () => {
    await fetch(`${API}/glossary`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entry) })
    setEntry({ source_term: '', target_term: '', description: '' })
    await load()
  }

  return <div style={{ fontFamily: 'sans-serif', maxWidth: 900, margin: '0 auto' }}>
    <h1>NurTrans MVP</h1>
    <div>
      <button onClick={() => setTab('translate')}>Übersetzen</button>
      <button onClick={() => setTab('glossary')} style={{ marginLeft: 8 }}>Glossar</button>
    </div>
    {tab === 'translate' && <div style={{ marginTop: 12 }}>{segments.map(s => <SegmentRow key={s.id} segment={s} onSave={saveSegment} />)}</div>}
    {tab === 'glossary' && <div style={{ marginTop: 12 }}>
      <h3>Neuer Glossar-Eintrag</h3>
      <input placeholder="Quellbegriff" value={entry.source_term} onChange={e => setEntry({ ...entry, source_term: e.target.value })} />
      <input placeholder="Zielbegriff" value={entry.target_term} onChange={e => setEntry({ ...entry, target_term: e.target.value })} style={{ marginLeft: 8 }} />
      <input placeholder="Beschreibung" value={entry.description} onChange={e => setEntry({ ...entry, description: e.target.value })} style={{ marginLeft: 8 }} />
      <button onClick={addGlossary} style={{ marginLeft: 8 }}>Speichern</button>
      <ul>{glossary.map(g => <li key={g.id}>{g.source_term} → {g.target_term} ({g.status})</li>)}</ul>
    </div>}
  </div>
}

createRoot(document.getElementById('root')).render(<App />)
