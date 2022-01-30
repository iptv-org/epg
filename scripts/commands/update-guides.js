const { db, logger, file, api } = require('../core')
const grabber = require('epg-grabber')
const _ = require('lodash')

const LOGS_DIR = process.env.LOGS_DIR || 'scripts/logs'
const PUBLIC_DIR = process.env.PUBLIC_DIR || '.gh-pages'
const LOG_PATH = `${LOGS_DIR}/update-guides.log`

async function main() {
  await setUp()
  await generateGuides()
}

main()

async function generateGuides() {
  logger.info(`Generating guides/...`)

  const grouped = groupByGroup(await loadQueue())

  logger.info('Loading "database/programs.db"...')
  await db.programs.load()
  await api.channels.load()

  for (const key in grouped) {
    const filepath = `${PUBLIC_DIR}/guides/${key}.epg.xml`
    const items = grouped[key]
    const channels = items
      .map(i => {
        const channel = api.channels.find({ id: i.xmltv_id })
        i.name = channel.name
        i.logo = channel.logo
        return i
      })
      .filter(i => i)

    const programs = await loadProgramsForChannels(channels)
    const output = grabber.convertToXMLTV({ channels, programs })

    logger.info(`Creating "${filepath}"...`)
    await file.create(filepath, output)

    await log({
      group: key,
      count: channels.length
    })
  }

  logger.info(`Done`)
}

function groupByGroup(channels = []) {
  const groups = {}

  channels.forEach(channel => {
    channel.groups.forEach(key => {
      if (!groups[key]) {
        groups[key] = []
      }

      groups[key].push(channel)
    })
  })

  return groups
}

async function loadQueue() {
  logger.info('Loading queue...')

  await db.queue.load()

  return await db.queue.find({ programCount: { $gt: 0 } }).sort({ xmltv_id: 1 })
}

async function loadProgramsForChannels(channels = []) {
  const cids = channels.map(c => c._id)

  return await db.programs.find({ _cid: { $in: cids } }).sort({ channel: 1, start: 1 })
}

async function setUp() {
  logger.info(`Creating '${LOG_PATH}'...`)
  await file.create(LOG_PATH)
}

async function log(data) {
  await file.append(LOG_PATH, JSON.stringify(data) + '\n')
}
