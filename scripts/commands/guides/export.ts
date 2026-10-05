import { SITES_DIR, API_DIR, DATA_DIR } from '../../constants'
import { Logger, Collection } from '@freearhey/core'
import epgGrabber, { EPGGrabber } from 'epg-grabber'
import { Storage } from '@freearhey/storage-js'
import { Channel, Worker, WorkerData } from '../../models'
import path from 'path'
import { ApiGuide } from '../../models/apiGuide'

async function main() {
  const logger = new Logger()

  logger.start('staring...')

  logger.info('loading channels...')
  const channels = await loadChannels()
  logger.info(`found ${channels.count()} channel(s)`)

  logger.info('loading workers.json...')
  const workers = await loadWorkers()
  const guidesMap = workers.reduce((acc, data: WorkerData) => {
    const worker = new Worker(data)
    if (!worker.channels) return acc
    worker.channels.forEach(channel => {
      const [channelId, feedId] = channel.xmltv_id.split('@')
      const key = [channelId, feedId, channel.site, channel.site_id, channel.lang].join('_')
      acc[key] = worker.getGuideSources()
    })
    return acc
  }, {})

  logger.info('preparing output...')
  const output = channels.map((channel: Channel) => {
    const [channelId, feedId] = channel.xmltv_id.split('@')
    const key = [channelId, feedId, channel.site, channel.site_id, channel.lang].join('_')

    return new ApiGuide({
      channel: channelId,
      feed: feedId,
      site: channel.site,
      site_id: channel.site_id,
      site_name: channel.name,
      lang: channel.lang,
      sources: guidesMap[key] || []
    })
  })

  logger.info('saving output...')
  const outputFilename = 'guides.json'
  await saveOutput(outputFilename, output.toJSON())

  logger.info(`saved to "${path.join(API_DIR, outputFilename)}"`)
}

main()

async function saveOutput(filename: string, json: string) {
  const apiStorage = new Storage(API_DIR)
  await apiStorage.save(filename, json)
}

async function loadWorkers() {
  const dataStorage = new Storage(DATA_DIR)

  const workers = await dataStorage.json('workers.json')

  return Array.isArray(workers) ? workers : []
}

async function loadChannels() {
  const sitesStorage = new Storage(SITES_DIR)

  const files: string[] = await sitesStorage.list('**/*.channels.xml')

  const channels = new Collection<Channel>()
  for (const filepath of files) {
    const xml = await sitesStorage.load(filepath)
    const parsedChannels = EPGGrabber.parseChannelsXML(xml)
    const channelsFromXML = new Collection(parsedChannels).map(
      (channel: epgGrabber.Channel) => new Channel(channel.toObject())
    )

    channelsFromXML.forEach((channel: Channel) => {
      channels.add(channel)
    })
  }

  return channels
}
