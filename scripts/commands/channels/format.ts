import { Collection, Logger } from '@freearhey/core'
import epgGrabber, { EPGGrabber } from 'epg-grabber'
import { generateChannelsXML } from '../../core'
import { Storage } from '@freearhey/storage-js'
import { SITES_DIR } from '../../constants'
import { data, loadData } from '../../api'
import { Channel } from '../../models'
import { program } from 'commander'

program.argument('[filepath...]', 'Path to file to format').parse(process.argv)

async function main() {
  const logger = new Logger()

  logger.info('loading data from api...')
  await loadData()

  logger.info('loading *.channels.xml files...')
  const storage = new Storage()
  const files = program.args.length
    ? program.args
    : await storage.list(`${SITES_DIR}/**/*.channels.xml`)

  logger.info(`found ${files.length} file(s)`)

  logger.info('formating...')
  for (const filepath of files) {
    if (!storage.existsSync(filepath)) continue

    const xml = await storage.load(filepath)
    const parsedChannels = EPGGrabber.parseChannelsXML(xml)
    const channelsFromXML = new Collection(parsedChannels).map(
      (channel: epgGrabber.Channel) => new Channel(channel.toObject())
    )

    channelsFromXML.forEach((channel: Channel) => {
      if (!channel.xmltv_id) return
      if (data.feedsKeyByStreamId.get(channel.xmltv_id)) return

      const channelData = data.channelsKeyById.get(channel.xmltv_id)
      if (channelData) {
        const mainFeed = channelData.getMainFeed()
        if (mainFeed) {
          channel.xmltv_id = mainFeed.getStreamId()
          return
        }
      }

      channel.xmltv_id = ''
    })

    channelsFromXML.sortBy((channel: Channel) => channel.site_id)

    const output = generateChannelsXML(channelsFromXML)

    await storage.save(filepath, output)
  }
}

main()
