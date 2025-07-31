import { ChannelsParser, DataLoader, DataProcessor } from '../../core'
import { DataProcessorData } from '../../types/dataProcessor'
import { Storage, Dictionary, File } from '@freearhey/core'
import { DataLoaderData } from '../../types/dataLoader'
import { ChannelList } from '../../models'
import { DATA_DIR } from '../../constants'
import epgGrabber from 'epg-grabber'
import { program } from 'commander'
import chalk from 'chalk'
import langs from 'langs'

program.argument('[filepath...]', 'Path to *.channels.xml files to validate').parse(process.argv)

interface ValidationError {
  type: 'duplicate' | 'wrong_channel_id' | 'wrong_feed_id' | 'wrong_lang'
  name: string
  lang?: string
  xmltv_id?: string
  site_id?: string
  logo?: string
}

async function main() {
  const processor = new DataProcessor()
  const dataStorage = new Storage(DATA_DIR)
  const loader = new DataLoader({ storage: dataStorage })
  const data: DataLoaderData = await loader.load()
  const { channelsKeyById, feedsKeyByStreamId }: DataProcessorData = processor.process(data)
  const parser = new ChannelsParser({
    storage: new Storage()
  })

  let totalFiles = 0
  let totalErrors = 0
  let totalWarnings = 0

  const storage = new Storage()
  const files = program.args.length ? program.args : await storage.list('sites/**/*.channels.xml')
  for (const filepath of files) {
    const file = new File(filepath)
    if (file.extension() !== 'xml') continue

    const channelList: ChannelList = await parser.parse(filepath)

    const bufferBySiteId = new Dictionary()
    const errors: ValidationError[] = []
    channelList.channels.forEach((channel: epgGrabber.Channel) => {
      const bufferId: string = channel.site_id
      if (bufferBySiteId.missing(bufferId)) {
        bufferBySiteId.set(bufferId, true)
      } else {
        errors.push({ type: 'duplicate', ...channel })
        totalErrors++
      }

      if (!langs.where('1', channel.lang ?? '')) {
        errors.push({ type: 'wrong_lang', ...channel })
        totalErrors++
      }

      if (!channel.xmltv_id) return
      const [channelId, feedId] = channel.xmltv_id.split('@')

      const foundChannel = channelsKeyById.get(channelId)
      if (!foundChannel) {
        errors.push({ type: 'wrong_channel_id', ...channel })
        totalWarnings++
      }

      if (feedId) {
        const foundFeed = feedsKeyByStreamId.get(channel.xmltv_id)
        if (!foundFeed) {
          errors.push({ type: 'wrong_feed_id', ...channel })
          totalWarnings++
        }
      }
    })

    if (errors.length) {
      console.log(chalk.underline(filepath))
      console.table(errors, ['type', 'lang', 'xmltv_id', 'site_id', 'name'])
      console.log()
      totalFiles++
    }
  }

  const totalProblems = totalWarnings + totalErrors
  if (totalProblems > 0) {
    console.log(
      chalk.red(
        `${totalProblems} problems (${totalErrors} errors, ${totalWarnings} warnings) in ${totalFiles} file(s)`
      )
    )
    if (totalErrors > 0) {
      process.exit(1)
    }
  }
}

main()
