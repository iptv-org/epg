const { file, markdown, parser, logger, api, table } = require('../../core')
const { program } = require('commander')
const _ = require('lodash')

const LOGS_DIR = process.env.LOGS_DIR || 'scripts/logs'

const options = program
  .option('-c, --config <config>', 'Set path to config file', '.readme/readme.json')
  .parse(process.argv)
  .opts()

async function main() {
  await api.countries.load().catch(console.error)
  const logPath = `${LOGS_DIR}/guides/update.log`
  let log = await parser.parseLogs(logPath)

  await createTable(log)

  await updateReadme()
}

main()

async function createTable(log) {
  let files = _.uniqBy(log, i => i.site + i.channel).reduce((acc, curr) => {
    if (!acc[curr.filename]) {
      acc[curr.filename] = {
        site: curr.site,
        lang: curr.lang,
        channels: 0,
        filename: curr.filename
      }
    }

    acc[curr.filename].channels++

    return acc
  }, {})

  let data = []
  for (const filename in files) {
    const item = files[filename]

    data.push([
      item.site,
      item.lang,
      item.channels,
      `<code>https://iptv-org.github.io/epg/guides/${filename}.xml</code>`,
      `<a href="https://github.com/iptv-org/epg/actions/workflows/${filename}.yml"><img src="https://github.com/iptv-org/epg/actions/workflows/${filename}.yml/badge.svg" alt="${filename}" style="max-width: 100%;"></a>`
    ])
  }

  data = _.orderBy(
    data,
    [item => item[0], item => (item[1] === 'en' ? Infinity : item[2])],
    ['asc', 'desc']
  )
  data = data.map(i => {
    i.splice(1, 1)
    return i
  })
  data = Object.values(_.groupBy(data, item => item[0]))

  const output = table.create(data, [
    'Site',
    'Channels',
    'EPG',
    'Status&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'
  ])

  await file.create('./.readme/_sites.md', output)
}

async function updateReadme() {
  logger.info('updating readme.md...')

  const config = require(file.resolve(options.config))
  await file.createDir(file.dirname(config.build))
  await markdown.compile(options.config)
}
