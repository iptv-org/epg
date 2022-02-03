const { parser, logger, api } = require('../core')
const { program } = require('commander')
const chalk = require('chalk')

program.argument('<filepath>', 'Path to file to validate').parse(process.argv)

async function main() {
  await api.channels.load()

  const stats = {
    channels: 0,
    files: 0
  }

  if (!program.args.length) {
    logger.error('required argument "filepath" not specified')
  }

  for (const filepath of program.args) {
    const { site, channels } = await parser.parseChannels(filepath)

    const output = []
    for (const channel of channels) {
      if (!api.channels.find({ id: channel.xmltv_id })) {
        output.push(channel)
        stats.channels++
      }
    }

    if (output.length) {
      logger.info(chalk.underline(filepath))
      console.table(output, ['lang', 'xmltv_id', 'site_id', 'name'])
      console.log()
      stats.files++
    }
  }

  if (stats.channels > 0) {
    logger.error(
      chalk.red(`${stats.channels} channel(s) in ${stats.files} file(s) have the wrong xmltv_id`)
    )
    process.exit(1)
  }
}

main()
