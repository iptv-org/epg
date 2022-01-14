const { db, logger, file, xml } = require('../core')
const _ = require('lodash')

const DB_DIR = process.env.DB_DIR || 'scripts/database'
const PUBLIC_DIR = process.env.PUBLIC_DIR || '.gh-pages'

async function main() {
  await generateGuides()
}

main()

async function generateGuides() {
  logger.info(`Generating guides/...`)

  const channels = await db.channels.find({}).sort({ xmltv_id: 1 })
  const programs = await loadPrograms()
  const grouped = _.groupBy(programs, i => `${i.gid}/${i.site}.epg.xml`)

  for (let relativePath in grouped) {
    const filepath = `${PUBLIC_DIR}/guides/${relativePath}`
    const groupProgs = grouped[relativePath]
    const groupChannels = Object.keys(_.groupBy(groupProgs, i => `${i.site}_${i.channel}`)).map(
      key => {
        let [site, channel] = key.split('_')

        return channels.find(i => i.xmltv_id === channel && i.site === site)
      }
    )

    const output = xml.create({ channels: groupChannels, programs: groupProgs })

    await file.create(filepath, output)
  }
}

async function loadPrograms() {
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
      gid: program.gid,
      _id: program._id
    }
  })

  return programs
}
