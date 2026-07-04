import fs from 'fs'
import path from 'path'
import { parseChannelsXml, Channel } from '@/lib/channels'
import { sitesDir, channelsSourcesDir } from '@/lib/paths'

export type CatalogEntry = Channel

function readChannelsFileSafe(filePath: string): Channel[] {
  if (!fs.existsSync(filePath)) return []
  return parseChannelsXml(fs.readFileSync(filePath, 'utf8'))
}

export function buildCatalogIndex(): CatalogEntry[] {
  const entries: CatalogEntry[] = []

  const sitesRoot = sitesDir()
  if (fs.existsSync(sitesRoot)) {
    for (const siteName of fs.readdirSync(sitesRoot)) {
      const siteDir = path.join(sitesRoot, siteName)
      if (!fs.statSync(siteDir).isDirectory()) continue
      for (const file of fs.readdirSync(siteDir)) {
        if (!file.endsWith('.channels.xml')) continue
        entries.push(...readChannelsFileSafe(path.join(siteDir, file)))
      }
    }
  }

  const sourcesRoot = channelsSourcesDir()
  if (fs.existsSync(sourcesRoot)) {
    for (const file of fs.readdirSync(sourcesRoot)) {
      if (!file.endsWith('.channels.xml')) continue
      entries.push(...readChannelsFileSafe(path.join(sourcesRoot, file)))
    }
  }

  return entries
}

export function searchCatalog(index: CatalogEntry[], query: string): CatalogEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return index.filter(
    entry => entry.name.toLowerCase().includes(q) || entry.site.toLowerCase().includes(q)
  )
}
