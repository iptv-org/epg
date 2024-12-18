import { Collection, Logger, DateTime, Storage, Zip } from '@freearhey/core'
import { Channel } from 'epg-grabber'
import { XMLTV } from '../core'
import path from 'path'

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
    this.storage = new Storage(path.dirname(filepath))
    this.filepath = filepath
    this.gzip = gzip || false
  }

  async save() {
    const channels = this.channels.uniqBy(
      (channel: Channel) => `${channel.xmltv_id}:${channel.site}`
    )
    const programs = this.programs

    const currDate = new DateTime(process.env.CURR_DATE || new Date().toISOString(), {
      zone: 'UTC'
    })
    const xmltv = new XMLTV({
      channels,
      programs,
      date: currDate
    })

    const xmlFilepath = this.filepath
    const xmlFilename = path.basename(xmlFilepath)
    this.logger.info(`  saving to "${xmlFilepath}"...`)
    await this.storage.save(xmlFilename, xmltv.toString())

    if (this.gzip) {
      const zip = new Zip()
      const compressed = await zip.compress(xmltv.toString())
      const gzFilepath = `${this.filepath}.gz`
      const gzFilename = path.basename(gzFilepath)
      this.logger.info(`  saving to "${gzFilepath}"...`)
      await this.storage.save(gzFilename, compressed)
    }
  }
}
