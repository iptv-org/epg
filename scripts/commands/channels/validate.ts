import { Storage, Collection, Dictionary, File, Logger } from '@freearhey/core'
import { ChannelsParser, ApiChannel } from '../../core'
import { program } from 'commander'
import chalk from 'chalk'
import langs from 'langs'
import { DATA_DIR } from '../../constants'
import { Channel } from 'epg-grabber'

program
  .option(
    '-c, --channels <path>',
    'Path to channels.xml file to validate',
    'sites/**/*.channels.xml'
  )
  .parse(process.argv)

const options = program.opts()

type ValidationError = {
  type: 'duplicate' | 'wrong_xmltv_id' | 'wrong_lang'
  name: string
  lang?: string
  xmltv_id?: string
  site_id?: string
  logo?: string
}

async function main() {
  const logger = new Logger()

  logger.info('options:')
  logger.tree(options)

  const parser = new ChannelsParser({ storage: new Storage() })

  const dataStorage = new Storage(DATA_DIR)
  const channelsContent = await dataStorage.json('channels.json')
  const channels = new Collection(channelsContent).map(data => new ApiChannel(data))

  let totalFiles = 0
  let totalErrors = 0
  const storage = new Storage()
  const files: string[] = await storage.list(options.channels)
  for (const filepath of files) {
    const file = new File(filepath)
    if (file.extension() !== 'xml') continue

    const parsedChannels = await parser.parse(filepath)

    const bufferById = new Dictionary()
    const bufferBySiteId = new Dictionary()
    const errors: ValidationError[] = []
    parsedChannels.forEach((channel: Channel) => {
      const bufferSiteId: string = `${channel.site_id}:${channel.lang}`
      if (bufferBySiteId.missing(bufferSiteId)) {
        bufferBySiteId.set(bufferSiteId, true)
      } else {
        errors.push({ type: 'duplicate', ...channel })
        totalErrors++
      }

      if (!langs.where('1', channel.lang)) {
        errors.push({ type: 'wrong_lang', ...channel })
        totalErrors++
      }

      if (!channel.xmltv_id) return

      const foundChannel = channels.first(
        (_channel: ApiChannel) => _channel.id === channel.xmltv_id
      )
      if (!foundChannel) {
        errors.push({ type: 'wrong_xmltv_id', ...channel })
        totalErrors++
      }

      // if (foundChannel && foundChannel.replacedBy) {
      //   errors.push({ type: 'replaced', ...channel })
      //   totalErrors++
      // }

      // if (foundChannel && foundChannel.closed && !foundChannel.replacedBy) {
      //   errors.push({ type: 'closed', ...channel })
      //   totalErrors++
      // }
    })

    if (errors.length) {
      console.log(chalk.underline(filepath))
      console.table(errors, ['type', 'lang', 'xmltv_id', 'site_id', 'name'])
      console.log()
      totalFiles++
    }
  }

  if (totalErrors > 0) {
    console.log(chalk.red(`${totalErrors} error(s) in ${totalFiles} file(s)`))
    process.exit(1)
  }
}

main()
