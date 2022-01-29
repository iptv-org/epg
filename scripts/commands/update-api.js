const { db, logger, file, xml } = require('../core')
const _ = require('lodash')

const DB_DIR = process.env.DB_DIR || 'scripts/database'
const API_DIR = process.env.API_DIR || '.gh-pages/api'

async function main() {
  await saveToGuidesJson(await loadGuides())
  await saveToProgramsJson(await loadPrograms())
}

main()

async function loadGuides() {
  logger.info('Loading guides from database...')

  await db.channels.load()

  const channels = await db.channels.find({}).sort({ xmltv_id: 1 })

  const output = []
  for (const channel of channels) {
    channel.groups.forEach(group => {
      if (channel.programCount) {
        output.push({
          channel: channel.xmltv_id,
          display_name: channel.name,
          site: channel.site,
          lang: channel.lang,
          url: `https://iptv-org.github.io/epg/guides/${group}.epg.xml`
        })
      }
    })
  }

  return output
}

async function loadPrograms() {
  logger.info('Loading programs from database...')

  await db.programs.load()

  let programs = await db.programs.find({})

  programs = programs.map(item => {
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

  programs = _.sortBy(programs, ['channel', 'site', 'start'])

  return programs
}

async function saveToGuidesJson(guides = []) {
  const channelsPath = `${API_DIR}/guides.json`
  logger.info(`Saving to "${channelsPath}"...`)
  await file.create(channelsPath, JSON.stringify(guides))
}

async function saveToProgramsJson(programs = []) {
  const programsPath = `${API_DIR}/programs.json`
  logger.info(`Saving to "${programsPath}"...`)
  await file.create(programsPath, JSON.stringify(programs))
}
