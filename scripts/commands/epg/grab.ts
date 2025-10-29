import { Logger, Timer, Collection, Template } from '@freearhey/core'
import epgGrabber, { EPGGrabber, EPGGrabberMock } from 'epg-grabber'
import { loadJs, parseProxy, SiteConfig, Queue } from '../../core'
import { Channel, Guide, Program } from '../../models'
import { SocksProxyAgent } from 'socks-proxy-agent'
import { PromisyClass, TaskQueue } from 'cwait'
import { Storage } from '@freearhey/storage-js'
import { QueueItem } from '../../types/queue'
import { Option, program } from 'commander'
import { SITES_DIR } from '../../constants'
import { data, loadData } from '../../api'
import dayjs, { Dayjs } from 'dayjs'
import path from 'path'

const numArg = (value: string) => parseInt(value)

program
  .addOption(new Option('-s, --site <name>', 'Name of the site to parse'))
  .addOption(
    new Option(
      '-c, --channels <path>',
      'Path to *.channels.xml file (required if the "--site" attribute is not specified)'
    )
  )
  .addOption(new Option('-o, --output <path>', 'Path to output file').default('guide.xml'))
  .addOption(new Option('-l, --lang <codes>', 'Filter channels by languages (ISO 639-1 codes)'))
  .addOption(
    new Option('-t, --timeout <milliseconds>', 'Override the default timeout for each request')
      .env('TIMEOUT')
      .argParser(numArg)
  )
  .addOption(
    new Option('-d, --delay <milliseconds>', 'Override the default delay between request')
      .env('DELAY')
      .argParser(numArg)
  )
  .addOption(new Option('-x, --proxy <url>', 'Use the specified proxy').env('PROXY'))
  .addOption(
    new Option(
      '--days <days>',
      'Override the number of days for which the program will be loaded (defaults to the value from the site config)'
    )
      .argParser(numArg)
      .env('DAYS')
  )
  .addOption(
    new Option('--maxConnections <number>', 'Limit on the number of concurrent requests')
      .default(1)
      .argParser(numArg)
      .env('MAX_CONNECTIONS')
  )
  .addOption(
    new Option('--gzip', 'Create a compressed version of the guide as well')
      .default(false)
      .env('GZIP')
  )
  .addOption(new Option('--curl', 'Display each request as CURL').default(false).env('CURL'))
  .parse()

interface GrabOptions {
  site?: string
  channels?: string
  output: string
  gzip: boolean
  curl: boolean
  maxConnections: number
  timeout?: number
  delay?: number
  lang?: string
  days?: number
  proxy?: string
}

const options: GrabOptions = program.opts()

