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

  const channelsPath = `${API_DIR}/channels.json`
  logger.info(`Saving to "${channelsPath}"...`)
  await file.create(channelsPath, JSON.stringify(channels))

  logger.info(`Done`)
}

async function loadChannels() {
  logger.info('Loading channels from database...')

  await db.channels.load()

  const items = await db.channels.find({}).sort({ xmltv_id: 1 })

  const output = {}
  for (const item of items) {
    if (!output[item.xmltv_id]) {
      output[item.xmltv_id] = {
        id: item.xmltv_id,
        name: [],
        logo: item.logo || null,
        country: item.country,
        guides: []
      }
    } else {
      output[item.xmltv_id].logo = output[item.xmltv_id].logo || item.logo
    }

    output[item.xmltv_id].name.push(item.name)
    output[item.xmltv_id].name = _.uniq(output[item.xmltv_id].name)
    output[item.xmltv_id].guides.push(
      `https://iptv-org.github.io/epg/guides/${item.gid}/${item.site}.epg.xml`
    )
  }

  return Object.values(output)
}
