const _ = require('lodash')
const EPGGrabber = require('epg-grabber')
const { program } = require('commander')
const { db, logger, timer, file, parser } = require('../../core')

const options = program
  .requiredOption('-c, --cluster-id <cluster-id>', 'The ID of cluster to load', parser.parseNumber)
  .option('--delay <delay>', 'Delay between requests (in mileseconds)', parser.parseNumber)
  .option(
    '-t, --timeout <timeout>',
    'Set a timeout for each request (in mileseconds)',
    parser.parseNumber
  )
  .option(
    '--cache-max-age <cacheMaxAge>',
    'Maximum time for storing each request (in milliseconds)',
    parser.parseNumber
  )
  .option('--debug', 'Enable debug mode', false)
  .parse(process.argv)
  .opts()

const LOGS_DIR = process.env.LOGS_DIR || 'scripts/logs'
const CLUSTER_PATH = `${LOGS_DIR}/cluster/load/cluster_${options.clusterId}.log`

async function main() {
  logger.info('Starting...')
  timer.start()

  logger.info(`Loading cluster: ${options.clusterId}`)
  logger.info(`Creating '${CLUSTER_PATH}'...`)
  await file.create(CLUSTER_PATH)
  await db.queue.load()
  let items = await db.queue.find({ cluster_id: options.clusterId })
  items = _.orderBy(items, [i => i.channel.xmltv_id.toLowerCase(), 'date'])
  const total = items.length

  logger.info('Loading...')
  const results = {}
  let i = 1
  let config = require(file.resolve(items[0].configPath))
  config = _.merge(config, {
    debug: options.debug,
    delay: options.delay,
    request: {
      timeout: options.timeout,
      cache: {
        maxAge: options.cacheMaxAge
      }
    }
  })
  const grabber = new EPGGrabber(config)
  for (const item of items) {
    await grabber.grab(item.channel, item.date, async (data, err) => {
      logger.info(
        `[${i}/${total}] ${item.channel.site} (${item.channel.lang}) - ${
          item.channel.xmltv_id
        } - ${data.date.format('MMM D, YYYY')} (${data.programs.length} programs)`
      )

      if (err) logger.error(err.message)

      const result = {
        _qid: item._id,
        programs: data.programs,
        error: err ? err.message : null
      }

      await file.append(CLUSTER_PATH, JSON.stringify(result) + '\n')

      if (i < total) i++
    })
  }

  db.queue.compact()

  logger.info(`Done in ${timer.format('HH[h] mm[m] ss[s]')}`)
}

main()
