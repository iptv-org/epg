import { Collection, Logger, Storage, StringTemplate } from '@freearhey/core'
import { OptionValues } from 'commander'
import { Channel, Program } from 'epg-grabber'
import { Guide } from '.'

type GuideManagerProps = {
  options: OptionValues
  logger: Logger
  channels: Collection
  programs: Collection
}

export class GuideManager {
  options: OptionValues
  storage: Storage
  logger: Logger
  channels: Collection
  programs: Collection

  constructor({ channels, programs, logger, options }: GuideManagerProps) {
    this.options = options
    this.logger = logger
    this.channels = channels
    this.programs = programs
    this.storage = new Storage()
  }

  async createGuides() {
    const pathTemplate = new StringTemplate(this.options.output)

    const groupedChannels = this.channels
      .orderBy([(channel: Channel) => channel.xmltv_id])
      .uniqBy((channel: Channel) => `${channel.xmltv_id}:${channel.site}:${channel.lang}`)
      .groupBy((channel: Channel) => {
        return pathTemplate.format({ lang: channel.lang || 'en', site: channel.site || '' })
      })

    const groupedPrograms = this.programs
      .orderBy([(program: Program) => program.channel, (program: Program) => program.start])
      .groupBy((program: Program) => {
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
        programs: new Collection(groupedPrograms.get(groupKey)),
        logger: this.logger
      })

      await guide.save()
    }
  }
}
