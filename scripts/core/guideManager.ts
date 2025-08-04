import { Collection, Logger, Zip, Storage, StringTemplate } from '@freearhey/core'
import epgGrabber from 'epg-grabber'
import { OptionValues } from 'commander'
import { Channel, Feed, Guide } from '../models'
import path from 'path'
import { DataLoader, DataProcessor } from '.'
import { DataLoaderData } from '../types/dataLoader'
import { DataProcessorData } from '../types/dataProcessor'
import { DATA_DIR } from '../constants'

interface GuideManagerProps {
  options: OptionValues
  logger: Logger
  channels: Collection
  programs: Collection
}

export class GuideManager {
  options: OptionValues
  logger: Logger
  channels: Collection
  programs: Collection

  constructor({ channels, programs, logger, options }: GuideManagerProps) {
    this.options = options
    this.logger = logger
    this.channels = channels
    this.programs = programs
  }

  async createGuides() {
    const pathTemplate = new StringTemplate(this.options.output)

    const processor = new DataProcessor()
    const dataStorage = new Storage(DATA_DIR)
    const loader = new DataLoader({ storage: dataStorage })
    const data: DataLoaderData = await loader.load()
    const { feedsKeyByStreamId, channelsKeyById }: DataProcessorData = processor.process(data)

    const groupedChannels = this.channels
      .map((channel: epgGrabber.Channel) => {
        if (channel.xmltv_id && !channel.icon) {
          const foundFeed: Feed = feedsKeyByStreamId.get(channel.xmltv_id)
          if (foundFeed && foundFeed.hasLogo()) {
            channel.icon = foundFeed.getLogoUrl()
          } else {
            const [channelId] = channel.xmltv_id.split('@')
            const foundChannel: Channel = channelsKeyById.get(channelId)
            if (foundChannel && foundChannel.hasLogo()) {
              channel.icon = foundChannel.getLogoUrl()
            }
          }
        }

        return channel
      })
      .orderBy([
        (channel: epgGrabber.Channel) => channel.index,
        (channel: epgGrabber.Channel) => channel.xmltv_id
      ])
      .uniqBy(
        (channel: epgGrabber.Channel) => `${channel.xmltv_id}:${channel.site}:${channel.lang}`
      )
      .groupBy((channel: epgGrabber.Channel) => {
        return pathTemplate.format({ lang: channel.lang || 'en', site: channel.site || '' })
      })

    const groupedPrograms = this.programs
      .orderBy([
        (program: epgGrabber.Program) => program.channel,
        (program: epgGrabber.Program) => program.start
      ])
      .groupBy((program: epgGrabber.Program) => {
        const lang =
          program.titles && program.titles.length && program.titles[0].lang
            ? program.titles[0].lang
            : 'en'

        return pathTemplate.format({ lang, site: program.site || '' })
      })

    for (const groupKey of groupedPrograms.keys()) {
      const guide = new Guide({
        filepath: groupKey,
        gzip: this.options.gzip,
        channels: new Collection(groupedChannels.get(groupKey)),
        programs: new Collection(groupedPrograms.get(groupKey))
      })

      await this.save(guide)
    }
  }

  async save(guide: Guide) {
    const storage = new Storage(path.dirname(guide.filepath))
    const xmlFilepath = guide.filepath
    const xmlFilename = path.basename(xmlFilepath)
    this.logger.info(`  saving to "${xmlFilepath}"...`)
    const xmltv = guide.toString()
    await storage.save(xmlFilename, xmltv)

    if (guide.gzip) {
      const zip = new Zip()
      const compressed = zip.compress(xmltv)
      const gzFilepath = `${guide.filepath}.gz`
      const gzFilename = path.basename(gzFilepath)
      this.logger.info(`  saving to "${gzFilepath}"...`)
      await storage.save(gzFilename, compressed)
    }
  }
}
