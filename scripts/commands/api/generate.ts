import { Logger, Collection, Storage } from '@freearhey/core'
import { SITES_DIR, API_DIR } from '../../constants'
import { GuideChannel } from '../../models'
import { ChannelsParser } from '../../core'
import epgGrabber from 'epg-grabber'
import path from 'path'

async function main() {
  const logger = new Logger()

  logger.start('staring...')

  logger.info('loading channels...')
  const sitesStorage = new Storage(SITES_DIR)
  const parser = new ChannelsParser({
    storage: sitesStorage
  })

  const files: string[] = await sitesStorage.list('**/*.channels.xml')

  const channels = new Collection()
  for (const filepath of files) {
    const channelList = await parser.parse(filepath)

    channelList.channels.forEach((data: epgGrabber.Channel) => {
      channels.add(new GuideChannel(data))
    })
  }

  logger.info(`found ${channels.count()} channel(s)`)

  const output = channels.map((channel: GuideChannel) => channel.toJSON())

  const apiStorage = new Storage(API_DIR)
  const outputFilename = 'guides.json'
  await apiStorage.save('guides.json', output.toJSON())

  logger.info(`saved to "${path.join(API_DIR, outputFilename)}"`)
}

main()
