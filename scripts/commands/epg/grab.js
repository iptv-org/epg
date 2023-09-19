const { program } = require('commander')
const _ = require('lodash')
const { EPGGrabber, generateXMLTV, Channel, Program } = require('epg-grabber')
const { db, logger, date, timer, file, parser, api, zip } = require('../../core')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const CronJob = require('cron').CronJob

dayjs.extend(utc)

const BASE_DIR = process.env.BASE_DIR || '.'
const CURR_DATE = process.env.CURR_DATE || new Date()

program
  .requiredOption('-s, --site <name>', 'Name of the site to parse')
  .option('-l, --lang <code>', 'Filter channels by language (ISO 639-2 code)')
  .option('-o, --output <path>', 'Path to output file')
  .option('--days <days>', 'Override the number of days for which the program will be loaded')
  .option('--cron <expression>', 'Schedule a script run')
  .option('--gzip', 'Create a compressed version of the guide as well', false)
  .parse(process.argv)

const options = program.opts()

options.output = options.output || file.resolve(`${BASE_DIR}/guides/{lang}/{site}.xml`)
options.config = file.resolve(`${BASE_DIR}/sites/${options.site}/${options.site}.config.js`)
options.channels = file.resolve(`${BASE_DIR}/sites/${options.site}/${options.site}*.channels.xml`)

let channels = []
let programs = []
let runIndex = 0

async function main() {
  logger.start('staring...')

  logger.info('settings:')
  for (let prop in options) {
    logger.info(`  ${prop}: ${options[prop]}`)
  }

  const config = await loadConfig(options.config)
  const queue = await createQueue(options.channels, config)
  const outputPath = options.output

  if (options.cron) {
    const job = new CronJob(options.cron, function () {
      runJob(config, queue, outputPath)
    })
    job.start()
  } else {
    await runJob(config, queue, outputPath)
  }
}

async function loadConfig(configPath) {
  let config = require(file.resolve(configPath))
  config = _.merge(config, {})
  config.days = config.days || 1

  logger.info('config:')
  logConfig(config)

  return config
}

function logConfig(config, level = 1) {
  let padLeft = '  '.repeat(level)
  for (let prop in config) {
    if (typeof config[prop] === 'string' || typeof config[prop] === 'number') {
      logger.info(`${padLeft}${prop}: ${config[prop]}`)
    } else if (typeof config[prop] === 'object') {
      level++
      logger.info(`${padLeft}${prop}:`)
      logConfig(config[prop], level)
    }
  }
}

async function runJob(config, queue, outputPath) {
  runIndex++
  logger.info(`run #${runIndex}:`)

  timer.start()

  await grab(queue, config)

  await save(outputPath, channels, programs)

  logger.success(`  done in ${timer.format('HH[h] mm[m] ss[s]')}`)
}

async function grab(queue, config) {
  const grabber = new EPGGrabber(config)
  const total = queue.length

  let i = 1
  for (const item of queue) {
    let channel = item.channel
    let date = item.date
    channels.push(item.channel)
    await grabber
      .grab(channel, date, (data, err) => {
        logger.info(
          `  [${i}/${total}] ${channel.site} (${channel.lang}) - ${channel.xmltv_id} - ${dayjs
            .utc(data.date)
            .format('MMM D, YYYY')} (${data.programs.length} programs)`
        )
        if (i < total) i++

        if (err) {
          logger.info(`    ERR: ${err.message}`)
        }
      })
      .then(results => {
        programs = programs.concat(results)
      })
  }
}

async function createQueue(channelsPath, config) {
  logger.info('creating queue...')
  let queue = {}
  await api.channels.load().catch(logger.error)
  const files = await file.list(channelsPath).catch(logger.error)
  const utcDate = date.getUTC(CURR_DATE)
  const days = options.days ? parseInt(options.days) : config.days
  for (const filepath of files) {
    logger.info(`  loading "${filepath}"...`)
    try {
      const dir = file.dirname(filepath)
      const { channels } = await parser.parseChannels(filepath)
      const filename = file.basename(filepath)
      const dates = Array.from({ length: days }, (_, i) => utcDate.add(i, 'd'))
      for (const channel of channels) {
        if (!channel.site || !channel.xmltv_id) continue
        if (options.lang && channel.lang !== options.lang) continue
        const found = api.channels.find({ id: channel.xmltv_id })
        if (found) {
          channel.logo = found.logo
        }
        for (const d of dates) {
          const dateString = d.toJSON()
          const key = `${channel.site}:${channel.lang}:${channel.xmltv_id}:${dateString}`
          if (!queue[key]) {
            queue[key] = {
              channel,
              date: dateString,
              config,
              error: null
            }
          }
        }
      }
    } catch (err) {
      logger.error(err)
      continue
    }
  }

  queue = Object.values(queue)

  logger.info(`  added ${queue.length} items`)

  return queue
}

async function save(template, parsedChannels, programs = []) {
  const variables = file.templateVariables(template)

  const groups = _.groupBy(parsedChannels, channel => {
    let groupId = ''
    for (let key in channel) {
      if (variables.includes(key)) {
        groupId += channel[key]
      }
    }

    return groupId
  })

  for (let groupId in groups) {
    const channels = groups[groupId]

    let output = {
      channels,
      programs: [],
      date: CURR_DATE
    }

    for (let program of programs) {
      let programLang = program.titles[0].lang
      let channel = channels.find(c => c.xmltv_id === program.channel && c.lang === programLang)
      if (!channel) continue

      output.programs.push(new Program(program, channel))
    }

    output.channels = _.sortBy(output.channels, 'xmltv_id')
    output.channels = _.uniqBy(output.channels, 'xmltv_id')

    output.programs = _.sortBy(output.programs, ['channel', 'start'])
    output.programs = _.uniqBy(output.programs, p => p.channel + p.start)

    const outputPath = file.templateFormat(template, output.channels[0])
    const xmlFilepath = outputPath
    const xmltv = generateXMLTV(output)
    logger.info(`  saving to "${xmlFilepath}"...`)
    await file.create(xmlFilepath, xmltv)

    if (options.gzip) {
      const gzFilepath = `${outputPath}.gz`
      const compressed = await zip.compress(xmltv)
      logger.info(`  saving to "${gzFilepath}"...`)
      await file.create(gzFilepath, compressed)
    }
  }
}

main()
