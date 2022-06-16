const { db, logger, file, api, zip } = require('../../core')
const { generateXMLTV, Program, Channel } = require('epg-grabber')
const _ = require('lodash')

const PUBLIC_DIR = process.env.PUBLIC_DIR || '.gh-pages'
const CURR_DATE = process.env.CURR_DATE || new Date()

async function main() {
  logger.info(`Generating guides/...`)

  logger.info('Loading "database/programs.db"...')
  await db.programs.load()
  await api.channels.load()

  let total = 0
  const grouped = groupByGroup(await loadQueue())
  for (const key in grouped) {
    let channels = {}
    let programs = []
    for (const item of grouped[key]) {
      if (item.error) continue

      const itemPrograms = await loadProgramsForItem(item)
      programs = programs.concat(itemPrograms)

      if (channels[item.channel.id]) continue
      const found = api.channels.find({ id: item.channel.id })
      if (found) {
        channels[item.channel.id] = new Channel(item.channel)
      }
    }
    channels = Object.values(channels)
    channels = _.sortBy(channels, 'id')
    programs = _.sortBy(programs, ['channel', 'start'])
    programs = programs.map(p => new Program(p))
    total += programs.length

    const filepath = `${PUBLIC_DIR}/guides/${key}.epg.xml`
    logger.info(`Creating "${filepath}"...`)
    const output = generateXMLTV({ channels, programs, date: CURR_DATE })
    await file.create(filepath, output)
    const compressed = await zip.compress(output)
    await file.create(filepath + '.gz', compressed)
  }

  if (!total) {
    logger.error('\nError: No programs found')
    process.exit(1)
  } else {
    logger.info(`Done`)
  }
}

main()

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
