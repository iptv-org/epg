import { ChannelGuideObject } from '../types/channel'
import * as epgGrabber from 'epg-grabber'
import { SITES_DIR } from '../constants'
import path from 'node:path'

export class Channel extends epgGrabber.Channel {
  getGuideObject(): ChannelGuideObject {
    const [channelId, feedId] = this.xmltv_id.split('@')

    return {
      channel: channelId || null,
      feed: feedId || null,
      site: this.site,
      site_id: this.site_id,
      site_name: this.name,
      lang: this.lang || 'en'
    }
  }

  getConfigPath(): string {
    return path.resolve(SITES_DIR, `${this.site}/${this.site}.config.js`)
  }
}
