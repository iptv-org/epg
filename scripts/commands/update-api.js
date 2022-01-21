const { db, logger, file, xml } = require('../core')
const _ = require('lodash')

const DB_DIR = process.env.DB_DIR || 'scripts/database'
const API_DIR = process.env.API_DIR || '.gh-pages/api'

async function main() {
  await saveToChannelsJson(await loadChannels())
  await saveToProgramsJson(await loadPrograms())
}

main()

async function loadChannels() {
  logger.info('Loading channels from database...')

  await db.channels.load()

  const channels = await db.channels.find({}).sort({ xmltv_id: 1 })

  const output = {}
  for (const channel of channels) {
    if (!output[channel.xmltv_id]) {
      output[channel.xmltv_id] = {
        id: channel.xmltv_id,
        name: [],
        logo: channel.logo || null,
        country: channel.country,
        guides: []
      }
    } else {
      output[channel.xmltv_id].logo = output[channel.xmltv_id].logo || channel.logo
    }

    output[channel.xmltv_id].name.push(channel.name)
    output[channel.xmltv_id].name = _.uniq(output[channel.xmltv_id].name)
    channel.groups.forEach(group => {
      if (channel.programCount) {
        output[channel.xmltv_id].guides.push(
          `https://iptv-org.github.io/epg/guides/${group}.epg.xml`
        )
      }
    })
  }

  return Object.values(output)
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

  logger.info('Sort programs...')
  programs = _.sortBy(programs, ['channel', 'site', 'start'])

  return programs
}

async function saveToChannelsJson(channels = []) {
  const channelsPath = `${API_DIR}/channels.json`
  logger.info(`Saving to "${channelsPath}"...`)
  await file.create(channelsPath, JSON.stringify(channels))
}

async function saveToProgramsJson(programs = []) {
  const programsPath = `${API_DIR}/programs.json`
  logger.info(`Saving to "${programsPath}"...`)
  await file.create(programsPath, JSON.stringify(programs))
}
