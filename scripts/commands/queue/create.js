const { db, file, parser, logger, date, api } = require('../../core')
const { program } = require('commander')
const _ = require('lodash')

const options = program
  .option(
    '--max-clusters <max-clusters>',
    'Set maximum number of clusters',
    parser.parseNumber,
    256
  )
  .parse(process.argv)
  .opts()

const CHANNELS_PATH = process.env.CHANNELS_PATH || 'sites/**/*.channels.xml'
const CURR_DATE = process.env.CURR_DATE || new Date()

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

  await api.channels.load().catch(console.error)
  const files = await file.list(CHANNELS_PATH).catch(console.error)
  const utcDate = date.getUTC(CURR_DATE)
  for (const filepath of files) {
    try {
      const dir = file.dirname(filepath)
      const { site, channels } = await parser.parseChannels(filepath)
      if (!site) continue
      const configPath = `${dir}/${site}.config.js`
      const config = require(file.resolve(configPath))
      if (config.skip) continue
      const filename = file.basename(filepath)
      const days = config.days || 1
      const dates = Array.from({ length: days }, (_, i) => utcDate.add(i, 'd'))
      for (const channel of channels) {
        if (!channel.site || !channel.id) continue
        const found = api.channels.find({ id: channel.id })
        if (!found) continue
        channel.logo = found.logo
        for (const d of dates) {
          const dString = d.toJSON()
          const key = `${channel.site}:${channel.lang}:${channel.id}:${dString}`
          if (!queue[key]) {
            queue[key] = {
              channel,
              date: dString,
              configPath,
              error: null
            }
          }
        }
      }
    } catch (err) {
      console.error(err)
      continue
    }
  }

  queue = Object.values(queue)

  logger.info(`Added ${queue.length} items`)

  return queue
}

async function saveToDatabase(items = []) {
  logger.info('Saving to the database...')
  await db.queue.load()
  await db.queue.reset()
  let queue = []
  const chunks = split(_.shuffle(items), options.maxClusters)
  for (const [i, chunk] of chunks.entries()) {
    for (const item of chunk) {
      item.cluster_id = i + 1
      queue.push(item)
    }
  }

  queue = _.sortBy(queue, ['channel.lang', 'channel.xmltv_id', 'date'])

  await db.queue.insert(queue)
}

function split(arr, n) {
  let result = []
  for (let i = n; i > 0; i--) {
    result.push(arr.splice(0, Math.ceil(arr.length / i)))
  }
  return result
}
