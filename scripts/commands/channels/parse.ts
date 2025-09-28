import { Logger, File, Storage } from '@freearhey/core'
import { ChannelsParser } from '../../core'
import { ChannelList } from '../../models'
import { pathToFileURL } from 'node:url'
import epgGrabber from 'epg-grabber'
import { Command } from 'commander'

const program = new Command()
program
  .requiredOption('-c, --config <config>', 'Config file')
  .option('-s, --set [args...]', 'Set custom arguments')
  .option('-o, --output <output>', 'Output file')
  .parse(process.argv)

interface ParseOptions {
  config: string
  set?: string
  output?: string
  clean?: boolean
}

const options: ParseOptions = program.opts()

async function main() {
  function isPromise(promise: object[] | Promise<object[]>) {
    return (
      !!promise &&
      typeof promise === 'object' &&
      typeof (promise as Promise<object[]>).then === 'function'
    )
  }

  const storage = new Storage()
  const logger = new Logger()
  const parser = new ChannelsParser({ storage })
  const file = new File(options.config)
  const dir = file.dirname()
  const config = (await import(pathToFileURL(options.config).toString())).default
  const outputFilepath = options.output || `${dir}/${config.site}.channels.xml`

  let channelList = new ChannelList({ channels: [] })
  if (await storage.exists(outputFilepath)) {
    channelList = await parser.parse(outputFilepath)
  }

  const args: Record<string, string> = {}

  if (Array.isArray(options.set)) {
    options.set.forEach((arg: string) => {
      const [key, value] = arg.split(':')
      args[key] = value
    })
  }

  let parsedChannels: epgGrabber.Channel[] | Promise<epgGrabber.Channel[]> = []

  if (!config.channels || typeof config.channels !== 'function') {
    logger.error(`Config file '${options.config}' does not export a channels(...) function`)
    return
  }

  parsedChannels = config.channels(args)

  if (isPromise(parsedChannels)) {
    parsedChannels = await parsedChannels
  }

  parsedChannels = (parsedChannels as epgGrabber.Channel[]).map((channel: epgGrabber.Channel) => {
    channel.site = config.site
    return channel
  })

  const newChannelList = new ChannelList({ channels: [] })
  parsedChannels.forEach((channel: epgGrabber.Channel) => {
    if (!channel.site_id) return

    const found: epgGrabber.Channel | undefined = channelList.get(channel.site_id)

    if (found) {
      channel.xmltv_id = found.xmltv_id
      channel.lang = found.lang
    }

    newChannelList.add(channel)
  })

  newChannelList.sort()

  await storage.save(outputFilepath, newChannelList.toString())

  logger.info(`File '${outputFilepath}' successfully saved`)
}

main()
