import epgGrabber, { EPGGrabber } from 'epg-grabber'
import { DATA_DIR, ROOT_DIR } from '../../constants'
import AxiosMockAdapter from 'axios-mock-adapter'
import { Storage } from '@freearhey/storage-js'
import { Channel, Worker } from '../../models'
import { Collection } from '@freearhey/core'
import { Logger } from '@freearhey/core'
import epgParser from 'epg-parser'
import axios from 'axios'
import path from 'path'

async function main() {
  const logger = new Logger({ level: process.env.NODE_ENV === 'test' ? -999 : 3 })
  const rootStorage = new Storage(ROOT_DIR)
  const workers = new Map<string, Worker>()

  logger.info('loading workers.txt...')
  const workersTxt = await rootStorage.load('workers.txt')
  const hosts = workersTxt.split('\r\n')

  hosts.forEach((host: string) => {
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
        const testStorage = new Storage('tests/__data__/input/workers_load')
        mock.onGet('worker.json').reply(200, await testStorage.load('worker.json'))
        mock.onGet('channels.xml').reply(200, await testStorage.load('channels.xml'))
        mock.onGet('guide.xml').reply(200, await testStorage.load('guide.xml'))
      }
    }

    const workerConfig = await client
      .get('worker.json')
      .then(res => res.data)
      .catch(err => {
        worker.setStatus(err.status)
        logger.error(err.message)
      })

    if (!workerConfig) {
      worker.setStatus('MISSING_WORKER_CONFIG')
      logger.error('Unable to load "worker.json"')
      continue
    }

    worker
      .setChannelsPath(workerConfig.channels)
      .setGuideXmlPath(
        typeof workerConfig.guide === 'string' ? workerConfig.guide : workerConfig?.guide?.xml
      )
      .setGuideGzipPath(workerConfig?.guide?.gzip)
      .setGuideJsonPath(workerConfig?.guide?.json)

    if (!worker.channelsPath) {
      worker.setStatus('MISSING_CHANNELS_PATH')
      logger.error('The "channels" property is missing from the workers config')
      continue
    }

    if (!worker.guideXmlPath) {
      worker.setStatus('MISSING_GUIDE_XML_PATH')
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
      .get(worker.guideXmlPath)
      .then(res => res.data)
      .catch(err => {
        worker.setStatus(err.status)
        logger.error(err.message)
      })

    if (!guideXml) continue

    const parsedGuide = epgParser.parse(guideXml)
    worker.lastUpdated = parsedGuide.date

    worker.setStatus('OK')
  }

  const output = [...workers.values()]
  const dataStorage = new Storage(DATA_DIR)
  const outputFilename = 'workers.json'
  await dataStorage.save(outputFilename, JSON.stringify(output))

  logger.info(`saved to "${path.join(DATA_DIR, outputFilename)}"`)
}

main()
