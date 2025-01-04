import { Logger, Timer, Storage, Collection } from '@freearhey/core'
import { Option, program } from 'commander'
import { CronJob } from 'cron'
import { QueueCreator, Job, ChannelsParser } from '../../core'
import { Channel } from 'epg-grabber'
import path from 'path'
import { SITES_DIR } from '../../constants'

program
  .addOption(new Option('-s, --site <name>', 'Name of the site to parse').env('SITE'))
  .addOption(new Option(
    '-c, --channels <path>',
    'Path to *.channels.xml file (required if the "--site" attribute is not specified)'
    ).env('CHANNELS')
  )
  .addOption(new Option('-o, --output <path>', 'Path to output file').default('guide.xml').env('OUTPUT'))
  .addOption(new Option('-l, --lang <code>', 'Filter channels by language (ISO 639-2 code)').env('LANG'))
  .addOption(new Option('-t, --timeout <milliseconds>', 'Override the default timeout for each request').env('TIMEOUT'))
  .addOption(new Option('-d, --delay <milliseconds>', 'Override the default delay between request').env('DELAY'))
  .addOption(new Option(
    '--days <days>',
    'Override the number of days for which the program will be loaded (defaults to the value from the site config)')
    .argParser(value => parseInt(value))
    .env('DAYS')
  )
  .addOption(new Option(
    '--maxConnections <number>',
    'Limit on the number of concurrent requests')
    .argParser(value => parseInt(value))
    .default(5)
    .env('MAX_CONNECTIONS')
  )
  .addOption(new Option('--cron <expression>', 'Schedule a script run (example: "0 0 * * *")').env('CRON'))
  .addOption(new Option('--gzip', 'Create a compressed version of the guide as well').default(false).env('GZIP'))
  .parse(process.argv)

export type GrabOptions = {
  site?: string
  channels?: string
  output: string
  gzip: boolean
  maxConnections: number
  timeout?: string
  delay?: string
  lang?: string
  days?: number
  cron?: string
}

const options: GrabOptions = program.opts()

async function main() {
  if (!options.site && !options.channels)
    throw new Error('One of the arguments must be presented: `--site` or `--channels`')

  const logger = new Logger()

  logger.start('starting...')

  logger.info('config:')
  logger.tree(options)

  logger.info('loading channels...')
  const storage = new Storage()
  const parser = new ChannelsParser({ storage })

  let files: string[] = []
  if (options.site) {
    let pattern = path.join(SITES_DIR, options.site, '*.channels.xml')
    pattern = pattern.replace(/\\/g, '/')
    files = await storage.list(pattern)
  } else if (options.channels) {
    files = await storage.list(options.channels)
  }

  let parsedChannels = new Collection()
  for (const filepath of files) {
    parsedChannels = parsedChannels.concat(await parser.parse(filepath))
  }
  if (options.lang) {
    parsedChannels = parsedChannels.filter((channel: Channel) => channel.lang === options.lang)
  }
  logger.info(`  found ${parsedChannels.count()} channel(s)`)

  let runIndex = 1
  if (options.cron) {
    const cronJob = new CronJob(options.cron, async () => {
      logger.info(`run #${runIndex}:`)
      await runJob({ logger, parsedChannels })
      runIndex++
    })
    cronJob.start()
  } else {
    logger.info(`run #${runIndex}:`)
    runJob({ logger, parsedChannels })
  }
}

main()

async function runJob({ logger, parsedChannels }: { logger: Logger; parsedChannels: Collection }) {
  const timer = new Timer()
  timer.start()

  const queueCreator = new QueueCreator({
    parsedChannels,
    logger,
    options
  })
  const queue = await queueCreator.create()
  const job = new Job({
    queue,
    logger,
    options
  })

  await job.run()

  logger.success(`  done in ${timer.format('HH[h] mm[m] ss[s]')}`)
}
