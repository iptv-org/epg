const { db, logger, file, api } = require('../core')
const grabber = require('epg-grabber')
const _ = require('lodash')

const LOGS_DIR = process.env.LOGS_DIR || 'scripts/logs'
const PUBLIC_DIR = process.env.PUBLIC_DIR || '.gh-pages'
const GUIDES_PATH = `${LOGS_DIR}/guides.log`

async function main() {
  await setUp()
  await generateGuides()
}

main()

async function generateGuides() {
  logger.info(`Generating guides/...`)

  logger.info('Loading "database/programs.db"...')
  await db.programs.load()
  await api.channels.load()

  const grouped = groupByGroup(await loadQueue())
  for (const key in grouped) {
    const filepath = `${PUBLIC_DIR}/guides/${key}.epg.xml`
    const criticalErrors = []
    let channels = {}
    let programs = []
    for (const item of grouped[key]) {
      const itemPrograms = await loadProgramsForItem(item)
      programs = programs.concat(itemPrograms)

      if (channels[item.channel.xmltv_id]) continue

      if (item.error) {
        const error = {
          xmltv_id: item.channel.xmltv_id,
          site: item.channel.site,
          site_id: item.channel.site_id,
          lang: item.channel.lang,
          date: item.date,
          error: item.error
        }
        criticalErrors.push(error)
        await logError(key, error)
      } else {
        if (!itemPrograms.length) {
          await logError(key, {
            xmltv_id: item.channel.xmltv_id,
            site: item.channel.site,
            site_id: item.channel.site_id,
            lang: item.channel.lang,
            date: item.date,
            error: 'Programs not found'
          })
          continue
        }

        const channel = api.channels.find({ id: item.channel.xmltv_id })
        if (!channel) {
          await logError(key, {
            xmltv_id: item.channel.xmltv_id,
            site: item.channel.site,
            site_id: item.channel.site_id,
            lang: item.channel.lang,
            date: item.date,
            error: 'The channel has the wrong xmltv_id'
          })
          continue
        }

        channels[channel.id] = {
          xmltv_id: channel.id,
          name: channel.name,
          logo: channel.logo,
          site: item.channel.site
        }
      }
    }

    channels = Object.values(channels)
    channels = _.sortBy(channels, 'xmltv_id')
    programs = _.sortBy(programs, ['channel', 'start'])

    logger.info(`Creating "${filepath}"...`)
    const output = grabber.convertToXMLTV({ channels, programs })
    await file.create(filepath, output)

    let status = 0
    if (criticalErrors.length > 0 || !channels.length) {
      status = 1
    }

    await logGuide({
      group: key,
      count: channels.length,
      status
    })
  }

  logger.info(`Done`)
}

function groupByGroup(items = []) {
  const groups = {}

  items.forEach(item => {
    item.groups.forEach(key => {
      if (!groups[key]) {
        groups[key] = []
      }

      groups[key].push(item)
    })
  })

  return groups
}

async function loadQueue() {
  logger.info('Loading queue...')

  await db.queue.load()

  return await db.queue.find({}).sort({ xmltv_id: 1 })
}

async function loadProgramsForItem(item) {
  return await db.programs.find({ _qid: item._id }).sort({ channel: 1, start: 1 })
}

async function setUp() {
  logger.info(`Creating '${GUIDES_PATH}'...`)
  await file.create(GUIDES_PATH)
  await file.createDir(`${LOGS_DIR}/errors`)
}

async function logGuide(data) {
  await file.append(GUIDES_PATH, JSON.stringify(data) + '\r\n')
}

async function logError(key, data) {
  const filepath = `${LOGS_DIR}/errors/${key}.log`
  if (!(await file.exists(filepath))) {
    await file.create(filepath)
  }

  await file.append(filepath, JSON.stringify(data) + '\r\n')
}
