const { db, file, parser, logger } = require('../core')
const { program } = require('commander')
const { shuffle } = require('lodash')

const options = program
  .option(
    '--max-clusters <max-clusters>',
    'Set maximum number of clusters',
    parser.parseNumber,
    256
  )
  .option('--channels <channels>', 'Set path to channels.xml file', 'sites/**/*.channels.xml')
  .parse(process.argv)
  .opts()

async function main() {
  logger.info('Starting...')
  logger.info(`Number of clusters: ${options.maxClusters}`)

  await saveToDatabase(await getChannels())

  logger.info('Done')
}

main()

async function getChannels() {
  logger.info(`Loading channels...`)

  let channels = {}

  const files = await file.list(options.channels)
  for (const filepath of files) {
    const dir = file.dirname(filepath)
    const filename = file.basename(filepath)
    const [_, site] = filename.match(/([a-z0-9-.]+)_/i) || [null, null]
    if (!site) continue
    const configPath = `${dir}/${site}.config.js`
    const config = require(file.resolve(configPath))
    if (config.ignore) continue
    const [__, groupId] = filename.match(/_([a-z-]+)\.channels\.xml/i) || [null, null]
    const items = await parser.parseChannels(filepath)
    for (const item of items) {
      const key = `${item.site}:${item.site_id}`
      if (!channels[key]) {
        const countryCode = item.xmltv_id.split('.')[1]
        item.country = countryCode ? countryCode.toUpperCase() : null
        item.channelsPath = filepath
        item.configPath = configPath
        item.groups = []

        channels[key] = item
      }

      if (!channels[key].groups.includes(groupId)) {
        channels[key].groups.push(groupId)
      }
    }
  }

  channels = Object.values(channels)

  logger.info(`Found ${channels.length} channels`)

  return channels
}

async function saveToDatabase(channels = []) {
  logger.info('Saving to the database...')
  await db.channels.load()
  await db.channels.reset()
  const chunks = split(shuffle(channels), options.maxClusters)
  for (const [i, chunk] of chunks.entries()) {
    for (const item of chunk) {
      item.cluster_id = i + 1
      await db.channels.insert(item)
    }
  }
}

function split(arr, n) {
  let result = []
  for (let i = n; i > 0; i--) {
    result.push(arr.splice(0, Math.ceil(arr.length / i)))
  }
  return result
}
