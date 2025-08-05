import type { StreamData } from '../types/stream'
import { Feed, Channel } from './index'

export class Stream {
  name?: string
  url: string
  id?: string
  channelId?: string
  channel?: Channel
  feedId?: string
  feed?: Feed
  filepath?: string
  line?: number
  label?: string
  verticalResolution?: number
  isInterlaced?: boolean
  referrer?: string
  userAgent?: string
  groupTitle = 'Undefined'
  removed = false

  constructor(data: StreamData) {
    const id = data.channel && data.feed ? [data.channel, data.feed].join('@') : data.channel
    const { verticalResolution, isInterlaced } = parseQuality(data.quality)

    this.id = id || undefined
    this.channelId = data.channel || undefined
    this.feedId = data.feed || undefined
    this.name = data.name || undefined
    this.url = data.url
    this.referrer = data.referrer || undefined
    this.userAgent = data.user_agent || undefined
    this.verticalResolution = verticalResolution || undefined
    this.isInterlaced = isInterlaced || undefined
    this.label = data.label || undefined
  }

  getId(): string {
    return this.id || ''
  }

  getName(): string {
    return this.name || ''
  }
}

function parseQuality(quality: string | null): {
  verticalResolution: number | null
  isInterlaced: boolean | null
} {
  if (!quality) return { verticalResolution: null, isInterlaced: null }
  const [, verticalResolutionString] = quality.match(/^(\d+)/) || [null, undefined]
  const isInterlaced = /i$/i.test(quality)
  let verticalResolution = 0
  if (verticalResolutionString) verticalResolution = parseInt(verticalResolutionString)

  return { verticalResolution, isInterlaced }
}
