import relativeTime from 'dayjs/plugin/relativeTime'
import { Collection } from '@freearhey/core'
import { Channel } from './channel'
import dayjs from 'dayjs'

dayjs.extend(relativeTime)

export interface WorkerData {
  host: string
}

export class Worker {
  host: string
  channelsPath?: string
  guidePath?: string
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

  getGuideUrl(): string {
    if (!this.guidePath) return ''

    const url = new URL(this.guidePath, this.getBaseUrl())

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

    return dayjs().to(dayjs(this.lastUpdated))
  }
}
