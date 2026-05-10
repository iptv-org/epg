import * as epgGrabber from 'epg-grabber'
import { SITES_DIR } from '../constants'
import path from 'node:path'

export class Channel extends epgGrabber.Channel {
  getConfigPath(): string {
    return path.resolve(SITES_DIR, `${this.site}/${this.site}.config.js`)
  }
}
