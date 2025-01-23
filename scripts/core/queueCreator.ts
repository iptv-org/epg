import { Storage, Collection, DateTime, Logger } from '@freearhey/core'
import { ChannelsParser, ConfigLoader, ApiChannel, Queue } from './'
import { SITES_DIR, DATA_DIR } from '../constants'
import { SiteConfig } from 'epg-grabber'
import path from 'path'
import { GrabOptions } from '../commands/epg/grab'

type QueueCreatorProps = {
  logger: Logger
  options: GrabOptions
  parsedChannels: Collection
}

export class QueueCreator {
  configLoader: ConfigLoader
  logger: Logger
  sitesStorage: Storage
  dataStorage: Storage
  parser: ChannelsParser
  parsedChannels: Collection
  options: GrabOptions

  constructor({ parsedChannels, logger, options }: QueueCreatorProps) {
    this.parsedChannels = parsedChannels
    this.logger = logger
    this.sitesStorage = new Storage()
    this.dataStorage = new Storage(DATA_DIR)
    this.parser = new ChannelsParser({ storage: new Storage() })
    this.options = options
    this.configLoader = new ConfigLoader()
  }

  async create(): Promise<Queue> {
    const channelsContent = await this.dataStorage.json('channels.json')
    const channels = new Collection(channelsContent).map(data => new ApiChannel(data))

    const queue = new Queue()
    for (const channel of this.parsedChannels.all()) {
      if (!channel.site || !channel.site_id || !channel.name) continue
      if (this.options.lang && channel.lang !== this.options.lang) continue

      const configPath = path.resolve(SITES_DIR, `${channel.site}/${channel.site}.config.js`)
      const config: SiteConfig = await this.configLoader.load(configPath)

      if (channel.xmltv_id) {
        if (!channel.icon) {
          const found: ApiChannel = channels.first(
            (_channel: ApiChannel) => _channel.id === channel.xmltv_id
          )

          if (found) {
            channel.icon = found.logo
          }
        }
      } else {
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
