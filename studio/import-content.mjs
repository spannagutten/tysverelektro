import fs from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {createClient} from '@sanity/client'

// Kjør med: sanity exec import-content.mjs --with-user-token
// En lokal eksport klargjøres først med prepare-content.py.
const projectId = '89cnbpsm'
const dataset = 'production'
const token = process.env.SANITY_AUTH_TOKEN
if (!token) throw new Error('Logg inn i Sanity og kjør via sanity exec --with-user-token. Ikke lim tokens inn i kildekoden.')
const client = createClient({projectId, dataset, apiVersion: '2026-11-03', useCdn: false, token})
const documents = JSON.parse(await fs.readFile(new URL('./prepared-content.json', import.meta.url), 'utf8'))
const root = path.resolve(fileURLToPath(new URL('../public/', import.meta.url)))
const existing = await client.fetch('*[_type in ["home", "employee", "guide", "service", "job", "page", "siteSettings"]]{_id}')
if (existing.length) throw new Error('Datasettet inneholder allerede nettsideinnhold. Importen stoppes for å beskytte eksisterende endringer.')
const imageCache = new Map()
for (const doc of documents) {
  const source = doc._imageSource
  if (source) {
    const file = path.resolve(root, '.' + source.src)
    if (!file.startsWith(root + path.sep)) throw new Error('Bilde utenfor public-mappen')
    let asset = imageCache.get(file)
    if (!asset) {
      asset = await client.assets.upload('image', await fs.readFile(file), {filename: path.basename(file)})
      imageCache.set(file, asset)
    }
    doc.image = {_type: 'image', asset: {_type: 'reference', _ref: asset._id}, alt: source.alt}
    delete doc._imageSource
  }
}
let transaction = client.transaction()
for (const doc of documents) transaction = transaction.createIfNotExists(doc)
await transaction.commit()
console.log(`Importert ${documents.length} dokumenter. Nettsiden må fortsatt kobles til innholdet.`)
