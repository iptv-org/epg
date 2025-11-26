import { Logger, Timer, Collection, Template } from '@freearhey/core'
import epgGrabber, { EPGGrabber, EPGGrabberMock } from 'epg-grabber'
import { loadJs, parseProxy, parseNumber } from '../../core'
import { CurlBody } from 'curl-generator/dist/bodies/body'
import { Channel, Guide, Program } from '../../models'
import { SocksProxyAgent } from 'socks-proxy-agent'
import defaultConfig from '../../default.config'
import { PromisyClass, TaskQueue } from 'cwait'
import { Storage } from '@freearhey/storage-js'
import { CurlGenerator } from 'curl-generator'
import { QueueItem } from '../../types/queue'
import { Option, program } from 'commander'
import { SITES_DIR } from '../../constants'
import { data, loadData } from '../../api'
import dayjs, { Dayjs } from 'dayjs'
import merge from 'lodash.merge'
import path from 'path'

program
  .addOption(new Option('-s, --site <name>', 'Name of the site to parse'))
  .addOption(
    new Option(
      '-c, --channels <path>',
      'Path to *.channels.xml file (required if the "--site" attribute is not specified)'
    )
  )
  .addOption(new Option('-o, --output <path>', 'Path to output file'))
  .addOption(new Option('-l, --lang <codes>', 'Filter channels by languages (ISO 639-1 codes)'))
  .addOption(
    new Option('-t, --timeout <milliseconds>', 'Override the default timeout for each request')
      .env('TIMEOUT')
      .argParser(parseNumber)
  )
  .addOption(
    new Option('-d, --delay <milliseconds>', 'Override the default delay between request')
      .env('DELAY')
      .argParser(parseNumber)
  )
  .addOption(new Option('-x, --proxy <url>', 'Use the specified proxy').env('PROXY'))
  .addOption(
    new Option(
      '--days <days>',
      'Override the number of days for which the program will be loaded (defaults to the value from the site config)'
    )
      .argParser(parseNumber)
      .env('DAYS')
  )
  .addOption(
    new Option('--maxConnections <number>', 'Limit on the number of concurrent requests')
      .argParser(parseNumber)
      .env('MAX_CONNECTIONS')
  )
  .addOption(new Option('--gzip', 'Create a compressed version of the guide as well').env('GZIP'))
  .addOption(new Option('--curl', 'Display each request as CURL').env('CURL'))
  .addOption(new Option('--debug', 'Enable debug mode').env('DEBUG'))
  .parse()

interface GrabOptions {
  site?: string
  channels?: string
  output?: string
  gzip?: boolean
  curl?: boolean
  debug?: boolean
  maxConnections?: number
  timeout?: number
  delay?: number
  lang?: string
  days?: number
  proxy?: string
}

const options: GrabOptions = program.opts()

