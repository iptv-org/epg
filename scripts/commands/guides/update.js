const { db, api, logger, file, zip } = require('../../core')
const { generateXMLTV, Program, Channel } = require('epg-grabber')
const _ = require('lodash')
const langs = require('langs')

const PUBLIC_DIR = process.env.PUBLIC_DIR || '.gh-pages'
const LOGS_DIR = process.env.LOGS_DIR || 'scripts/logs'
const CURR_DATE = process.env.CURR_DATE || new Date()

const logPath = `${LOGS_DIR}/guides/update.log`

let guides = []
let db_programs = []

async function main() {
  logger.info(`starting...`)

  logger.info('loading data/countries.json...')
  await api.countries.load()
  logger.info('loading data/channels.json...')
  await api.channels.load()
  logger.info('loading data/regions.json...')
  await api.regions.load()
  logger.info('loading data/subdivisions.json...')
  await api.subdivisions.load()

  let countries = await api.countries.all()
  let api_channels = await api.channels.all()

  let channels_dic = {}
  api_channels.forEach(channel => {
    channels_dic[channel.id] = channel
  })

  let api_regions = await api.regions.all()
  let api_subdivisions = await api.subdivisions.all()

  logger.info('loading database/programs.db...')
  await db.programs.load()
  db_programs = await db.programs.find({})
  db_programs = db_programs
    .map(p => {
      if (p.titles.length) {
        p.score = calcScore(p)
        p.lang = p.titles[0].lang

        return p
      }
      return null
    })
    .filter(Boolean)
  logger.info(`found ${db_programs.length} programs`)

  for (let country of countries) {
    let countryBroadcastCode = `c/${country.code}`
    let countryRegions = api_regions
      .filter(r => r.countries.includes(country.code))
      .map(r => `r/${r.code}`)
    let countrySubdivisions = api_subdivisions
      .filter(s => s.country === country.code)
      .map(s => `s/${s.code}`)
    let broadcastCodes = [countryBroadcastCode, ...countryRegions, ...countrySubdivisions]

    let countryChannels = api_channels.filter(
      c => _.intersection(c.broadcast_area, broadcastCodes).length
    )
    countryChannels = countryChannels.map(c => c.id)

    let countryPrograms = db_programs.filter(p => countryChannels.includes(p.channel))
    let langGroups = _.groupBy(countryPrograms, 'lang')
    let countryLanguages = _.uniq([...country.languages, 'eng'])

    let programs = {}
    for (let langCode of countryLanguages) {
      const lang = convertLangCode(langCode, '3', '1')
      if (!lang) continue

      let langPrograms = langGroups[lang]
      if (!langPrograms || !langPrograms.length) continue

      let channelGroups = _.groupBy(langPrograms, 'channel')
      for (let channel in channelGroups) {
        if (programs[channel]) continue
        let groupedPrograms = channelGroups[channel]
        let channelPrograms = getChannelPrograms(groupedPrograms)
        if (!channelPrograms.length) continue

        programs[channel] = channelPrograms
      }
    }

    programs = _.flatten(Object.values(programs))

    if (!programs.length) continue

    let channels = programs.map(p => {
      let c = channels_dic[p.channel]
      c.site = p.site
      c.lang = p.lang

      return new Channel(c)
    })
    channels = _.sortBy(channels, 'id')
    channels = _.uniqBy(channels, 'id')

    programs = _.sortBy(programs, ['channel', 'start'])
    programs = programs.map(p => new Program(p, new Channel(channels_dic[p.channel])))
    programs = _.uniqBy(programs, p => p.channel + p.start)

    const filename = country.code.toLowerCase()
    const xmlFilepath = `${PUBLIC_DIR}/guides/${filename}.xml`
    const gzFilepath = `${PUBLIC_DIR}/guides/${filename}.xml.gz`
    const jsonFilepath = `${PUBLIC_DIR}/guides/${filename}.json`
    logger.info(`creating ${xmlFilepath}...`)
    const xmltv = generateXMLTV({
      channels,
      programs,
      date: CURR_DATE
    })
    await file.create(xmlFilepath, xmltv)
    logger.info(`creating ${gzFilepath}...`)
    const compressed = await zip.compress(xmltv)
    await file.create(gzFilepath, compressed)
    logger.info(`creating ${jsonFilepath}...`)
    await file.create(jsonFilepath, JSON.stringify({ channels, programs }))

    for (let channel of channels) {
      guides.push({
        country: country.code,
        lang: channel.lang,
        site: channel.site,
        channel: channel.id,
        filename
      })
    }
  }

  logger.info(`creating ${logPath}...`)
  await file.create(logPath, guides.map(g => JSON.stringify(g)).join('\r\n'))

  await makeReport()
}

main()

function convertLangCode(code, from, to) {
  let found = langs.where(from, code)

  return found ? found[to] : null
}

function getChannelPrograms(programs) {
  let sites = _.groupBy(programs, 'site')

  let topScore = 0
  let selected
  for (let site in sites) {
    let sitePrograms = sites[site]
    let siteScore = _.sumBy(sitePrograms, 'score')

    if (siteScore > topScore) {
      selected = site
      topScore = siteScore
    }
  }

  return sites[selected] || []
}

function calcScore(program) {
  let score = 0
  let values = Object.values(program)
  for (let value of values) {
    if (Array.isArray(value) && value.length) {
      score++
    } else if (typeof value === 'string' && value) {
      score++
    } else if (value && typeof value === 'object' && Object.values(value).map(Boolean).length) {
      score++
    }
  }

  return score
}

async function makeReport() {
  const errors = []

  let programs = _.uniqBy(db_programs, p => p.site + p.channel)
  for (let program of programs) {
    if (!guides.find(g => g.channel === program.channel)) {
      const channel = await api.channels.find({ id: program.channel })
      errors.push({ type: 'no_guide', ...program, ...channel })
    }
  }

  console.log()
  logger.info(`report:`)
  console.table(errors, ['type', 'site', 'lang', 'channel', 'broadcast_area', 'languages'])
  logger.error(`found ${errors.length} error(s)`)
}
