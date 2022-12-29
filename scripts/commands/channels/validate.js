const { parser, logger, api } = require('../../core')
const { program } = require('commander')
const chalk = require('chalk')
const langs = require('langs')

program.argument('<filepath>', 'Path to file to validate').parse(process.argv)

async function main() {
  await api.channels.load()

  const stats = {
    files: 0,
    errors: 0
  }

  if (!program.args.length) {
    logger.error('required argument "filepath" not specified')
  }

  for (const filepath of program.args) {
    if (!filepath.endsWith('.xml')) continue

    const { site, channels } = await parser.parseChannels(filepath)

    const bufferById = {}
    const bufferBySiteId = {}
    const errors = []
    for (const channel of channels) {
      if (!bufferById[channel.id + channel.lang]) {
        bufferById[channel.id + channel.lang] = channel
      } else {
        errors.push({ type: 'duplicate', xmltv_id: channel.id, ...channel })
        stats.errors++
      }

      if (!bufferBySiteId[channel.site_id + channel.lang]) {
        bufferBySiteId[channel.site_id + channel.lang] = channel
      } else {
        errors.push({ type: 'duplicate', xmltv_id: channel.id, ...channel })
        stats.errors++
      }

      if (!api.channels.find({ id: channel.id })) {
        errors.push({ type: 'wrong_xmltv_id', xmltv_id: channel.id, ...channel })
        stats.errors++
      }

      if (!langs.where('1', channel.lang)) {
        errors.push({ type: 'wrong_lang', xmltv_id: channel.id, ...channel })
        stats.errors++
      }
    }

    if (errors.length) {
      logger.info(chalk.underline(filepath))
      console.table(errors, ['type', 'lang', 'xmltv_id', 'site_id', 'name'])
      console.log()
      stats.files++
    }
  }

  if (stats.errors > 0) {
    logger.error(chalk.red(`${stats.errors} error(s) in ${stats.files} file(s)`))
    process.exit(1)
  }
}

main()
