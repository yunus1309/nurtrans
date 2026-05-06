import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:18000'
const FALLBACK_SEGMENTS = [
  { id: 1, source: 'Hallo Welt', target: '', status: 'new', version: 1 },
  { id: 2, source: 'Das ist ein Testsegment.', target: '', status: 'new', version: 1 },
]

function SegmentRow({ segment, onSave }) {
  const [target, setTarget] = useState(segment.target)
  const border = segment.status === 'done'
    ? '3px solid #2e7d32'
    : segment.status === 'in_progress'
      ? '3px solid #ef6c00'
      : '3px solid #c62828'

  return (
    <div style={{ border, borderRadius: 8, padding: 8, marginBottom: 8 }}>
      <div><strong>Quelle:</strong> {segment.source}</div>
      <input
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        placeholder="Übersetzung"
        style={{ width: '100%', marginTop: 6 }}
      />
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
  const [info, setInfo] = useState('Lade Segmente ...')

  const load = async () => {
    try {
      const [segmentsResp, glossaryResp] = await Promise.all([
        fetch(`${API}/segments`),
        fetch(`${API}/glossary`),
      ])

      if (!segmentsResp.ok || !glossaryResp.ok) {
        throw new Error('API antwortet nicht erfolgreich')
      }

      const segData = await segmentsResp.json()
      const glossData = await glossaryResp.json()
      setSegments(segData)
      setGlossary(glossData)
      setInfo(segData.length ? '' : 'Keine Segmente vorhanden. Bitte Datei importieren.')
    } catch {
      setSegments(FALLBACK_SEGMENTS)
      setInfo('API nicht erreichbar. Demo-Segmente werden angezeigt.')
    }
  }

  useEffect(() => { load() }, [])

  const saveSegment = async (segment, target, status) => {
    try {
      await fetch(`${API}/segments/${segment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, status, version: segment.version }),
      })
      await load()
    } catch {
      setSegments((prev) => prev.map((s) => (s.id === segment.id ? { ...s, target, status } : s)))
      setInfo('Lokaler Demo-Modus: Änderungen nur im Browser gespeichert.')
    }
  }

  const addGlossary = async () => {
    try {
      await fetch(`${API}/glossary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      })
      setEntry({ source_term: '', target_term: '', description: '' })
      await load()
    } catch {
      setGlossary((prev) => [...prev, { ...entry, id: Date.now(), status: 'draft' }])
      setEntry({ source_term: '', target_term: '', description: '' })
      setInfo('Lokaler Demo-Modus: Glossar nur im Browser gespeichert.')
    }
  }

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 900, margin: '0 auto' }}>
      <h1>NurTrans MVP</h1>
      <p style={{ color: '#555' }}>API: {API}</p>
      {info && <p style={{ background: '#fff8e1', padding: 8, borderRadius: 6 }}>{info}</p>}
      <div>
        <button onClick={() => setTab('translate')}>Übersetzen</button>
        <button onClick={() => setTab('glossary')} style={{ marginLeft: 8 }}>Glossar</button>
      </div>
      {tab === 'translate' && (
        <div style={{ marginTop: 12 }}>
          {segments.map((s) => <SegmentRow key={s.id} segment={s} onSave={saveSegment} />)}
        </div>
      )}
      {tab === 'glossary' && (
        <div style={{ marginTop: 12 }}>
          <h3>Neuer Glossar-Eintrag</h3>
          <input placeholder="Quellbegriff" value={entry.source_term} onChange={e => setEntry({ ...entry, source_term: e.target.value })} />
          <input placeholder="Zielbegriff" value={entry.target_term} onChange={e => setEntry({ ...entry, target_term: e.target.value })} style={{ marginLeft: 8 }} />
          <input placeholder="Beschreibung" value={entry.description} onChange={e => setEntry({ ...entry, description: e.target.value })} style={{ marginLeft: 8 }} />
          <button onClick={addGlossary} style={{ marginLeft: 8 }}>Speichern</button>
          <ul>{glossary.map(g => <li key={g.id}>{g.source_term} → {g.target_term} ({g.status})</li>)}</ul>
        </div>
      )}
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App />)
