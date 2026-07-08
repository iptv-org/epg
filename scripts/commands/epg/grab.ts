import {
  loadJs,
  parseProxy,
  parseNumber,
  parseList,
  parseBooleanOrString,
  parseBoolean
} from '../../core'
import { Logger, Timer, Collection, Template } from '@freearhey/core'
import epgGrabber, { EPGGrabber, EPGGrabberMock } from 'epg-grabber'
import { CurlBody } from 'curl-generator/dist/bodies/body'
import { Channel, Guide, Program } from '../../models'
import { SocksProxyAgent } from 'socks-proxy-agent'
import defaultConfig from '../../default.config'
import pLimit from 'p-limit'
import { Storage } from '@freearhey/storage-js'
import { CurlGenerator } from 'curl-generator'
import { QueueItem } from '../../types/queue'
import { Option, program } from 'commander'
import { ROOT_DIR, SITES_DIR } from '../../constants'
import { data, loadData } from '../../api'
import dayjs, { Dayjs } from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import merge from 'lodash.merge'
import fs from 'fs'
import path from 'path'

dayjs.extend(utc)
dayjs.extend(timezone)

program
  .addOption(
    new Option('-s, --sites <names>', 'A comma-separated list of the sites to parse').argParser(
      parseList
    )
  )
  .addOption(
    new Option(
      '-c, --channels <path>',
      'Path to *.channels.xml file (required if the "--sites" attribute is not specified)'
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
  .addOption(
    new Option('--fill-gaps', 'Fill schedule gaps with a dummy program')
      .argParser(parseBoolean)
      .env('FILL_GAPS')
  )
  .addOption(
    new Option('--gzip [path]', 'Create a compressed version of the guide as well')
      .argParser(parseBooleanOrString)
      .env('GZIP')
  )
  .addOption(
    new Option('--json [path]', 'Create a JSON version of the guide as well')
      .argParser(parseBooleanOrString)
      .env('JSON')
  )
  .addOption(
    new Option('--curl', 'Display each request as CURL').argParser(parseBoolean).env('CURL')
  )
  .addOption(new Option('--debug', 'Enable debug mode').argParser(parseBoolean).env('DEBUG'))
  .parse()

interface GrabOptions {
  sites?: string[]
  channels?: string
  output?: string
  gzip?: boolean | string
  json?: boolean | string
  curl?: boolean
  debug?: boolean
  maxConnections?: number
  timeout?: number
  delay?: number
  lang?: string
  days?: number
  proxy?: string
  fillGaps?: boolean
}

const options: GrabOptions = program.opts()
const DEFAULT_LANG = 'en'
const DEFAULT_GAP_TITLE = 'Off Air'
const DEFAULT_TIMEZONE = 'UTC'
const GAP_DURATION_HOURS = 4
const HOUR_MS = 60 * 60 * 1000
const MAX_GAP_DURATION_MS = GAP_DURATION_HOURS * HOUR_MS
const GAP_TITLES_PATH = path.resolve(ROOT_DIR, 'scripts/data/gap_titles.json')

interface ChannelDayInfo {
  channelId: string
  site: string
  lang: string
  timezone: string
  rangeStart: number
  rangeEnd: number
}

interface ChannelDayState {
  hasSuccess: boolean
  hasFailure: boolean
}

async function main() {
  if (!Array.isArray(options.sites) && typeof options.channels !== 'string')
    throw new Error('One of the arguments must be presented: `--sites` or `--channels`')

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
  if (typeof options.fillGaps === 'boolean') globalConfig.fillGaps = options.fillGaps
  if (typeof options.gzip === 'boolean' || typeof options.gzip === 'string')
    globalConfig.gzip = options.gzip
  if (typeof options.json === 'boolean' || typeof options.json === 'string')
    globalConfig.json = options.json
  if (typeof options.debug === 'boolean') globalConfig.debug = options.debug

  logger.debug(`config: ${JSON.stringify(globalConfig, getCircularReplacer(), 2)}`)

  const grabber =
    process.env.NODE_ENV === 'test'
      ? new EPGGrabberMock(globalConfig)
      : new EPGGrabber(globalConfig)

  grabber.client.instance.interceptors.request.use(
    request => {
      logger.debug(`request: ${JSON.stringify(request, getCircularReplacer(), 2)}`)

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
  if (Array.isArray(options.sites)) {
    for (const site of options.sites) {
      let pattern = path.join(SITES_DIR, site, '*.channels.xml')
      pattern = pattern.replace(/\\/g, '/')
      const foundFiles = await storage.list(pattern)
      foundFiles.forEach((filepath: string) => {
        files.push(filepath)
      })
    }
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
  const channelDayInfoByKey = new Map<string, ChannelDayInfo>()
  const channelDayStateByKey = new Map<string, ChannelDayState>()

  let index = 0
  for (const channel of channelsFromXML.all()) {
    channel.index = index++
    if (!channel.site || !channel.site_id || !channel.name) continue
    const site = channel.site

    const config = merge({}, defaultConfig, await loadJs(channel.getConfigPath()))

    if (!channel.xmltv_id) channel.xmltv_id = channel.site_id

    const days = globalConfig.days || config.days
    const currDate = dayjs.utc(process.env.CURR_DATE || new Date().toISOString())
    const dates = Array.from({ length: days }, (_, day) => currDate.add(day, 'd'))
    const lang = channel.lang || DEFAULT_LANG
    const timezone = resolveChannelTimezone(channel)

    dates.forEach((date: Dayjs) => {
      const { rangeStart, rangeEnd } = getChannelDayRange(date, timezone)
      const dayKey = buildDayKey(channel.xmltv_id, site, lang, rangeStart)

      channelDayInfoByKey.set(dayKey, {
        channelId: channel.xmltv_id,
        site,
        lang,
        timezone,
        rangeStart,
        rangeEnd
      })
      if (!channelDayStateByKey.has(dayKey)) {
        channelDayStateByKey.set(dayKey, {
          hasSuccess: false,
          hasFailure: false
        })
      }

      queue.add({
        channel,
        date,
        dayKey,
        config: { ...config },
        error: null
      })
    })
  }

  const maxConnections = globalConfig.maxConnections || defaultConfig.maxConnections
  const limit = pLimit(maxConnections)

  const channels = new Collection<Channel>()
  const programs = new Collection<Program>()

  let i = 1
  const total = queue.count()

  logger.info('run:')
  const timer = new Timer()
  timer.start()

  const requests = queue.all().map((queueItem: QueueItem) =>
    limit(async () => {
      const { channel, config, date, dayKey } = queueItem
      const dayState = channelDayStateByKey.get(dayKey)
      const originalUrl = channel.url

      if (!channel.logo) {
        if (config.logo) {
          channel.logo = await grabber.loadLogo(channel, date)
        } else {
          channel.logo = getLogoForChannel(channel)
        }
      }

      channels.add(channel)

      let hasError = false

      try {
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
              hasError = true
              logger.info(`    ERR: ${error.message}`)
            }
          }
        )

        const _programs = new Collection<epgGrabber.Program>(channelPrograms).map<Program>(
          program => new Program(program.toObject())
        )

        programs.concat(_programs)

        if (dayState) {
          if (hasError) {
            dayState.hasFailure = true
          } else {
            dayState.hasSuccess = true
          }
        }
      } catch (error) {
        const currentIndex = i
        if (i < total) i++
        logger.info(
          `  [${currentIndex}/${total}] ${channel.site} (${channel.lang}) - ${channel.xmltv_id} - ${date.format(
            'MMM D, YYYY'
          )} (0 programs)`
        )
        logger.info(`    ERR: ${(error as Error).message}`)
        if (dayState) dayState.hasFailure = true
      } finally {
        channel.url = originalUrl
      }
    })
  )

  await Promise.all(requests)

  const fillGaps =
    options.fillGaps === undefined ? Boolean(defaultConfig.fillGaps) : parseBoolean(options.fillGaps)
  if (fillGaps) {
    fillProgramGaps({
      programs,
      channelDayInfoByKey,
      channelDayStateByKey,
      gapTitlesByLang: loadGapTitles()
    })
  }

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
  const json = globalConfig.json || defaultConfig.json

  for (const groupKey of channelsGroupedByKey.keys()) {
    const groupChannels = new Collection(channelsGroupedByKey.get(groupKey))
    const groupPrograms = new Collection(programsGroupedByKey.get(groupKey))
    const guide = new Guide({
      filepath: groupKey,
      gzip,
      json,
      channels: groupChannels,
      programs: groupPrograms
    })

    await guide.save({ logger })
  }

  logger.success(`  done in ${timer.format('HH[h] mm[m] ss[s]')}`)
}

main()

function fillProgramGaps({
  programs,
  channelDayInfoByKey,
  channelDayStateByKey,
  gapTitlesByLang
}: {
  programs: Collection<Program>
  channelDayInfoByKey: Map<string, ChannelDayInfo>
  channelDayStateByKey: Map<string, ChannelDayState>
  gapTitlesByLang: Record<string, string>
}) {
  const programsByChannelKey = new Map<string, Program[]>()

  for (const program of programs.all()) {
    if (typeof program.start !== 'number' || typeof program.stop !== 'number') continue

    const lang = resolveProgramLang(program)
    const channelKey = buildChannelKey(program.channel, program.site, lang)
    const groupPrograms = programsByChannelKey.get(channelKey) || []
    groupPrograms.push(program)
    programsByChannelKey.set(channelKey, groupPrograms)
  }

  const gapPrograms: Program[] = []

  for (const [dayKey, dayInfo] of channelDayInfoByKey) {
    const dayState = channelDayStateByKey.get(dayKey)
    if (!dayState || dayState.hasFailure || !dayState.hasSuccess) continue

    const channelKey = buildChannelKey(dayInfo.channelId, dayInfo.site, dayInfo.lang)
    const groupPrograms = (programsByChannelKey.get(channelKey) || [])
      .filter(program => isProgramInRange(program, dayInfo.rangeStart, dayInfo.rangeEnd))
      .sort((a, b) => a.start - b.start || a.stop - b.stop)

    const gapTitle = getGapTitle(dayInfo.lang, gapTitlesByLang)
    let cursor = dayInfo.rangeStart

    for (const program of groupPrograms) {
      if (program.stop <= dayInfo.rangeStart) {
        cursor = Math.max(cursor, program.stop)
        continue
      }
      if (program.start >= dayInfo.rangeEnd) break

      const programStart = Math.max(program.start, dayInfo.rangeStart)
      const programStop = Math.min(program.stop, dayInfo.rangeEnd)

      if (programStart > cursor) {
        appendGapPrograms({
          gapPrograms,
          site: dayInfo.site,
          channelId: dayInfo.channelId,
          lang: dayInfo.lang,
          timezone: dayInfo.timezone,
          title: gapTitle,
          start: cursor,
          stop: programStart
        })
      }

      cursor = Math.max(cursor, programStop)
    }

    if (cursor < dayInfo.rangeEnd) {
      appendGapPrograms({
        gapPrograms,
        site: dayInfo.site,
        channelId: dayInfo.channelId,
        lang: dayInfo.lang,
        timezone: dayInfo.timezone,
        title: gapTitle,
        start: cursor,
        stop: dayInfo.rangeEnd
      })
    }
  }

  programs.concat(new Collection(gapPrograms))
}

function appendGapPrograms({
  gapPrograms,
  site,
  channelId,
  lang,
  timezone,
  title,
  start,
  stop
}: {
  gapPrograms: Program[]
  site: string
  channelId: string
  lang: string
  timezone: string
  title: string
  start: number
  stop: number
}) {
  let cursor = start

  while (cursor < stop) {
    const nextBoundary = getNextGapBoundary(cursor, timezone)
    const alignedStop = nextBoundary > cursor ? nextBoundary : cursor + MAX_GAP_DURATION_MS
    const chunkStop = Math.min(alignedStop, stop)
    gapPrograms.push(
      new Program({
        site,
        channel: channelId,
        start: cursor,
        stop: chunkStop,
        titles: [{ value: title, lang }]
      } as epgGrabber.Program)
    )
    cursor = chunkStop
  }
}

function isValidProgramRange(program: Program): boolean {
  return (
    typeof program.start === 'number' &&
    typeof program.stop === 'number' &&
    Number.isFinite(program.start) &&
    Number.isFinite(program.stop) &&
    program.stop > program.start
  )
}

function isProgramInRange(program: Program, rangeStart: number, rangeEnd: number): boolean {
  return isValidProgramRange(program) && program.stop > rangeStart && program.start < rangeEnd
}

function buildChannelKey(channelId: string, site: string, lang: string): string {
  return `${channelId}:${site}:${lang}`
}

function buildDayKey(channelId: string, site: string, lang: string, rangeStart: number): string {
  return `${channelId}:${site}:${lang}:${rangeStart}`
}

function getChannelDayRange(
  date: Dayjs,
  timezone: string
): {
  rangeStart: number
  rangeEnd: number
} {
  return {
    rangeStart: dayjs.tz(date.format('YYYY-MM-DD'), timezone).valueOf(),
    rangeEnd: dayjs.tz(date.add(1, 'd').format('YYYY-MM-DD'), timezone).valueOf()
  }
}

function getNextGapBoundary(cursor: number, timezone: string): number {
  const localCursor = dayjs(cursor).tz(timezone)
  const localHours =
    localCursor.hour() +
    localCursor.minute() / 60 +
    localCursor.second() / (60 * 60) +
    localCursor.millisecond() / HOUR_MS
  let boundaryHour = Math.ceil(localHours / GAP_DURATION_HOURS) * GAP_DURATION_HOURS

  if (boundaryHour === localHours) boundaryHour += GAP_DURATION_HOURS

  const boundaryDate =
    boundaryHour >= 24
      ? localCursor.add(1, 'd').format('YYYY-MM-DD')
      : localCursor.format('YYYY-MM-DD')
  const boundaryHourOfDay = String(boundaryHour % 24).padStart(2, '0')

  return dayjs.tz(`${boundaryDate}T${boundaryHourOfDay}:00:00`, timezone).valueOf()
}

function resolveProgramLang(program: Program): string {
  const firstTitle = Array.isArray(program.titles) ? program.titles[0] : null
  return firstTitle && firstTitle.lang ? firstTitle.lang : DEFAULT_LANG
}

function resolveChannelTimezone(channel: Channel): string {
  const [channelId] = channel.xmltv_id.split('@')
  const feedTimezone = getFirstTimezoneId(data.feedsKeyByStreamId.get(channel.xmltv_id)?.getTimezones())
  if (feedTimezone) return feedTimezone

  const mainFeedTimezone = getFirstTimezoneId(getMainFeed(channelId)?.getTimezones())
  if (mainFeedTimezone) return mainFeedTimezone

  const channelData = data.channelsKeyById.get(channelId)
  const channelTimezone = getFirstTimezoneId(channelData?.getTimezones())
  if (channelTimezone) return channelTimezone

  const countryCode = channelData?.country || getCountryCodeFromChannelId(channelId)
  const countryTimezones = countryCode
    ? data.timezonesGroupedByCountryCode.get(countryCode.toUpperCase())
    : null

  return countryTimezones && countryTimezones.length ? countryTimezones[0].id : DEFAULT_TIMEZONE
}

function getMainFeed(channelId: string) {
  const feeds = data.feedsGroupedByChannelId.get(channelId) || []

  return feeds.find(feed => feed.is_main)
}

function getFirstTimezoneId(timezones?: Collection<{ id: string }>): string | null {
  const timezone = timezones ? timezones.first() : null
  return timezone ? timezone.id : null
}

function getCountryCodeFromChannelId(channelId: string): string | null {
  const countryCode = channelId.split('.').pop()

  return countryCode && /^[a-z]{2}$/i.test(countryCode) ? countryCode.toUpperCase() : null
}

function loadGapTitles(): Record<string, string> {
  try {
    return JSON.parse(fs.readFileSync(GAP_TITLES_PATH, 'utf8'))
  } catch {
    return {}
  }
}

function getGapTitle(lang: string, gapTitlesByLang: Record<string, string>): string {
  return gapTitlesByLang[lang] || gapTitlesByLang[DEFAULT_LANG] || DEFAULT_GAP_TITLE
}

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

function getCircularReplacer() {
  const seen = new WeakSet<object>()
  return (key: string, value: unknown) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]'
      }
      seen.add(value)
    }
    return value
  }
}
