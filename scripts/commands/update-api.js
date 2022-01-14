const { db, logger, file, xml } = require('../core')
const _ = require('lodash')

const DB_DIR = process.env.DB_DIR || 'scripts/database'
const API_DIR = process.env.API_DIR || '.gh-pages/api'

async function main() {
  await generateChannelsJson()
}

main()

async function generateChannelsJson() {
  logger.info('Generating channels.json...')

  const channels = await loadChannels()

  await file.create(`${API_DIR}/channels.json`, JSON.stringify(channels))
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
