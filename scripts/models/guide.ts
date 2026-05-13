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
  gzip: boolean | string
  json: boolean | string
}

export class Guide {
  channels: Collection<Channel>
  programs: Collection<Program>
  filepath: string
  gzip: boolean | string
  json: boolean | string

  constructor(data: GuideData) {
    this.channels = data.channels
    this.programs = data.programs
    this.filepath = data.filepath
    this.gzip = data.gzip || false
    this.json = data.json || false
  }

  addChannel(channel: Channel) {
    this.channels.add(channel)
  }

  toString() {
    const currDate = dayjs.utc(process.env.CURR_DATE || new Date().toISOString())
    const headers = { date: currDate.format('YYYYMMDD') }

    return EPGGrabber.generateXMLTV(this.channels.all(), this.programs.all(), headers)
  }

  async save({ logger }: { logger: Logger }) {
    const storage = new Storage()
    const xmltv = this.toString()
    const xmlFilepath = this.filepath
    logger.info(`  saving to "${xmlFilepath}"...`)
    await storage.save(xmlFilepath, xmltv)

    if (this.gzip) {
      const compressed = pako.gzip(xmltv)
      const gzFilepath = typeof this.gzip === 'string' ? this.gzip : `${this.filepath}.gz`
      logger.info(`  saving to "${gzFilepath}"...`)
      await storage.save(gzFilepath, compressed)
    }

    if (this.json) {
      const dir = path.dirname(this.filepath)
      const filename = path.basename(this.filepath).split('.')[0]
      const jsonFilepath =
        typeof this.json === 'string' ? this.json : path.join(dir, `${filename}.json`)
      const currDate = dayjs.utc(process.env.CURR_DATE || new Date().toISOString())
      const headers = { date: currDate.format('YYYYMMDD') }
      const channels = this.channels.map((channel: Channel) => channel.toObject()).all()
      const programs = this.programs.map((program: Program) => program.toObject()).all()
      const json = JSON.stringify({ ...headers, channels, programs })
      logger.info(`  saving to "${jsonFilepath}"...`)
      await storage.save(jsonFilepath, json)
    }
  }
}
