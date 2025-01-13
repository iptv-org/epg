import { Storage, Collection, Dictionary, File } from '@freearhey/core'
import { ChannelsParser, ApiChannel } from '../../core'
import { program } from 'commander'
import chalk from 'chalk'
import langs from 'langs'
import { DATA_DIR } from '../../constants'
import { Channel } from 'epg-grabber'

program.argument('[filepath]', 'Path to *.channels.xml files to validate').parse(process.argv)

type ValidationError = {
  type: 'duplicate' | 'wrong_xmltv_id' | 'wrong_lang'
  name: string
  lang?: string
  xmltv_id?: string
  site_id?: string
  logo?: string
}

async function main() {
  const parser = new ChannelsParser({ storage: new Storage() })

  const dataStorage = new Storage(DATA_DIR)
  const channelsContent = await dataStorage.json('channels.json')
  const channels = new Collection(channelsContent).map(data => new ApiChannel(data))

  let totalFiles = 0
  let totalErrors = 0

  const storage = new Storage()
  const files = program.args.length ? program.args : await storage.list('sites/**/*.channels.xml')
  for (const filepath of files) {
    const file = new File(filepath)
    if (file.extension() !== 'xml') continue

    const parsedChannels = await parser.parse(filepath)

    const bufferBySiteId = new Dictionary()
    const errors: ValidationError[] = []
    parsedChannels.forEach((channel: Channel) => {
      const bufferId: string = channel.site_id
      if (bufferBySiteId.missing(bufferId)) {
        bufferBySiteId.set(bufferId, true)
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
