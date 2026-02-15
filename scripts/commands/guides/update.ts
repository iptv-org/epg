import { HTMLTableRow, HTMLTableDataItem, HTMLTableColumn } from '../../types/htmlTable'
import epgGrabber, { EPGGrabber } from 'epg-grabber'
import AxiosMockAdapter from 'axios-mock-adapter'
import { Storage } from '@freearhey/storage-js'
import { Channel, Worker } from '../../models'
import { Collection } from '@freearhey/core'
import { ROOT_DIR } from '../../constants'
import { Logger } from '@freearhey/core'
import { HTMLTable } from '../../core'
import epgParser from 'epg-parser'
import axios from 'axios'

async function main() {
  const logger = new Logger({ level: process.env.NODE_ENV === 'test' ? -999 : 3 })
  const rootStorage = new Storage(ROOT_DIR)
  const workers = new Map<string, Worker>()

  logger.info('loading workers.txt...')
  const workersTxt = await rootStorage.load('workers.txt')

  workersTxt.split('\r\n').forEach((host: string) => {
    if (!host) return

    const worker = new Worker({ host })

    workers.set(host, worker)
  })

  for (const worker of workers.values()) {
    logger.info(`processing "${worker.host}"...`)

    const client = axios.create({
      baseURL: worker.getBaseUrl(),
      timeout: 60000
    })

    if (process.env.NODE_ENV === 'test') {
      const mock = new AxiosMockAdapter(client)
      if (worker.host === 'example.com') {
        mock.onGet('worker.json').reply(404)
      } else {
        const testStorage = new Storage('tests/__data__/input/guides_update')
        mock.onGet('worker.json').reply(200, await testStorage.load('worker.json'))
        mock.onGet('channels.xml').reply(200, await testStorage.load('channels.xml'))
        mock.onGet('guide.xml').reply(200, await testStorage.load('guide.xml'))
      }
    }

    const workerJson = await client
      .get('worker.json')
      .then(res => res.data)
      .catch(err => {
        worker.status = err.status
        logger.error(err.message)
      })

    if (!workerJson) {
      worker.status = 'MISSING_WORKER_CONFIG'
      logger.error('Unable to load "workers.json"')
      continue
    }

    worker.channelsPath = workerJson.channels
    worker.guidePath = workerJson.guide

    if (!worker.channelsPath) {
      worker.status = 'MISSING_CHANNELS_PATH'
      logger.error('The "channels" property is missing from the workers config')
      continue
    }

    if (!worker.guidePath) {
      worker.status = 'MISSING_GUIDE_PATH'
      logger.error('The "guide" property is missing from the workers config')
      continue
    }

    const channelsXml = await client
      .get(worker.channelsPath)
      .then(res => res.data)
      .catch(err => {
        worker.status = err.status
        logger.error(err.message)
      })

    if (!channelsXml) continue

    const parsedChannels = EPGGrabber.parseChannelsXML(channelsXml)
    worker.channels = new Collection(parsedChannels).map(
      (channel: epgGrabber.Channel) => new Channel(channel.toObject())
    )

    const guideXml = await client
      .get(worker.guidePath)
      .then(res => res.data)
      .catch(err => {
        worker.status = err.status
        logger.error(err.message)
      })

    if (!guideXml) continue

    const parsedGuide = epgParser.parse(guideXml)
    worker.lastUpdated = parsedGuide.date

    worker.status = 'OK'
  }

  logger.info('creating guides table...')
  const rows = new Collection<HTMLTableRow>()
  workers.forEach((worker: Worker) => {
    rows.add(
      new Collection<HTMLTableDataItem>([
        { value: worker.host },
        { value: worker.getStatusEmoji(), align: 'center' },
        { value: worker.getChannelsCount().toString(), align: 'right' },
        { value: worker.getLastUpdated(), align: 'left' },
        {
          value:
            worker.status === 'OK'
              ? `<a href="${worker.getChannelsUrl()}">${worker.channelsPath}</a><br><a href="${worker.getGuideUrl()}">${worker.guidePath}</a>`
              : ''
        }
      ])
    )
  })

  logger.info('updating guides.md...')
  const table = new HTMLTable(
    rows,
    new Collection<HTMLTableColumn>([
      { name: 'Host', align: 'left' },
      { name: 'Status', align: 'left' },
      { name: 'Channels', align: 'left' },
      { name: 'Last Updated', align: 'left' },
      { name: 'Links', align: 'left' }
    ])
  )
  const guidesTemplate = await new Storage().load('scripts/templates/_guides.md')
  const guidesContent = guidesTemplate.replace('_TABLE_', table.toString())
  await rootStorage.save('GUIDES.md', guidesContent)
}

main()
