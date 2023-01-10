const { file, parser, logger } = require('../../core')
const { program } = require('commander')
const _ = require('lodash')

const LOGS_DIR = process.env.LOGS_DIR || 'scripts/logs'
const OUTPUT_DIR = process.env.OUTPUT_DIR || '.api'

async function main() {
  let guides = []

  const logPath = `${LOGS_DIR}/guides/update.log`
  const results = await parser.parseLogs(logPath)

  for (const result of results) {
    guides.push({
      channel: result.channel,
      site: result.site,
      lang: result.lang,
      days: result.days,
      url: `https://iptv-org.github.io/epg/guides/${result.filename}.xml`
    })
  }

  guides = _.sortBy(guides, 'channel')

  const outputFilepath = `${OUTPUT_DIR}/guides.json`
  await file.create(outputFilepath, JSON.stringify(guides))
  logger.info(`saved to "${outputFilepath}"...`)
}

main()
