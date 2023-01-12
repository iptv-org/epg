const _ = require('lodash')
const { EPGGrabber, Channel } = require('epg-grabber')
const { program } = require('commander')
const { db, logger, timer, file, parser } = require('../../core')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

const options = program
  .requiredOption('-c, --cluster-id <cluster-id>', 'The ID of cluster to load', parser.parseNumber)
  .option('--delay <delay>', 'Delay between requests (in mileseconds)', parser.parseNumber)
  .option(
    '-t, --timeout <timeout>',
    'Set a timeout for each request (in mileseconds)',
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
  items = _.orderBy(items, [i => i.channel.id.toLowerCase(), 'date'])
  const total = items.length

  logger.info('Loading...')
  let i = 1
  let totalPrograms = 0
  let config = require(file.resolve(items[0].configPath))
  config = _.merge(config, {
    debug: options.debug,
    delay: options.delay,
    request: {
      timeout: options.timeout
    }
  })
  const grabber = new EPGGrabber(config)
  for (const item of items) {
    const channel = new Channel(item.channel)

    await new Promise(resolve => {
      grabber.grab(channel, item.date, async (data, err) => {
        logger.info(
          `[${i}/${total}] ${channel.site} (${channel.lang}) - ${channel.id} - ${dayjs
            .utc(data.date)
            .format('MMM D, YYYY')} (${data.programs.length} programs)`
        )

        if (err) logger.error(err.message)

        const result = {
          _qid: item._id,
          programs: data.programs,
          error: err ? err.message : null
        }

        await file.append(CLUSTER_PATH, JSON.stringify(result) + '\n')

        totalPrograms += data.programs.length

        if (i < total) i++

        resolve()
      })
    })
  }

  db.queue.compact()

  logger.info(`Done in ${timer.format('HH[h] mm[m] ss[s]')}`)

  if (totalPrograms === 0) {
    logger.error('\nError: No programs found')
    process.exit(1)
  }
}

main()
