const { file, markdown, parser, logger, api, table } = require('../core')
const { program } = require('commander')
const _ = require('lodash')

const CHANNELS_PATH = process.env.CHANNELS_PATH || 'sites/**/*.channels.xml'

const options = program
  .option('-c, --config <config>', 'Set path to config file', '.readme/config.json')
  .parse(process.argv)
  .opts()

async function main() {
  await api.countries.load()
  const files = await file.list(CHANNELS_PATH)
  const items = []
  for (const filepath of files) {
    const { site, channels } = await parser.parseChannels(filepath)
    const dir = file.dirname(filepath)
    const config = require(file.resolve(`${dir}/${site}.config.js`))
    if (config.ignore) continue

    const filename = file.basename(filepath)
    const [__, suffix] = filename.match(/\_(.*)\.channels\.xml$/) || [null, null]
    const [code] = suffix.split('-')

    items.push({
      code,
      site,
      count: channels.length,
      group: `${suffix}/${site}`
    })
  }

  await generateCountriesTable(items)
  await updateReadme()
}

main()

async function generateCountriesTable(items = []) {
  logger.info('generating countries table...')

  let rows = []
  for (const item of items) {
    const country = api.countries.find({ code: item.code.toUpperCase() })
    if (!country) continue

    rows.push({
      flag: country.flag,
      name: country.name,
      channels: item.count,
      epg: `<code>https://iptv-org.github.io/epg/guides/${item.group}.epg.xml</code>`,
      status: `<a href="https://github.com/iptv-org/epg/actions/workflows/${item.site}.yml"><img src="https://github.com/iptv-org/epg/actions/workflows/${item.site}.yml/badge.svg" alt="${item.site}" style="max-width: 100%;"></a>`
    })
  }

  rows = _.orderBy(rows, ['name', 'channels'], ['asc', 'desc'])
  rows = _.groupBy(rows, 'name')

  const output = table.create(rows, [
    'Country&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
    'Channels',
    'EPG',
    'Status&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'
  ])

  await file.create('./.readme/_countries.md', output)
}

async function updateReadme() {
  logger.info('updating readme.md...')

  const config = require(file.resolve(options.config))
  await file.createDir(file.dirname(config.build))
  await markdown.compile(options.config)
}
