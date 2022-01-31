const { db, logger, file, xml } = require('../core')
const _ = require('lodash')

const DB_DIR = process.env.DB_DIR || 'scripts/database'
const API_DIR = process.env.API_DIR || '.gh-pages/api'

async function main() {
  await loadQueue()

  const programs = await loadPrograms()
  const guides = await getGuides(programs)

  await saveToGuidesJson(guides)
  await saveToProgramsJson(programs)
}

main()

async function loadQueue() {
  logger.info('Loading queue...')

  await db.queue.load()
}

async function getGuides(programs = []) {
  programs = _.groupBy(programs, i => i._qid)

  const queue = await db.queue.find({}).sort({ xmltv_id: 1 })

  const output = []
  for (const item of queue) {
    item.groups.forEach(group => {
      const channelPrograms = programs[item._id]
      if (!item.error && channelPrograms) {
        output.push({
          channel: item.channel.xmltv_id,
          site: item.channel.site,
          lang: item.channel.lang,
          url: `https://iptv-org.github.io/epg/guides/${group}.epg.xml`
        })
      }
    })
  }

  return output
}

async function loadPrograms() {
  logger.info('Loading programs...')
  await db.programs.load()
  return await db.programs.find({})
}

async function saveToGuidesJson(guides = []) {
  const guidesPath = `${API_DIR}/guides.json`
  logger.info(`Saving to "${guidesPath}"...`)
  await file.create(guidesPath, JSON.stringify(guides))
}

async function saveToProgramsJson(programs = []) {
  const programsPath = `${API_DIR}/programs.json`
  logger.info(`Saving to "${programsPath}"...`)

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

  await file.create(programsPath, JSON.stringify(programs))
}