async function main() {
  if (!options.site && !options.channels)
    throw new Error('One of the arguments must be presented: `--site` or `--channels`')

  const logger = new Logger()

  logger.info('starting...')

  logger.info('config:')
  logger.tree(options)

  logger.info('loading channels...')
  const storage = new Storage()

  let files: string[] = []
  if (options.site) {
    let pattern = path.join(SITES_DIR, options.site, '*.channels.xml')
    pattern = pattern.replace(/\\/g, '/')
    files = await storage.list(pattern)
  } else if (options.channels) {
    files = await storage.list(options.channels)
  }

  let channelsFromXML = new Collection<Channel>()
  for (const filepath of files) {
    const xml = await storage.load(filepath)
    const parsedChannels = EPGGrabber.parseChannelsXML(xml)
    const _channelsFromXML = new Collection(parsedChannels).map(
      (channel: epgGrabber.Channel) => new Channel(channel.toObject())
    )

    channelsFromXML.concat(_channelsFromXML)
  }

  if (options.lang) {
    channelsFromXML = channelsFromXML.filter((channel: Channel) => {
      if (!options.lang) return true

      return channel.lang ? options.lang.includes(channel.lang) : false
    })
  }

  logger.info(`found ${channelsFromXML.count()} channel(s)`)

  logger.info('loading api data...')
  await loadData()

  logger.info('creating queue...')

  let index = 0
  const queue = new Queue()

  for (const channel of channelsFromXML.all()) {
    channel.index = index++
    if (!channel.site || !channel.site_id || !channel.name) continue

    const configObject = await loadJs(channel.getConfigPath())

    const siteConfig = new SiteConfig(configObject)

    siteConfig.filepath = channel.getConfigPath()

    if (options.timeout !== undefined) {
      siteConfig.request = { ...siteConfig.request, ...{ timeout: options.timeout } }
    }
    if (options.delay !== undefined) siteConfig.delay = options.delay
    if (options.curl !== undefined) siteConfig.curl = options.curl
    if (options.proxy !== undefined) {
      const proxy = parseProxy(options.proxy)

      if (
        proxy.protocol &&
        ['socks', 'socks5', 'socks5h', 'socks4', 'socks4a'].includes(String(proxy.protocol))
      ) {
        const socksProxyAgent = new SocksProxyAgent(options.proxy)

        siteConfig.request = {
          ...siteConfig.request,
          ...{ httpAgent: socksProxyAgent, httpsAgent: socksProxyAgent }
        }
      } else {
        siteConfig.request = { ...siteConfig.request, ...{ proxy } }
      }
    }

    if (!channel.xmltv_id) channel.xmltv_id = channel.site_id

    const days = options.days || siteConfig.days || 1
    const currDate = dayjs.utc(process.env.CURR_DATE || new Date().toISOString())
    const dates = Array.from({ length: days }, (_, day) => currDate.add(day, 'd'))

    dates.forEach((date: Dayjs) => {
      const key = `${channel.site}:${channel.lang}:${channel.xmltv_id}:${date.toJSON()}`
      if (queue.has(key)) return
      queue.add(key, {
        channel,
        date,
        siteConfig,
        error: null
      })
    })
  }

  const grabber = process.env.NODE_ENV === 'test' ? new EPGGrabberMock() : new EPGGrabber()

  const taskQueue = new TaskQueue(Promise as PromisyClass, options.maxConnections)

  const queueItems = queue.getItems()

  const channels = new Collection<Channel>()
  const programs = new Collection<Program>()

  let i = 1
  const total = queueItems.count()

  const requests = queueItems.map(
    taskQueue.wrap(async (queueItem: QueueItem) => {
      const { channel, siteConfig, date } = queueItem

      if (!channel.logo) {
        if (siteConfig.logo) {
          channel.logo = await grabber.loadLogo(channel, date)
        } else {
          channel.logo = getLogoForChannel(channel)
        }
      }

      channels.add(channel)

      const channelPrograms = await grabber.grab(
        channel,
        date,
        siteConfig,
        (context: epgGrabber.Types.GrabCallbackContext, error: Error | null) => {
          logger.info(
            `  [${i}/${total}] ${context.channel.site} (${context.channel.lang}) - ${
              context.channel.xmltv_id
            } - ${context.date.format('MMM D, YYYY')} (${context.programs.length} programs)`
          )
          if (i < total) i++

          if (error) {
            logger.info(`    ERR: ${error.message}`)
          }
        }
      )

      const _programs = new Collection<epgGrabber.Program>(channelPrograms).map<Program>(
        program => new Program(program.toObject())
      )

      programs.concat(_programs)
    })
  )

  logger.info('run:')

  const timer = new Timer()
  timer.start()

  await Promise.all(requests.all())

  const pathTemplate = new Template(options.output)

  const channelsGroupedByKey = channels
    .sortBy([(channel: Channel) => channel.index, (channel: Channel) => channel.xmltv_id])
    .uniqBy((channel: Channel) => `${channel.xmltv_id}:${channel.site}:${channel.lang}`)
    .groupBy((channel: Channel) => {
      return pathTemplate.format({ lang: channel.lang || 'en', site: channel.site || '' })
    })

  const programsGroupedByKey = programs
    .sortBy([(program: Program) => program.channel, (program: Program) => program.start])
    .groupBy((program: Program) => {
      const lang =
        program.titles && program.titles.length && program.titles[0].lang
          ? program.titles[0].lang
          : 'en'

      return pathTemplate.format({ lang, site: program.site || '' })
    })

  for (const groupKey of channelsGroupedByKey.keys()) {
    const groupChannels = new Collection(channelsGroupedByKey.get(groupKey))
    const groupPrograms = new Collection(programsGroupedByKey.get(groupKey))
    const guide = new Guide({
      filepath: groupKey,
      gzip: options.gzip,
      channels: groupChannels,
      programs: groupPrograms
    })

    await guide.save({ logger })
  }

  logger.success(`  done in ${timer.format('HH[h] mm[m] ss[s]')}`)
}

main()

function getLogoForChannel(channel: Channel): string | null {
  const feedData = data.feedsKeyByStreamId.get(channel.xmltv_id)
  if (feedData) {
    const firstLogo = feedData.getLogos().first()
    if (firstLogo) return firstLogo.url
  }

  const [channelId] = channel.xmltv_id.split('@')
  const channelData = data.channelsKeyById.get(channelId)
  if (channelData) {
    const firstLogo = channelData.getLogos().first()
    if (firstLogo) return firstLogo.url
  }

  return null
}
