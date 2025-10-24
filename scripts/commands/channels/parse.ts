import { Storage, File } from '@freearhey/storage-js'
import { Collection, Logger } from '@freearhey/core'
import epgGrabber, { EPGGrabber } from 'epg-grabber'
import { generateChannelsXML } from '../../core'
import { pathToFileURL } from 'node:url'
import { Channel } from '../../models'
import { Command } from 'commander'

interface SiteConfigChannelData {
  xmltv_id: string
  name: string
  site_id: string
  lang?: string
  logo?: string
  url?: string
  lcn?: string
}

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
  const file = new File(options.config)
  const dir = file.dirname()
  const config = (await import(pathToFileURL(options.config).toString())).default
  const outputFilepath = options.output || `${dir}/${config.site}.channels.xml`

  const args: Record<string, string> = {}

  if (Array.isArray(options.set)) {
    options.set.forEach((arg: string) => {
      const [key, value] = arg.split(':')
      args[key] = value
    })
  }

  let channelsFromXML = new Collection<Channel>()
  if (await storage.exists(outputFilepath)) {
    const xml = await storage.load(outputFilepath)
    const parsedChannels = EPGGrabber.parseChannelsXML(xml)
    channelsFromXML = new Collection(parsedChannels).map(
      (channel: epgGrabber.Channel) => new Channel(channel.toObject())
    )
  }

  let configChannels = config.channels(args)
  if (isPromise(configChannels)) {
    configChannels = await configChannels
  }

  const channelsFromConfig = new Collection<SiteConfigChannelData>(configChannels).map(
    (data: SiteConfigChannelData) => {
      return new Channel({
        xmltv_id: data.xmltv_id,
        name: data.name,
        site_id: data.site_id,
        lang: data.lang || null,
        logo: data.logo || null,
        url: data.url || null,
        lcn: data.lcn || null,
        site: config.site,
        index: -1
      })
    }
  )

  const newChannelList = new Collection<Channel>()
  channelsFromConfig.forEach((channel: Channel) => {
    if (!channel.site_id) return

    const found: Channel | undefined = channelsFromXML.find(
      (_channel: Channel) => _channel.site_id == channel.site_id
    )

    if (found) {
      channel.xmltv_id = found.xmltv_id
      channel.lang = found.lang
    }

    newChannelList.add(channel)
  })

  newChannelList.sortBy([
    (channel: Channel) => channel.lang || '_',
    (channel: Channel) => (channel.xmltv_id ? channel.xmltv_id.toLowerCase() : '0'),
    (channel: Channel) => channel.site_id
  ])

  const xml = generateChannelsXML(newChannelList)

  await storage.save(outputFilepath, xml)

  logger.info(`File '${outputFilepath}' successfully saved`)
}

main()
