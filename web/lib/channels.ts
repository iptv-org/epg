import fs from 'fs'
import path from 'path'
import { channelsXmlPath } from '@/lib/paths'

export interface Channel {
  site: string
  siteId: string
  lang: string
  xmltvId: string
  name: string
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function unescapeXml(value: string): string {
  return value
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&')
}


export function parseChannelsXml(xml: string): Channel[] {
  const channels: Channel[] = []
  for (const line of xml.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('<channel ')) continue
    const site = unescapeXml((trimmed.match(/\bsite="([^"]*)"/) || [])[1] || '')
    const siteId = unescapeXml((trimmed.match(/\bsite_id="([^"]*)"/) || [])[1] || '')
    const lang = unescapeXml((trimmed.match(/\blang="([^"]*)"/) || [])[1] || '')
    const xmltvId = unescapeXml((trimmed.match(/\bxmltv_id="([^"]*)"/) || [])[1] || '')
    const nameMatch = trimmed.match(/>([^<]*)<\/channel>/)
    const name = unescapeXml((nameMatch ? nameMatch[1] : '').trim())
    if (!site || !siteId || !name) continue
    channels.push({ site, siteId, lang, xmltvId, name })
  }
  return channels
}

export function serializeChannelsXml(channels: Channel[]): string {
  const lines = channels.map(
    ch =>
      `  <channel site="${escapeXml(ch.site)}" site_id="${escapeXml(ch.siteId)}" lang="${escapeXml(ch.lang)}" xmltv_id="${escapeXml(ch.xmltvId)}">${escapeXml(ch.name)}</channel>`
  )
  return `<?xml version="1.0" encoding="UTF-8"?>\n<channels>\n${lines.join('\n')}\n</channels>\n`
}

export function readChannels(): Channel[] {
  const filePath = channelsXmlPath()
  if (!fs.existsSync(filePath)) return []
  return parseChannelsXml(fs.readFileSync(filePath, 'utf8'))
}

export function writeChannels(channels: Channel[]): void {
  const filePath = channelsXmlPath()
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, serializeChannelsXml(channels))
}

export type AddChannelResult = { ok: true } | { ok: false; error: 'duplicate' }
export type RemoveChannelResult = { ok: true } | { ok: false; error: 'not_found' }

export function addChannel(channel: Channel): AddChannelResult {
  const channels = readChannels()
  const exists = channels.some(ch => ch.site === channel.site && ch.siteId === channel.siteId)
  if (exists) return { ok: false, error: 'duplicate' }
  channels.push(channel)
  writeChannels(channels)
  return { ok: true }
}

export function removeChannel(site: string, siteId: string): RemoveChannelResult {
  const channels = readChannels()
  const next = channels.filter(ch => !(ch.site === site && ch.siteId === siteId))
  if (next.length === channels.length) return { ok: false, error: 'not_found' }
  writeChannels(next)
  return { ok: true }
}
