import { ChannelGuideObject } from '../../types/channel'
import { SITES_DIR, API_DIR } from '../../constants'
import { Logger, Collection } from '@freearhey/core'
import epgGrabber, { EPGGrabber } from 'epg-grabber'
import { Storage } from '@freearhey/storage-js'
import { Channel } from '../../models'
import path from 'path'

async function main() {
  const logger = new Logger()

  logger.start('staring...')

  logger.info('loading channels...')
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

  logger.info(`found ${channels.count()} channel(s)`)

  const output = channels.map<ChannelGuideObject>((channel: Channel) => channel.getGuideObject())

  const apiStorage = new Storage(API_DIR)
  const outputFilename = 'guides.json'
  await apiStorage.save('guides.json', output.toJSON())

  logger.info(`saved to "${path.join(API_DIR, outputFilename)}"`)
}

main()
