const { db, logger, file, parser } = require('../core')
const _ = require('lodash')

const LOGS_PATH = process.env.LOGS_PATH || 'scripts/logs'
const OUTPUT_PATH = process.env.OUTPUT_PATH || 'scripts/output'

let channels = []
let programs = []

async function main() {
  await setUp()

  await createChannelsJson()
  await createProgramsJson()
}

main()

async function createChannelsJson() {
  logger.info('Creating channels.json...')

  let items = channels
  items = _.sortBy(items, item => item.name)

  let buffer = {}
  items.forEach(item => {
    if (!buffer[item.xmltv_id]) {
      const countryCode = item.xmltv_id.split('.')[1]

      buffer[item.xmltv_id] = {
        id: item.xmltv_id,
        name: [item.name],
        logo: item.logo || null,
        country: countryCode ? countryCode.toUpperCase() : null
      }
    } else {
      if (!buffer[item.xmltv_id].logo && item.logo) {
        buffer[item.xmltv_id].logo = item.logo
      }

      if (!buffer[item.xmltv_id].name.includes(item.name)) {
        buffer[item.xmltv_id].name.push(item.name)
      }
    }
  })

  items = Object.values(buffer)

  await file.create(`${OUTPUT_PATH}/channels.json`, JSON.stringify(items, null, 2))
}

async function createProgramsJson() {
  logger.info('Creating programs.json...')

  let items = programs

  items = _.sortBy(items, ['channel', 'start'])
  items = _.groupBy(items, 'channel')

  for (let channel in items) {
    let programs = items[channel]
    programs = Object.values(_.groupBy(programs, i => i.site))[0]
    let slots = _.groupBy(programs, i => `${i.start}_${i.stop}`)

    for (let slotId in slots) {
      let program = {
        channel,
        site: null,
        title: [],
        description: [],
        categories: [],
        icons: [],
        start: null,
        stop: null
      }

      slots[slotId].forEach(item => {
        program.site = item.site
        if (item.title) program.title.push({ lang: item.lang, value: item.title })
        if (item.description)
          program.description.push({
            lang: item.lang,
            value: item.description
          })
        if (item.category) program.categories.push({ lang: item.lang, value: item.category })
        if (item.icon) program.icons.push(item.icon)
        program.start = item.start
        program.stop = item.stop
      })

      slots[slotId] = program
    }

    items[channel] = Object.values(slots)
  }
  // console.log(items)

  await file.create(`${OUTPUT_PATH}/programs.json`, JSON.stringify(items, null, 2))
}

async function setUp() {
  channels = await db.find({})

  const files = await file.list(`${LOGS_PATH}/load-cluster/cluster_*.log`)
  for (const filepath of files) {
    const results = await parser.parseLogs(filepath)
    results.forEach(result => {
      let pm = result.programs.map(p => {
        p.site = result.site
        return p
      })
      programs = programs.concat(pm)
    })
  }
}
