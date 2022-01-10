const { db, logger, file, xml } = require('../core')
const _ = require('lodash')

let channels = []
let programs = []
let sources = {}

const DB_DIR = process.env.DB_DIR || 'scripts/database'
const API_DIR = process.env.API_DIR || '.gh-pages/api'

async function main() {
  await setUp()

  await generateChannelsJson()
  await generateProgramsJson()
}

main()

async function setUp() {
  channels = await loadChannels()
  programs = await loadPrograms()
}

async function loadChannels() {
  let items = await db.channels.find({}).sort({ xmltv_id: 1 })

  let output = {}
  items.forEach(item => {
    if (!output[item.xmltv_id]) {
      output[item.xmltv_id] = {
        id: item.xmltv_id,
        name: [item.name],
        logo: item.logo || null,
        country: item.country
      }
    } else {
      output[item.xmltv_id].logo = output[item.xmltv_id].logo || item.logo
      output[item.xmltv_id].name.push(item.name)
    }

    output[item.xmltv_id].name = _.uniq(output[item.xmltv_id].name)
  })

  return Object.values(output)
}

async function loadPrograms() {
  let items = await db.programs.find({})

  items = _.sortBy(items, ['channel', 'start'])
  items = _.groupBy(items, 'channel')

  for (let channel in items) {
    let channelPrograms = items[channel]
    channelPrograms = Object.values(_.groupBy(channelPrograms, i => i.site))[0]
    let slots = _.groupBy(channelPrograms, i => `${i.start}_${i.stop}`)

    for (let slotId in slots) {
      let program = {
        channel,
        title: [],
        description: [],
        categories: [],
        image: null,
        start: null,
        stop: null
      }

      slots[slotId].forEach(item => {
        if (item.title) program.title.push({ lang: item.lang, value: item.title })
        if (item.description)
          program.description.push({
            lang: item.lang,
            value: item.description
          })
        if (item.category) program.categories.push({ lang: item.lang, value: item.category })
        program.image = program.image || item.icon
        program.start = item.start
        program.stop = item.stop
        sources[channel] = item.site
      })

      program.title = _.uniqBy(program.title, 'lang')
      program.description = _.uniqBy(program.description, 'lang')
      program.categories = _.uniqBy(program.categories, 'lang')

      slots[slotId] = program
    }

    items[channel] = Object.values(slots)
  }

  return items
}

async function generateChannelsJson() {
  logger.info('Generating channels.json...')

  await file.create(`${API_DIR}/channels.json`, JSON.stringify(channels))
}

async function generateProgramsJson() {
  logger.info('Generating programs.json...')

  await file.create(`${API_DIR}/programs.json`, JSON.stringify(programs))
}
