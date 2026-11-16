import {useRef, useState} from 'react'
import {useClient, useCurrentUser} from 'sanity'

type ImportDocument = {
  _id: string; _type: string; title?: string; name?: string;
  _localImageUrl?: string; _imageSource?: {src: string; alt: string};
  image?: {_type: string; asset: {_type: string; _ref: string}; alt: string};
  [key: string]: unknown;
}
const expectedEmail = 'erik3rland@gmail.com'
const types = ['home', 'employee', 'guide', 'service', 'job', 'page', 'siteSettings']

export function ImportContent() {
  const client = useClient({apiVersion: '2026-11-03'})
  const user = useCurrentUser()
  const running = useRef(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('Klar til å legge inn eksisterende innhold.')
  const [done, setDone] = useState(false)
  const allowed = user?.email?.toLowerCase() === expectedEmail

  async function importContent() {
    if (!allowed || running.current || done) return
    running.current = true; setBusy(true)
    try {
      if (client.config().projectId !== '89cnbpsm' || client.config().dataset !== 'production') throw new Error('Feil prosjekt eller datasett. Importen er stoppet.')
      setStatus('Kontrollerer at eksisterende innhold ikke blir overskrevet …')
      const existing = await client.withConfig({perspective: 'raw', useCdn: false}).fetch<number>('count(*[_type in $types])', {types})
      if (existing) throw new Error('Sanity inneholder allerede nettsideinnhold. Importen er stoppet for å beskytte det. Gi beskjed her i chatten før du gjør noe mer.')
      const response = await fetch('/static/import-data.json')
      if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw new Error('Kunne ikke lese importfilen. Oppdater siden og prøv igjen.')
      const documents: ImportDocument[] = await response.json()
      if (documents.length !== 22 || new Set(documents.map(doc => doc._id)).size !== 22 || documents.some(doc => !types.includes(doc._type))) throw new Error('Importfilen bestod ikke kontrollen.')
      const assets = new Map<string, string>()
      for (const [index, doc] of documents.entries()) {
        setStatus(`Klargjør ${index + 1} av ${documents.length}: ${doc.title || doc.name || doc._id}`)
        if (doc._localImageUrl && doc._imageSource) {
          if (!doc._localImageUrl.startsWith('/import-assets/')) throw new Error('Ugyldig bildeadresse.')
          let ref = assets.get(doc._localImageUrl)
          if (!ref) {
            const imageResponse = await fetch('/static' + doc._localImageUrl)
            if (!imageResponse.ok) throw new Error(`Kunne ikke lese bildet til ${doc.title || doc.name}.`)
            const blob = await imageResponse.blob()
            const asset = await client.assets.upload('image', blob, {filename: doc._localImageUrl.split('/').pop()})
            ref = asset._id; assets.set(doc._localImageUrl, ref)
          }
          doc.image = {_type: 'image', asset: {_type: 'reference', _ref: ref}, alt: doc._imageSource.alt}
        }
        delete doc._imageSource; delete doc._localImageUrl
      }
      setStatus('Lagrer innholdet i Sanity …')
      let transaction = client.transaction()
      for (const doc of documents) transaction = transaction.createIfNotExists(doc)
      await transaction.commit()
      setDone(true)
      setStatus('Ferdig! Alle 22 dokumenter er lagt inn. Velg Structure øverst for å redigere innholdet. Nettsiden på nett er ennå ikke koblet til innholdet.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Importen feilet. Gi beskjed her i chatten.')
    } finally { running.current = false; setBusy(false) }
  }


  async function finishConnection() {
    if (!allowed || running.current) return
    running.current = true; setBusy(true)
    try {
      setStatus('Kontrollerer innholdet før nettkoblingen …')
      const current = await client.withConfig({perspective: 'raw', useCdn: false}).fetch<any[]>('*[_type in $types && !defined(cmsMigrationTarget)]', {types})
      const legacy = current.filter(doc => !doc._id.startsWith('drafts.') && doc._id.includes('.'))
      if (!legacy.length) { setStatus('Innholdet er allerede klart for nettkoblingen.'); return }
      const ids = new Map(legacy.map(doc => [doc._id, doc._id.replaceAll('.', '-')]))
      const inUse = new Set(current.map(doc => doc._id))
      if ([...ids.values()].some(id => inUse.has(id))) throw new Error('Fant både gamle og nye identifikatorer. Ingen endringer er gjort.')
      function remap(value: any): any {
        if (Array.isArray(value)) return value.map(remap)
        if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, key === '_ref' && typeof entry === 'string' ? ids.get(entry) || entry : remap(entry)]))
        return value
      }
      let transaction = client.transaction()
      for (const doc of current) {
        const draft = doc._id.startsWith('drafts.')
        const originalId = draft ? doc._id.slice(7) : doc._id
        const target = ids.get(originalId)
        if (!target) continue
        const copy = remap(doc)
        delete copy._rev; delete copy._createdAt; delete copy._updatedAt
        copy._id = (draft ? 'drafts.' : '') + target
        transaction = transaction.create(copy).patch(doc._id, p => p.ifRevisionId(doc._rev).set({cmsMigrationTarget: copy._id}))
      }
      await transaction.commit()
      setStatus('Nettkoblingen er klargjort. Innholdet er bevart, og de opprinnelige importdokumentene er beholdt som sikkerhetskopier. Velg Structure for å redigere.')
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Kunne ikke klargjøre nettkoblingen.') }
    finally {running.current = false; setBusy(false)}
  }

  return <main style={{padding: '32px', maxWidth: '860px', margin: '0 auto', lineHeight: 1.65}}>
    <h1>Legg inn eksisterende innhold</h1>
    <p>Innlogget som: <strong>{user?.email || 'Laster …'}</strong></p>
    <p>Dette er en engangsimport til prosjektet Tysvær Elektro. Tekst og bilder fra dagens nettside legges inn i redigeringspanelet:</p>
    <ul><li>8 ansatte</li><li>6 guider</li><li>4 tjenester</li><li>2 stillingsannonser</li><li>Forsiden og felles kontaktinformasjon</li></ul>
    <p>Importen endrer ingen brukertilganger, inviterer ingen og endrer ikke nettsiden på nett. Den stopper hvis det allerede finnes nettsideinnhold i Sanity.</p>
    {!allowed && <p>Bruk {expectedEmail} for denne første importen.</p>}
    <button type="button" disabled={!allowed || busy || done} onClick={importContent} style={{padding: '14px 22px', border: 0, borderRadius: 6, background: busy || done || !allowed ? '#666' : '#CB322C', color: '#fff', fontSize: 17, cursor: busy || done || !allowed ? 'default' : 'pointer'}}>{done ? 'Innholdet er importert' : busy ? 'Importerer …' : 'Legg inn eksisterende innhold'}</button>
    <hr style={{margin: '28px 0'}} />
    <h2>Fullfør nettkoblingen</h2>
    <p>Hvis innholdet allerede er importert, fullfører denne knappen koblingen slik at nettsiden kan lese publisert innhold. Tekst, bilder og eventuelle utkast beholdes.</p>
    <button type="button" disabled={!allowed || busy} onClick={finishConnection} style={{padding: '14px 22px', border: 0, borderRadius: 6, background: '#CB322C', color: '#fff', fontSize: 17}}>Fullfør nettkoblingen</button>
    <p role="status" aria-live="polite">{status}</p>
  </main>
}
