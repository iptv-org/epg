import { Storage, Collection, DateTime, Logger } from '@freearhey/core'
import { SITES_DIR, DATA_DIR } from '../constants'
import { GrabOptions } from '../commands/epg/grab'
import { ConfigLoader, Queue } from './'
import { SiteConfig } from 'epg-grabber'
import path from 'path'

interface QueueCreatorProps {
  logger: Logger
  options: GrabOptions
  channels: Collection
}

export class QueueCreator {
  configLoader: ConfigLoader
  logger: Logger
  sitesStorage: Storage
  dataStorage: Storage
  channels: Collection
  options: GrabOptions

  constructor({ channels, logger, options }: QueueCreatorProps) {
    this.channels = channels
    this.logger = logger
    this.sitesStorage = new Storage()
    this.dataStorage = new Storage(DATA_DIR)
    this.options = options
    this.configLoader = new ConfigLoader()
  }

  async create(): Promise<Queue> {
    let index = 0
    const queue = new Queue()
    for (const channel of this.channels.all()) {
      channel.index = index++
      if (!channel.site || !channel.site_id || !channel.name) continue

      const configPath = path.resolve(SITES_DIR, `${channel.site}/${channel.site}.config.js`)
      const config: SiteConfig = await this.configLoader.load(configPath)

      if (!channel.xmltv_id) {
        channel.xmltv_id = channel.site_id
      }

      const days = this.options.days || config.days || 1
      const currDate = new DateTime(process.env.CURR_DATE || new Date().toISOString())
      const dates = Array.from({ length: days }, (_, day) => currDate.add(day, 'd'))
      dates.forEach((date: DateTime) => {
        const dateString = date.toJSON()
        const key = `${channel.site}:${channel.lang}:${channel.xmltv_id}:${dateString}`
        if (queue.missing(key)) {
          queue.add(key, {
            channel,
            date: dateString,
            config
          })
        }
      })
    }

    return queue
  }
}
