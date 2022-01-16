const _ = require('lodash')
const grabber = require('epg-grabber')
const { program } = require('commander')
const { db, logger, timer, file, parser } = require('../core')

const options = program
  .requiredOption('-c, --cluster-id <cluster-id>', 'The ID of cluster to load', parser.parseNumber)
  .option('--days <days>', 'Number of days for which to grab the program', parser.parseNumber, 1)
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

async function main() {
  logger.info('Starting...')
  timer.start()

  const clusterLog = `${LOGS_DIR}/load-cluster/cluster_${options.clusterId}.log`
  logger.info(`Loading cluster: ${options.clusterId}`)
  logger.info(`Creating '${clusterLog}'...`)
  await file.create(clusterLog)
  await db.channels.load()
  const channels = await db.channels.find({ cluster_id: options.clusterId })
  const total = options.days * channels.length
  logger.info(`Total ${total} requests`)

  logger.info('Loading...')
  const results = {}
  let i = 1
  for (const channel of channels) {
    let config = require(file.resolve(channel.configPath))

    config = _.merge(config, {
      days: options.days,
      debug: options.debug,
      delay: options.delay,
      request: {
        timeout: options.timeout
      }
    })

    await grabber.grab(channel, config, async (data, err) => {
      await file.append(
        clusterLog,
        JSON.stringify({
          _id: channel._id,
          site: channel.site,
          country: channel.country,
          logo: data.channel.logo,
          gid: channel.gid,
          programs: data.programs
        }) + '\n'
      )

      logger.info(
        `[${i}/${total}] ${channel.site} - ${channel.xmltv_id} - ${data.date.format(
          'MMM D, YYYY'
        )} (${data.programs.length} programs)`
      )

      if (err) logger.error(err.message)

      if (i < total) i++
    })
  }

  db.channels.compact()

  logger.info(`Done in ${timer.format('HH[h] mm[m] ss[s]')}`)
}

main()
