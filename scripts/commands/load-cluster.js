const grabber = require('epg-grabber')
const { program } = require('commander')
const { db, logger, timer, file, parser } = require('../core')

const options = program
  .requiredOption('-c, --cluster-id <cluster-id>', 'The ID of cluster to load', parser.parseNumber)
  .option('-d, --days <days>', 'Number of days for which to grab the program', parser.parseNumber)
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
  const channels = await db.channels.find({ cluster_id: options.clusterId })
  const days = options.days || 1
  const total = days * channels.length
  logger.info(`Total ${total} requests`)

  logger.info('Loading...')
  const results = {}
  let i = 1
  for (const channel of channels) {
    const config = require(file.resolve(channel.configPath))
    config.days = config.days || days
    const programs = await grabber.grab(channel, config, (data, err) => {
      logger.info(
        `[${i}/${total}] ${config.site} - ${data.channel.xmltv_id} - ${data.date.format(
          'MMM D, YYYY'
        )} (${data.programs.length} programs)`
      )

      if (err) logger.error(err.message)

      if (i < total) i++
    })
    await file.append(
      clusterLog,
      JSON.stringify({ _id: channel._id, site: config.site, country: channel.country, programs }) +
        '\n'
    )
  }

  logger.info(`Done in ${timer.format('HH[h] mm[m] ss[s]')}`)
}

main()
