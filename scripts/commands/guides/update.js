const { db, api, logger, file, zip } = require('../../core')
const { generateXMLTV, Program, Channel } = require('epg-grabber')
const _ = require('lodash')

const PUBLIC_DIR = process.env.PUBLIC_DIR || '.gh-pages'
const LOGS_DIR = process.env.LOGS_DIR || 'scripts/logs'
const CURR_DATE = process.env.CURR_DATE || new Date()

const logPath = `${LOGS_DIR}/guides/update.log`

let api_channels = {}
let db_queue = []
let db_programs = []
let guides = []

async function main() {
  logger.info(`starting...`)

  logger.info('loading data/channels.json...')
  await api.channels.load()

  api.channels.all().forEach(channel => {
    api_channels[channel.id] = channel
  })

  logger.info('loading database/queue.db...')
  await db.queue.load()
  db_queue = await db.queue.find({})
  logger.info(`found ${db_queue.length} items`)

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
  let queue = _.uniqBy(db_queue, i => i.channel.lang + i.channel.id + i.channel.site)
  queue = _.groupBy(queue, i => (i.channel ? `${i.channel.lang}/${i.channel.site}` : `_`))
  delete queue['_']

  let programs = _.groupBy(db_programs, p =>
    p.titles.length ? `${p.titles[0].lang}/${p.site}` : `_`
  )

  delete programs['_']

  for (let filename in queue) {
    if (!queue[filename]) continue
    const channels = queue[filename].map(i => {
      const channelData = api_channels[i.channel.id]
      channelData.site = i.channel.site
      channelData.site_id = i.channel.site_id
      channelData.lang = i.channel.lang

      return new Channel(channelData)
    })

    await save(filename, channels, programs[filename])

    for (let channel of channels) {
      const configPath = `sites/${channel.site}/${channel.site}.config.js`
      const config = require(file.resolve(configPath))

      guides.push({
        site: channel.site,
        lang: channel.lang,
        days: config.days,
        channel: channel.id,
        filename
      })
    }
  }
}

async function save(filepath, channels, programs = []) {
  let output = {
    channels,
    programs: [],
    date: CURR_DATE
  }

  for (let programData of programs) {
    let channel = channels.find(c => c.id === programData.channel)
    if (!channel) continue

    let program = new Program(programData, channel)

    output.programs.push(program)
  }

  output.channels = _.sortBy(output.channels, 'id')
  output.channels = _.uniqBy(output.channels, 'id')

  output.programs = _.sortBy(output.programs, ['channel', 'start'])
  output.programs = _.uniqBy(output.programs, p => p.channel + p.start)

  const xmlFilepath = `${PUBLIC_DIR}/guides/${filepath}.xml`
  const gzFilepath = `${PUBLIC_DIR}/guides/${filepath}.xml.gz`
  logger.info(`creating ${xmlFilepath}...`)
  const xmltv = generateXMLTV(output)
  await file.create(xmlFilepath, xmltv)
  logger.info(`creating ${gzFilepath}...`)
  const compressed = await zip.compress(xmltv)
  await file.create(gzFilepath, compressed)

  return output
}