async function main() {
  if (typeof options.site !== 'string' && typeof options.channels !== 'string')
    throw new Error('One of the arguments must be presented: `--site` or `--channels`')

  const LOG_LEVELS = { info: 3, debug: 4 }
  const logger = new Logger({ level: options.debug ? LOG_LEVELS['debug'] : LOG_LEVELS['info'] })

  logger.info('starting...')
  const globalConfig: epgGrabber.Types.SiteConfig = {}

  if (typeof options.timeout === 'number')
    merge(globalConfig, { request: { timeout: options.timeout } })
  if (options.proxy !== undefined) {
    const proxy = parseProxy(options.proxy)
    if (
      proxy.protocol &&
      ['socks', 'socks5', 'socks5h', 'socks4', 'socks4a'].includes(String(proxy.protocol))
    ) {
      const socksProxyAgent = new SocksProxyAgent(options.proxy)
      merge(globalConfig, {
        request: { httpAgent: socksProxyAgent, httpsAgent: socksProxyAgent }
      })
    } else {
      merge(globalConfig, { request: { proxy } })
    }
  }

  if (typeof options.output === 'string') globalConfig.output = options.output
  if (typeof options.days === 'number') globalConfig.days = options.days
  if (typeof options.delay === 'number') globalConfig.delay = options.delay
  if (typeof options.maxConnections === 'number')
    globalConfig.maxConnections = options.maxConnections
  if (typeof options.curl === 'boolean') globalConfig.curl = options.curl
  if (typeof options.gzip === 'boolean') globalConfig.gzip = options.gzip
  if (typeof options.debug === 'boolean') globalConfig.debug = options.debug

  logger.debug(`config: ${JSON.stringify(globalConfig, null, 2)}`)

  const grabber =
    process.env.NODE_ENV === 'test'
      ? new EPGGrabberMock(globalConfig)
      : new EPGGrabber(globalConfig)

  grabber.client.instance.interceptors.request.use(
    request => {
      logger.debug(`request: ${JSON.stringify(request, null, 2)}`)

      const curl = globalConfig.curl || defaultConfig.curl
      if (curl) {
        type AllowedMethods =
          | 'GET'
          | 'get'
          | 'POST'
          | 'post'
          | 'PUT'
          | 'put'
          | 'PATCH'
          | 'patch'
          | 'DELETE'
          | 'delete'

        const url = request.url || ''
        const method = request.method ? (request.method as AllowedMethods) : 'GET'
        const headers = request.headers
          ? (request.headers.toJSON() as Record<string, string>)
          : undefined
        const body = request.data ? (request.data as CurlBody) : undefined

        const curl = CurlGenerator({ url, method, headers, body })

        console.log(curl)
      }

      return request
    },
    error => Promise.reject(error)
  )

  logger.info('loading channels...')
  const storage = new Storage()

  let files: string[] = []
  if (typeof options.site === 'string') {
    let pattern = path.join(SITES_DIR, options.site, '*.channels.xml')
    pattern = pattern.replace(/\\/g, '/')
    files = await storage.list(pattern)
  } else if (typeof options.channels === 'string') {
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

  if (typeof options.lang === 'string') {
    channelsFromXML = channelsFromXML.filter((channel: Channel) => {
      if (!options.lang) return true

      return channel.lang ? options.lang.includes(channel.lang) : false
    })
  }

  logger.info(`found ${channelsFromXML.count()} channel(s)`)

  logger.info('loading api data...')
  await loadData()

  logger.info('creating queue...')
  const queue = new Collection<QueueItem>()

  let index = 0
  for (const channel of channelsFromXML.all()) {
    channel.index = index++
    if (!channel.site || !channel.site_id || !channel.name) continue

    const config = merge({}, defaultConfig, await loadJs(channel.getConfigPath()))

    if (!channel.xmltv_id) channel.xmltv_id = channel.site_id

    const days = globalConfig.days || config.days
    const currDate = dayjs.utc(process.env.CURR_DATE || new Date().toISOString())
    const dates = Array.from({ length: days }, (_, day) => currDate.add(day, 'd'))

    dates.forEach((date: Dayjs) => {
      queue.add({
        channel,
        date,
        config: { ...config },
        error: null
      })
    })
  }

  const maxConnections = globalConfig.maxConnections || defaultConfig.maxConnections

  const taskQueue = new TaskQueue(Promise as PromisyClass, maxConnections)

  const channels = new Collection<Channel>()
  const programs = new Collection<Program>()

  let i = 1
  const total = queue.count()

  const requests = queue.map(
    taskQueue.wrap(async (queueItem: QueueItem) => {
      const { channel, config, date } = queueItem

      if (!channel.logo) {
        if (config.logo) {
          channel.logo = await grabber.loadLogo(channel, date)
        } else {
          channel.logo = getLogoForChannel(channel)
        }
      }

      channels.add(channel)

      const channelPrograms = await grabber.grab(
        channel,
        date,
        config,
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

  const output = globalConfig.output || defaultConfig.output

  const pathTemplate = new Template(output)

  const channelsGroupedByKey = channels
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

  const gzip = globalConfig.gzip || defaultConfig.gzip

  for (const groupKey of channelsGroupedByKey.keys()) {
    const groupChannels = new Collection(channelsGroupedByKey.get(groupKey))
    const groupPrograms = new Collection(programsGroupedByKey.get(groupKey))
    const guide = new Guide({
      filepath: groupKey,
      gzip,
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
