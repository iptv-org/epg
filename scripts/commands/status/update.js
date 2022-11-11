const { file, markdown, logger, table } = require('../../core')
const { program } = require('commander')
const _ = require('lodash')

const CONFIGS_PATH = process.env.CONFIGS_PATH || 'sites/**/*.config.js'

const options = program
  .option('-c, --config <config>', 'Set path to config file', '.readme/status.json')
  .parse(process.argv)
  .opts()

async function main() {
  let data = []

  const files = await file.list(CONFIGS_PATH).catch(console.error)
  for (const filepath of files) {
    try {
      const { site, skip } = require(file.resolve(filepath))

      if (skip) continue

      data.push([
        site,
        `<a href="https://github.com/iptv-org/epg/actions/workflows/${site}.yml"><img src="https://github.com/iptv-org/epg/actions/workflows/${site}.yml/badge.svg" alt="${site}" style="max-width: 100%;"></a>`
      ])
    } catch (err) {
      console.error(err)
      continue
    }
  }

  data = Object.values(_.groupBy(data, item => item[0]))

  const output = table.create(data, [
    'Site',
    'Status&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'
  ])

  await file.create('./.readme/_sites.md', output)

  await updateMarkdown()
}

main()

async function updateMarkdown() {
  logger.info('updating status.md...')

  const config = require(file.resolve(options.config))
  await file.createDir(file.dirname(config.build))
  await markdown.compile(options.config)
}
