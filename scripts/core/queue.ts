import { Dictionary } from '@freearhey/core'
import { SiteConfig, Channel } from 'epg-grabber'

export interface QueueItem {
  channel: Channel
  date: string
  config: SiteConfig
  error: string | null
}

export class Queue {
  _data: Dictionary

  constructor() {
    this._data = new Dictionary()
  }

  missing(key: string): boolean {
    return this._data.missing(key)
  }

  add(
    key: string,
    { channel, config, date }: { channel: Channel; date: string | null; config: SiteConfig }
  ) {
    this._data.set(key, {
      channel,
      date,
      config,
      error: null
    })
  }

  size(): number {
    return Object.values(this._data.data()).length
  }

  items(): QueueItem[] {
    return Object.values(this._data.data()) as QueueItem[]
  }

  isEmpty(): boolean {
    return this.size() === 0
  }
}
