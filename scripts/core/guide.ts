import { Collection, Logger, DateTime, Storage, Zip } from '@freearhey/core'
import { Channel } from 'epg-grabber'
import { XMLTV } from '../core'
import { CURR_DATE } from '../constants'

type GuideProps = {
  channels: Collection
  programs: Collection
  logger: Logger
  filepath: string
  gzip: boolean
}

export class Guide {
  channels: Collection
  programs: Collection
  logger: Logger
  storage: Storage
  filepath: string
  gzip: boolean

  constructor({ channels, programs, logger, filepath, gzip }: GuideProps) {
    this.channels = channels
    this.programs = programs
    this.logger = logger
    this.storage = new Storage()
    this.filepath = filepath
    this.gzip = gzip || false
  }

  async save() {
    const channels = this.channels.uniqBy(
      (channel: Channel) => `${channel.xmltv_id}:${channel.site}`
    )
    const programs = this.programs

    const xmltv = new XMLTV({
      channels,
      programs,
      date: new DateTime(CURR_DATE, { zone: 'UTC' })
    })

    const xmlFilepath = this.filepath
    this.logger.info(`  saving to "${xmlFilepath}"...`)
    await this.storage.save(xmlFilepath, xmltv.toString())

    if (this.gzip) {
      const zip = new Zip()
      const compressed = await zip.compress(xmltv.toString())
      const gzFilepath = `${this.filepath}.gz`
      this.logger.info(`  saving to "${gzFilepath}"...`)
      await this.storage.save(gzFilepath, compressed)
    }
  }
}
