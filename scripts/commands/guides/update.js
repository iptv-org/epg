const { db, api, logger, file, zip } = require('../../core')
const { generateXMLTV, Program, Channel } = require('epg-grabber')
const _ = require('lodash')

const PUBLIC_DIR = process.env.PUBLIC_DIR || '.gh-pages'
const LOGS_DIR = process.env.LOGS_DIR || 'scripts/logs'
const CURR_DATE = process.env.CURR_DATE || new Date()

const logPath = `${LOGS_DIR}/guides/update.log`

let channels_dic = {}
let db_programs = []
let guides = []

async function main() {
  logger.info(`starting...`)

  logger.info('loading data/channels.json...')
  await api.channels.load()

  let api_channels = await api.channels.all()
  api_channels.forEach(channel => {
    channels_dic[channel.id] = channel
  })

  logger.info('loading database/programs.db...')
  await db.programs.load()
  db_programs = await db.programs.find({})
  logger.info(`found ${db_programs.length} programs`)

  await generate()

  logger.info(`creating ${logPath}...`)
  await file.create(logPath, guides.map(g => JSON.stringify(g)).join('\r\n'))

  logger.info('finished')
}

main()

async function generate() {
  let sites = _.groupBy(db_programs, 'site')

  for (let site in sites) {
    let programs = {}
    for (let prog of sites[site]) {
      let key = prog.channel + prog.start
      if (!programs[key]) {
        programs[key] = prog
      } else {
        programs[key] = merge(programs[key], prog)
      }
    }

    let filename = `${site}`
    let { channels } = await save(filename, Object.values(programs))

    for (let channel of channels) {
      guides.push({
        lang: channel.lang,
        site: channel.site,
        channel: channel.id,
        filename
      })
    }
  }
}

function merge(p1, p2) {
  for (let prop in p1) {
    if (Array.isArray(p1[prop])) {
      p1[prop] = _.orderBy(
        _.uniqWith(p1[prop].concat(p2[prop]), _.isEqual),
        v => (v.lang === 'en' ? Infinity : 1),
        'desc'
      )
    }
  }

  return p1
}

async function save(filepath, programs) {
  let all_channels = {}
  programs.forEach(p => {
    p.titles.forEach(t => {
      let c = channels_dic[p.channel]
      c.site = p.site
      c.lang = t.lang
      if (!all_channels[p.channel + t.lang]) {
        all_channels[p.channel + t.lang] = new Channel(c)
      }
    })
  })

  let channels = _.sortBy(Object.values(all_channels), 'id')
  channels = _.uniqBy(channels, 'id')

  programs = _.sortBy(programs, ['channel', 'start'])
  programs = programs.map(p => new Program(p, new Channel(channels_dic[p.channel])))
  programs = _.uniqBy(programs, p => p.channel + p.start)

  const xmlFilepath = `${PUBLIC_DIR}/guides/${filepath}.xml`
  const gzFilepath = `${PUBLIC_DIR}/guides/${filepath}.xml.gz`
  const jsonFilepath = `${PUBLIC_DIR}/guides/${filepath}.json`
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

  return {
    channels: Object.values(all_channels),
    programs
  }
}
