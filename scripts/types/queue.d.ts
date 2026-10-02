import { Channel } from '../models/channel'
import epgGrabber from 'epg-grabber'
import { Dayjs } from 'dayjs'

export interface QueueItem {
  channel: Channel
  date: Dayjs
  config: epgGrabber.Types.SiteConfig
  error: string | null
}
