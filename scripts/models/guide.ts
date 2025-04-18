import type { GuideData } from '../types/guide'
import { uniqueId } from 'lodash'

export class Guide {
  channelId?: string
  feedId?: string
  siteDomain?: string
  siteId?: string
  siteName?: string
  languageCode?: string

  constructor(data?: GuideData) {
    if (!data) return

    this.channelId = data.channel
    this.feedId = data.feed
    this.siteDomain = data.site
    this.siteId = data.site_id
    this.siteName = data.site_name
    this.languageCode = data.lang
  }

  getUUID(): string {
    if (!this.getStreamId() || !this.siteId) return uniqueId()

    return this.getStreamId() + this.siteId
  }

  getStreamId(): string | undefined {
    if (!this.channelId) return undefined
    if (!this.feedId) return this.channelId

    return `${this.channelId}@${this.feedId}`
  }
}
