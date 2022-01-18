const { db, logger, file, xml } = require('../core')
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

  const channels = await loadChannels()
  const programs = await loadPrograms()

  const grouped = _.groupBy(programs, i => `${i.gid}_${i.site}`)
  for (let key in grouped) {
    const [gid, site] = key.split('_') || [null, null]
    const filepath = `${PUBLIC_DIR}/guides/${gid}/${site}.epg.xml`
    const groupProgs = grouped[key]
    const groupChannels = Object.keys(_.groupBy(groupProgs, i => `${i.site}_${i.channel}`)).map(
      key => {
        let [site, channel] = key.split('_')

        return channels.find(i => i.xmltv_id === channel && i.site === site)
      }
    )

    const output = xml.create({ channels: groupChannels, programs: groupProgs })

    logger.info(`Creating "${filepath}"...`)
    await file.create(filepath, output)

    await log({
      gid,
      site,
      count: groupChannels.length,
      status: 1
    })
  }

  logger.info(`Done`)
}

async function loadChannels() {
  logger.info('Loading channels...')

  await db.channels.load()

  return await db.channels.find({}).sort({ xmltv_id: 1 })
}

async function loadPrograms() {
  logger.info('Loading programs...')

  logger.info('Loading "database/programs.db"...')
  await db.programs.load()

  logger.info('Loading programs from "database/programs.db"...')
  let programs = await db.programs.find({}).sort({ channel: 1, start: 1 })

  programs = programs.map(program => {
    return {
      title: program.title ? [{ lang: program.lang, value: program.title }] : [],
      description: program.description ? [{ lang: program.lang, value: program.description }] : [],
      categories: program.category ? [{ lang: program.lang, value: program.category }] : [],
      icon: program.icon,
      channel: program.channel,
      lang: program.lang,
      start: program.start,
      stop: program.stop,
      site: program.site,
      country: program.country,
      season: program.season,
      episode: program.episode,
      gid: program.gid,
      _id: program._id
    }
  })

  return programs
}

async function setUp() {
  logger.info(`Creating '${LOG_PATH}'...`)
  await file.create(LOG_PATH)
}

async function log(data) {
  await file.append(LOG_PATH, JSON.stringify(data) + '\n')
}
