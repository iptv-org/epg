import { Logger, File, Collection, Storage } from '@freearhey/core'
import { ChannelsParser, XML } from '../../core'
import { Channel } from 'epg-grabber'
import { Command } from 'commander'
import path from 'path'

const program = new Command()
program
  .requiredOption('-c, --config <config>', 'Config file')
  .option('-s, --set [args...]', 'Set custom arguments')
  .option('-o, --output <output>', 'Output file')
  .parse(process.argv)

type ParseOptions = {
  config: string
  set?: string
  output?: string
  clean?: boolean
}

const options: ParseOptions = program.opts()

async function main() {
  const storage = new Storage()
  const parser = new ChannelsParser({ storage })
  const logger = new Logger()
  const file = new File(options.config)
  const dir = file.dirname()
  const config = require(path.resolve(options.config))
  const outputFilepath = options.output || `${dir}/${config.site}.channels.xml`

  let channels = new Collection()
  if (await storage.exists(outputFilepath)) {
    channels = await parser.parse(outputFilepath)
  }

  const args: {
    [key: string]: string
  } = {}

  if (Array.isArray(options.set)) {
    options.set.forEach((arg: string) => {
      const [key, value] = arg.split(':')
      args[key] = value
    })
  }

  let parsedChannels = config.channels(args)
  if (isPromise(parsedChannels)) {
    parsedChannels = await parsedChannels
  }
  parsedChannels = parsedChannels.map((channel: Channel) => {
    channel.site = config.site

    return channel
  })

  let output = new Collection()
  parsedChannels.forEach((channel: Channel) => {
    const found: Channel | undefined = channels.first(
      (_channel: Channel) => _channel.site_id === channel.site_id
    )

    if (found) {
      channel.name = found.name
      channel.xmltv_id = found.xmltv_id
    }

    output.add(channel)
  })

  output = output.orderBy([
    (channel: Channel) => channel.lang,
    (channel: Channel) => (channel.xmltv_id ? channel.xmltv_id.toLowerCase() : '_'),
    (channel: Channel) => channel.site_id
  ])

  const xml = new XML(output)

  await storage.save(outputFilepath, xml.toString())

  logger.info(`File '${outputFilepath}' successfully saved`)
}

main()

function isPromise(promise: object[] | Promise<object[]>) {
  return (
    !!promise &&
    typeof promise === 'object' &&
    typeof (promise as Promise<object[]>).then === 'function'
  )
}
