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

  await db.queue.load()

  const queue = await db.queue.find({}).sort({ xmltv_id: 1 })

  const output = []
  for (const item of queue) {
    item.groups.forEach(group => {
      if (item.programCount) {
        output.push({
          channel: item.xmltv_id,
          site: item.site,
          lang: item.lang,
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
  const guidesPath = `${API_DIR}/guides.json`
  logger.info(`Saving to "${guidesPath}"...`)
  await file.create(guidesPath, JSON.stringify(guides))
}

async function saveToProgramsJson(programs = []) {
  const programsPath = `${API_DIR}/programs.json`
  logger.info(`Saving to "${programsPath}"...`)
  await file.create(programsPath, JSON.stringify(programs))
}
