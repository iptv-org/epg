const { db, logger, api, parser } = require('../../core')
const chalk = require('chalk')
const _ = require('lodash')

const LOGS_DIR = process.env.LOGS_DIR || 'scripts/logs'

async function main() {
  logger.info('loading data/channels.json...')
  await api.channels.load()

  const logPath = `${LOGS_DIR}/guides/update.log`
  logger.info(`loading ${logPath}...`)
  const guides = await parser.parseLogs(logPath)

  logger.info('loading database/programs.db...')
  await db.programs.load()
  let db_programs = await db.programs.find({})
  logger.info(`found ${db_programs.length} programs`)

  const errors = []

  let programs = db_programs.map(p => ({
    site: p.site,
    xmltv_id: p.channel,
    lang: p.titles[0].lang
  }))
  programs = _.uniqBy(programs, p => p.site + p.xmltv_id)
  for (let program of programs) {
    if (!guides.find(g => g.channel === program.xmltv_id)) {
      const channel = await api.channels.find({ id: program.xmltv_id })
      errors.push({ type: 'no_guide', ...program, ...channel })
    }
  }

  if (errors.length) {
    console.table(errors, ['type', 'site', 'lang', 'xmltv_id', 'broadcast_area', 'languages'])
    console.log()

    logger.error(chalk.red(`${errors.length} error(s)`))
  }
}

main()
