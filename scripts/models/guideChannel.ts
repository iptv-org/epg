import { Dictionary } from '@freearhey/core'
import epgGrabber from 'epg-grabber'
import { Feed, Channel } from '.'

export class GuideChannel {
  channelId?: string
  channel?: Channel
  feedId?: string
  feed?: Feed
  xmltvId?: string
  languageCode?: string
  siteId?: string
  logoUrl?: string
  siteDomain?: string
  siteName?: string

  constructor(data: epgGrabber.Channel) {
    const [channelId, feedId] = data.xmltv_id ? data.xmltv_id.split('@') : [undefined, undefined]

    this.channelId = channelId
    this.feedId = feedId
    this.xmltvId = data.xmltv_id
    this.languageCode = data.lang
    this.siteId = data.site_id
    this.logoUrl = data.logo
    this.siteDomain = data.site
    this.siteName = data.name
  }

  withChannel(channelsKeyById: Dictionary): this {
    if (this.channelId) this.channel = channelsKeyById.get(this.channelId)

    return this
  }

  withFeed(feedsKeyByStreamId: Dictionary): this {
    if (this.feedId) this.feed = feedsKeyByStreamId.get(this.getStreamId())

    return this
  }

  getStreamId(): string {
    if (!this.channelId) return ''
    if (!this.feedId) return this.channelId

    return `${this.channelId}@${this.feedId}`
  }

  toJSON() {
    return {
      channel: this.channelId || null,
      feed: this.feedId || null,
      site: this.siteDomain || '',
      site_id: this.siteId || '',
      site_name: this.siteName || '',
      lang: this.languageCode || ''
    }
  }
}
