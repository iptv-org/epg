import relativeTime from 'dayjs/plugin/relativeTime'
import { Collection } from '@freearhey/core'
import { Channel } from './channel'
import utc from 'dayjs/plugin/utc'
import dayjs from 'dayjs'

dayjs.extend(relativeTime)
dayjs.extend(utc)

export interface WorkerData {
  host: string
}

export class Worker {
  host: string
  channelsPath?: string
  guideXmlPath?: string
  guideGzipPath?: string
  guideJsonPath?: string
  channels?: Collection<Channel>
  status?: string
  lastUpdated?: string

  constructor(data: WorkerData) {
    this.host = data.host
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

    let now = dayjs()
    if (process.env.NODE_ENV === 'test') now = dayjs.utc('2026-02-13')

    return dayjs.utc(this.lastUpdated).from(now)
  }

  getLinks(): { url: string; label: string }[] {
    const links = []

    if (this.guideXmlPath) {
      const url = new URL(this.guideXmlPath, this.getBaseUrl())
      links.push({ url: url.href, label: 'XML' })
    }

    if (this.guideGzipPath) {
      const url = new URL(this.guideGzipPath, this.getBaseUrl())
      links.push({ url: url.href, label: 'GZIP' })
    }

    if (this.guideJsonPath) {
      const url = new URL(this.guideJsonPath, this.getBaseUrl())
      links.push({ url: url.href, label: 'JSON' })
    }

    return links
  }
}
