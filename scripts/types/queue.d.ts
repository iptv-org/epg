import { SiteConfig } from '../core/siteConfig'
import { Channel } from '../models/channel'
import { Dayjs } from 'dayjs'

export interface QueueItem {
  channel: Channel
  date: Dayjs
  siteConfig: SiteConfig
  error: string | null
}
