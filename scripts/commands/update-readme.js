const { file, markdown, parser, logger, api } = require('../core')
const { program } = require('commander')
const _ = require('lodash')

const LOGS_DIR = process.env.LOGS_DIR || 'scripts/logs'

const options = program
  .option('-c, --config <config>', 'Set path to config file', '.readme/config.json')
  .parse(process.argv)
  .opts()

async function main() {
  await api.countries.load()
  await api.subdivisions.load()
  const records = await getLogRecords()
  await generateCountriesTable(records)
  await generateUSStatesTable(records)
  await generateCanadaProvincesTable(records)
  await updateReadme()
}

main()

async function generateCountriesTable(items = []) {
  logger.info('Generating countries table...')

  let rows = []
  for (const item of items) {
    const country = api.countries.find({ code: item.code })
    if (!country) continue

    rows.push({
      flag: country.flag,
      name: country.name,
      channels: item.count,
      epg: `<code>https://iptv-org.github.io/epg/guides/${item.group}.epg.xml</code>`
    })
  }

  rows = _.orderBy(rows, ['name', 'channels'], ['asc', 'desc'])
  rows = _.groupBy(rows, 'name')

  const table = markdown.createTable(rows, ['Country', 'Channels', 'EPG'])

  await file.create('./.readme/_countries.md', table)
}

async function generateUSStatesTable(items = []) {
  logger.info('Generating US states table...')

  let rows = []
  for (const item of items) {
    if (!item.code.startsWith('US-')) continue
    const state = api.subdivisions.find({ code: item.code })
    if (!state) continue

    rows.push({
      name: state.name,
      channels: item.count,
      epg: `<code>https://iptv-org.github.io/epg/guides/${item.group}.epg.xml</code>`
    })
  }

  rows = _.orderBy(rows, ['name', 'channels'], ['asc', 'desc'])
  rows = _.groupBy(rows, 'name')

  const table = markdown.createTable(rows, ['State', 'Channels', 'EPG'])

  await file.create('./.readme/_us-states.md', table)
}

async function generateCanadaProvincesTable(items = []) {
  logger.info('Generating Canada provinces table...')

  let rows = []
  for (const item of items) {
    if (!item.code.startsWith('CA-')) continue
    const province = api.subdivisions.find({ code: item.code })
    if (!province) continue

    rows.push({
      name: province.name,
      channels: item.count,
      epg: `<code>https://iptv-org.github.io/epg/guides/${item.group}.epg.xml</code>`
    })
  }

  rows = _.orderBy(rows, ['name', 'channels'], ['asc', 'desc'])
  rows = _.groupBy(rows, 'name')

  const table = markdown.createTable(rows, ['Province', 'Channels', 'EPG'])

  await file.create('./.readme/_ca-provinces.md', table)
}

async function updateReadme() {
  logger.info('Updating README.md...')

  const config = require(file.resolve(options.config))
  await file.createDir(file.dirname(config.build))
  await markdown.compile(options.config)
}

async function getLogRecords() {
  const logPath = `${LOGS_DIR}/update-guides.log`
  const records = await parser.parseLogs(logPath)

  if (!records.length) {
    logger.error(`File "${logPath}" is empty`)
    process.exit(1)
  }

  return records.map(item => {
    const code = item.group.split('/')[0] || ''
    item.code = code.toUpperCase()

    return item
  })
}
