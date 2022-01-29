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

  await saveToDatabase(await createQueue())

  logger.info('Done')
}

main()

async function createQueue() {
  logger.info(`Create queue...`)

  let queue = {}

  const files = await file.list(options.channels)
  for (const filepath of files) {
    const dir = file.dirname(filepath)
    const { site, channels: items } = await parser.parseChannels(filepath)
    if (!site) continue
    const configPath = `${dir}/${site}.config.js`
    const config = require(file.resolve(configPath))
    if (config.ignore) continue
    const filename = file.basename(filepath)
    const [__, region] = filename.match(/_([a-z-]+)\.channels\.xml/i) || [null, null]
    const groupId = `${region}/${site}`
    for (const item of items) {
      if (!item.site || !item.site_id || !item.xmltv_id) continue
      const key = `${item.site}:${item.site_id}`
      if (!queue[key]) {
        item.configPath = configPath
        item.groups = []

        queue[key] = item
      }

      if (!queue[key].groups.includes(groupId)) {
        queue[key].groups.push(groupId)
      }
    }
  }

  queue = Object.values(queue)

  logger.info(`Found ${queue.length} items`)

  return queue
}

async function saveToDatabase(items = []) {
  logger.info('Saving to the database...')
  await db.queue.load()
  await db.queue.reset()
  const chunks = split(shuffle(items), options.maxClusters)
  for (const [i, chunk] of chunks.entries()) {
    for (const item of chunk) {
      item.cluster_id = i + 1
      await db.queue.insert(item)
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
