const { db, logger, file } = require('../core')
const grabber = require('epg-grabber')
const _ = require('lodash')

const DB_DIR = process.env.DB_DIR || 'scripts/database'
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

  const grouped = groupByGroup(await loadChannels())

  logger.info('Loading "database/programs.db"...')
  await db.programs.load()

  for (const key in grouped) {
    const filepath = `${PUBLIC_DIR}/guides/${key}.epg.xml`
    const channels = grouped[key]
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

async function loadChannels() {
  logger.info('Loading channels...')

  await db.channels.load()

  return await db.channels.find({ programCount: { $gt: 0 } }).sort({ xmltv_id: 1 })
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
