import { Collection, Dictionary } from '@freearhey/core'
import { Storage, File } from '@freearhey/storage-js'
import epgGrabber, { EPGGrabber } from 'epg-grabber'
import { loadData, data } from '../../api'
import { Channel } from '../../models'
import { program } from 'commander'
import chalk from 'chalk'
import langs from 'langs'

program.argument('[filepath...]', 'Path to *.channels.xml files to validate').parse(process.argv)

interface ValidationError {
  type: 'duplicate' | 'wrong_channel_id' | 'wrong_feed_id' | 'wrong_lang'
  name: string
  lang: string | null
  xmltv_id: string | null
  site_id: string | null
  logo: string | null
}

async function main() {
  await loadData()
  const { channelsKeyById, feedsKeyByStreamId } = data

  let totalFiles = 0
  let totalErrors = 0
  let totalWarnings = 0

  const storage = new Storage()
  const files = program.args.length ? program.args : await storage.list('sites/**/*.channels.xml')
  for (const filepath of files) {
    const file = new File(filepath)
    if (file.extension() !== 'xml') continue

    const xml = await storage.load(filepath)
    const parsedChannels = EPGGrabber.parseChannelsXML(xml)
    const channelList = new Collection(parsedChannels).map(
      (channel: epgGrabber.Channel) => new Channel(channel.toObject())
    )

    const bufferBySiteId = new Dictionary()
    const errors: ValidationError[] = []
    channelList.forEach((channel: Channel) => {
      const bufferId: string = channel.site_id
      if (bufferBySiteId.missing(bufferId)) {
        bufferBySiteId.set(bufferId, true)
      } else {
        errors.push({ type: 'duplicate', ...channel.toObject() })
        totalErrors++
      }

      if (!langs.where('1', channel.lang ?? '')) {
        errors.push({ type: 'wrong_lang', ...channel.toObject() })
        totalErrors++
      }

      if (!channel.xmltv_id) return
      const [channelId, feedId] = channel.xmltv_id.split('@')

      const foundChannel = channelsKeyById.get(channelId)
      if (!foundChannel) {
        errors.push({ type: 'wrong_channel_id', ...channel.toObject() })
        totalWarnings++
      }

      if (feedId) {
        const foundFeed = feedsKeyByStreamId.get(channel.xmltv_id)
        if (!foundFeed) {
          errors.push({ type: 'wrong_feed_id', ...channel.toObject() })
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
