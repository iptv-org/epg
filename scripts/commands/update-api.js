const { db, logger, file, xml } = require('../core')
const _ = require('lodash')

const DB_DIR = process.env.DB_DIR || 'scripts/database'
const API_DIR = process.env.API_DIR || '.gh-pages/api'

async function main() {
  await generateChannelsJson()
  await generateProgramsJson()
  logger.info(`Done`)
}

main()

async function generateChannelsJson() {
  logger.info('Generating channels.json...')

  const channels = await loadChannels()

  const channelsPath = `${API_DIR}/channels.json`
  logger.info(`Saving to "${channelsPath}"...`)
  await file.create(channelsPath, JSON.stringify(channels))
}

async function generateProgramsJson() {
  logger.info('Generating programs.json...')

  const programs = await loadPrograms()

  const programsPath = `${API_DIR}/programs.json`
  logger.info(`Saving to "${programsPath}"...`)
  await file.create(programsPath, JSON.stringify(programs))
}

async function loadPrograms() {
  logger.info('Loading programs from database...')

  await db.programs.load()

  let items = await db.programs.find({})

  items = items.map(item => {
    const categories = Array.isArray(item.category) ? item.category : [item.category]

    return {
      channel: item.channel,
      site: item.site,
      lang: item.lang,
      title: item.title,
      desc: item.description || null,
      categories: categories.filter(i => i),
      season: item.season || null,
      episode: item.episode || null,
      image: item.icon || null,
      start: item.start,
      stop: item.stop
    }
  })

  logger.info('Sort programs...')
  return _.sortBy(items, ['channel', 'site', 'start'])
}

async function loadChannels() {
  logger.info('Loading channels from database...')

  await db.channels.load()

  const items = await db.channels.find({}).sort({ xmltv_id: 1 })

  const output = {}
  for (const item of items) {
    if (!output[item.xmltv_id]) {
      output[item.xmltv_id] = {
        id: item.xmltv_id,
        name: [],
        logo: item.logo || null,
        country: item.country,
        guides: []
      }
    } else {
      output[item.xmltv_id].logo = output[item.xmltv_id].logo || item.logo
    }

    output[item.xmltv_id].name.push(item.name)
    output[item.xmltv_id].name = _.uniq(output[item.xmltv_id].name)
    output[item.xmltv_id].guides.push(
      `https://iptv-org.github.io/epg/guides/${item.gid}/${item.site}.epg.xml`
    )
  }

  return Object.values(output)
}
