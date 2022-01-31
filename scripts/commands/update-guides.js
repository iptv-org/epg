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

  const grouped = groupByGroup(await loadQueue())

  logger.info('Loading "database/programs.db"...')
  await db.programs.load()
  await api.channels.load()

  for (const key in grouped) {
    const [__, site] = key.split('/')
    const filepath = `${PUBLIC_DIR}/guides/${key}.epg.xml`
    let items = grouped[key]

    const errors = []
    for (const item of items) {
      if (item.error) {
        const error = {
          xmltv_id: item.channel.xmltv_id,
          site: item.channel.site,
          site_id: item.channel.site_id,
          lang: item.channel.lang,
          date: item.date,
          error: item.error
        }
        errors.push(error)
      }
    }
    await logErrors(key, errors)

    const programs = await loadProgramsForItems(items)
    let channels = Object.keys(_.groupBy(programs, 'channel'))

    logger.info(`Creating "${filepath}"...`)
    channels = channels
      .map(id => {
        const channel = api.channels.find({ id })
        if (!channel) return null

        return {
          xmltv_id: channel.id,
          name: channel.name,
          logo: channel.logo,
          site
        }
      })
      .filter(i => i)

    const output = grabber.convertToXMLTV({ channels, programs })
    await file.create(filepath, output)

    let status = 0
    if (errors.length > 0 || !channels.length) {
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

async function loadProgramsForItems(items = []) {
  const qids = items.map(i => i._id)

  return await db.programs.find({ _qid: { $in: qids } }).sort({ channel: 1, start: 1 })
}

async function setUp() {
  logger.info(`Creating '${GUIDES_PATH}'...`)
  await file.create(GUIDES_PATH)
  await file.createDir(`${LOGS_DIR}/errors`)
}

async function logGuide(data) {
  await file.append(GUIDES_PATH, JSON.stringify(data) + '\r\n')
}

async function logErrors(key, errors) {
  if (!errors.length) return false
  errors = errors.map(e => JSON.stringify(e)).join('\r\n')

  await file.create(`${LOGS_DIR}/errors/${key}.log`, errors)
}
