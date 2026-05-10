import relativeTime from 'dayjs/plugin/relativeTime'
import { Collection } from '@freearhey/core'
import * as epgGrabber from 'epg-grabber'
import { Channel } from './channel'
import utc from 'dayjs/plugin/utc'
import dayjs from 'dayjs'

dayjs.extend(relativeTime)
dayjs.extend(utc)

export interface WorkerGuideSource {
  host: string
  format: string
  url: string
}

export interface WorkerData {
  host: string
  channelsPath?: string
  channels?: epgGrabber.Types.ChannelData[]
  guideXmlPath?: string
  guideGzipPath?: string
  guideJsonPath?: string
  status?: string
  lastUpdated?: string
}

export class Worker {
  host: string
  channelsPath?: string
  channels?: Collection<Channel>
  guideXmlPath?: string
  guideGzipPath?: string
  guideJsonPath?: string
  status?: string
  lastUpdated?: string

  constructor(data: WorkerData) {
    this.host = data.host

    this.update(data)
  }

  update(data: Partial<WorkerData>): this {
    if (data.host) this.host = data.host
    if (data.channelsPath) this.channelsPath = data.channelsPath
    if (data.guideXmlPath) this.guideXmlPath = data.guideXmlPath
    if (data.guideGzipPath) this.guideGzipPath = data.guideGzipPath
    if (data.guideJsonPath) this.guideJsonPath = data.guideJsonPath
    if (data.status) this.status = data.status
    if (data.lastUpdated) this.lastUpdated = data.lastUpdated

    if (data.channels) {
      const channelInstances = data.channels.map(c => new Channel(c))
      this.channels = new Collection(channelInstances)
    }

    return this
  }

  setChannelsPath(path: string): this {
    this.channelsPath = path
    return this
  }

  setGuideXmlPath(path: string): this {
    this.guideXmlPath = path
    return this
  }

  setGuideGzipPath(path: string): this {
    this.guideGzipPath = path
    return this
  }

  setGuideJsonPath(path: string): this {
    this.guideJsonPath = path
    return this
  }

  setStatus(status: string): this {
    this.status = status
    return this
  }

  getBaseUrl(): string {
    return `https://${this.host}`
  }

  getConfigUrl(): string {
    const url = new URL('worker.json', this.getBaseUrl())

    return url.href
  }

  getChannelsUrl(): string {
    if (!this.channelsPath) return ''

    const url = new URL(this.channelsPath, this.getBaseUrl())

    return url.href
  }

  getGuideXmlUrl(): string {
    if (!this.guideXmlPath) return ''

    const url = new URL(this.guideXmlPath, this.getBaseUrl())

    return url.href
  }

  getGuideGzipUrl(): string {
    if (!this.guideGzipPath) return ''

    const url = new URL(this.guideGzipPath, this.getBaseUrl())

    return url.href
  }

  getGuideJsonUrl(): string {
    if (!this.guideJsonPath) return ''

    const url = new URL(this.guideJsonPath, this.getBaseUrl())

    return url.href
  }

  getStatusEmoji(): string {
    if (!this.status) return '⚪'
    if (this.status === 'OK') return '🟢'

    return '🔴'
  }

  getChannelsCount(): number {
    if (!this.channels) return 0

    return this.channels.count()
  }

  getLastUpdated(): string {
    if (!this.lastUpdated) return '-'

    const now = dayjs.utc(process.env.CURR_DATE || new Date().toISOString())

    return dayjs.utc(this.lastUpdated).from(now)
  }

  getGuideSources(): WorkerGuideSource[] {
    const sources = []

    if (this.guideXmlPath) {
      const url = new URL(this.guideXmlPath, this.getBaseUrl())
      sources.push({ host: this.host, url: url.href, format: 'XML' })
    }

    if (this.guideGzipPath) {
      const url = new URL(this.guideGzipPath, this.getBaseUrl())
      sources.push({ host: this.host, url: url.href, format: 'GZIP' })
    }

    if (this.guideJsonPath) {
      const url = new URL(this.guideJsonPath, this.getBaseUrl())
      sources.push({ host: this.host, url: url.href, format: 'JSON' })
    }

    return sources
  }

  toJSON(): WorkerData {
    return {
      host: this.host,
      channelsPath: this.channelsPath,
      channels: this.channels ? this.channels.map(c => c.toObject()).all() : [],
      guideXmlPath: this.guideXmlPath,
      guideGzipPath: this.guideGzipPath,
      guideJsonPath: this.guideJsonPath,
      status: this.status,
      lastUpdated: this.lastUpdated
    }
  }
}
