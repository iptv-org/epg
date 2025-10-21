import { Collection, Logger } from '@freearhey/core'
import { Storage } from '@freearhey/storage-js'
import { EPGGrabber } from 'epg-grabber'
import { Channel, Program } from '.'
import utc from 'dayjs/plugin/utc'
import dayjs from 'dayjs'
import path from 'node:path'
import pako from 'pako'

dayjs.extend(utc)

interface GuideData {
  channels: Collection<Channel>
  programs: Collection<Program>
  filepath: string
  gzip: boolean
}

export class Guide {
  channels: Collection<Channel>
  programs: Collection<Program>
  filepath: string
  gzip: boolean

  constructor(data: GuideData) {
    this.channels = data.channels
    this.programs = data.programs
    this.filepath = data.filepath
    this.gzip = data.gzip || false
  }

  addChannel(channel: Channel) {
    this.channels.add(channel)
  }

  toString() {
    const currDate = dayjs.utc(process.env.CURR_DATE || new Date().toISOString())

    return EPGGrabber.generateXMLTV(this.channels.all(), this.programs.all(), currDate)
  }

  async save({ logger }: { logger: Logger }) {
    const dir = path.dirname(this.filepath)
    const storage = new Storage(dir)
    const xmlFilepath = this.filepath
    const xmlFilename = path.basename(xmlFilepath)
    logger.info(`  saving to "${xmlFilepath}"...`)
    const xmltv = this.toString()
    await storage.save(xmlFilename, xmltv)

    if (this.gzip) {
      const compressed = pako.gzip(xmltv)
      const gzFilepath = `${this.filepath}.gz`
      const gzFilename = path.basename(gzFilepath)
      logger.info(`  saving to "${gzFilepath}"...`)
      await storage.save(gzFilename, compressed)
    }
  }
}
