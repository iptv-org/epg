const { db, logger, file, xml } = require('../core')
const _ = require('lodash')

let sources = {}

const DB_DIR = process.env.DB_DIR || 'scripts/database'
const PUBLIC_DIR = process.env.PUBLIC_DIR || '.gh-pages'

async function main() {
  await generateEpgXML()
  await generateGuides()
}

main()

async function generateEpgXML() {
  logger.info(`Generating epg.xml...`)

  const channels = await loadChannels()
  const programs = await loadPrograms()

  const output = {}
  const filteredChannels = Object.keys(programs)
  output.channels = _.flatten(Object.values(channels))
    .filter(c => filteredChannels.includes(c.id))
    .map(c => {
      c.site = sources[c.id]
      return c
    })
  output.programs = _.flatten(Object.values(programs))

  await file.create(`${PUBLIC_DIR}/epg.xml`, xml.create(output))
}

async function generateGuides() {
  logger.info(`Generating guides/...`)

  let channels = await db.channels.find({}).sort({ xmltv_id: 1 })
  const programs = await db.programs.find({}).sort({ channel: 1, start: 1 })
  const grouped = _.groupBy(programs, i => `${i.country.toLowerCase()}/${i.site}`)

  for (let groupId in grouped) {
    const filepath = `${PUBLIC_DIR}/guides/${groupId}.epg.xml`
    const groupProgs = grouped[groupId]
    const groupChannels = Object.keys(_.groupBy(groupProgs, 'channel')).map(key => {
      let [_, site] = groupId.split('/')
      return channels.find(i => i.xmltv_id === key && i.site === site)
    })
    const output = xml.create({ channels: groupChannels, programs: groupProgs })
    await file.create(filepath, output)
  }
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

  return output
}

async function loadPrograms() {
  let programs = await db.programs.find({})

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
      _id: program._id
    }
  })

  programs = _.sortBy(programs, ['channel', 'start'])
  programs = _.groupBy(programs, 'channel')

  // for (let channel in items) {
  //   let channelPrograms = items[channel]
  //   channelPrograms = Object.values(_.groupBy(channelPrograms, i => i.site))[0]
  //   let slots = _.groupBy(channelPrograms, i => `${i.start}_${i.stop}`)

  //   for (let slotId in slots) {
  //     let program = {
  //       channel,
  //       title: [],
  //       description: [],
  //       categories: [],
  //       image: null,
  //       start: null,
  //       stop: null
  //     }

  //     slots[slotId].forEach(item => {
  //       if (item.title) program.title.push({ lang: item.lang, value: item.title })
  //       if (item.description)
  //         program.description.push({
  //           lang: item.lang,
  //           value: item.description
  //         })
  //       if (item.category) program.categories.push({ lang: item.lang, value: item.category })
  //       program.image = program.image || item.icon
  //       program.start = item.start
  //       program.stop = item.stop
  //       sources[channel] = item.site
  //     })

  //     program.title = _.uniqBy(program.title, 'lang')
  //     program.description = _.uniqBy(program.description, 'lang')
  //     program.categories = _.uniqBy(program.categories, 'lang')

  //     slots[slotId] = program
  //   }

  //   items[channel] = Object.values(slots)
  // }

  return programs
}
