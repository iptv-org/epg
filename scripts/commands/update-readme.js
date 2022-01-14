const { file, markdown, parser, logger } = require('../core')
const countries = require('../data/countries.json')
const states = require('../data/us-states.json')
const provinces = require('../data/ca-provinces.json')
const { program } = require('commander')
const _ = require('lodash')

let log = []

const statuses = {
  0: '✗',
  1: '✓'
}

const LOGS_DIR = process.env.LOGS_DIR || 'scripts/logs'

const options = program
  .option('-c, --config <config>', 'Set path to config file', '.readme/config.json')
  .parse(process.argv)
  .opts()

async function main() {
  await setUp()

  await generateCountriesTable()
  await generateUSStatesTable()
  await generateCanadaProvincesTable()

  await updateReadme()
}

main()

async function generateCountriesTable() {
  logger.info('Generating countries table...')

  const items = log.filter(i => i.gid.length === 2)
  let rows = []
  for (const item of items) {
    const code = item.gid.toUpperCase()
    const country = countries[code]

    rows.push({
      name: `${country.flag} ${country.name}`,
      channels: item.count,
      epg: `<code>https://iptv-org.github.io/epg/guides/${item.gid}/${item.site}.epg.xml</code>`,
      status: statuses[item.status]
    })
  }

  rows = _.orderBy(rows, ['name', 'channels'], ['asc', 'desc'])
  rows = _.groupBy(rows, 'name')

  const table = markdown.createTable(rows, ['Country', 'Channels', 'EPG', 'Status'])

  await file.create('./.readme/_countries.md', table)
}

async function generateUSStatesTable() {
  logger.info('Generating US states table...')

  const items = log.filter(i => i.gid.startsWith('us-'))
  let rows = []
  for (const item of items) {
    const code = item.gid.toUpperCase()
    const state = states[code]

    rows.push({
      name: state.name,
      channels: item.count,
      epg: `<code>https://iptv-org.github.io/epg/guides/${item.gid}/${item.site}.epg.xml</code>`,
      status: statuses[item.status]
    })
  }

  rows = _.orderBy(rows, ['name', 'channels'], ['asc', 'desc'])
  rows = _.groupBy(rows, 'name')

  const table = markdown.createTable(rows, ['State', 'Channels', 'EPG', 'Status'])

  await file.create('./.readme/_us-states.md', table)
}

async function generateCanadaProvincesTable() {
  logger.info('Generating Canada provinces table...')

  const items = log.filter(i => i.gid.startsWith('ca-'))
  let rows = []
  for (const item of items) {
    const code = item.gid.toUpperCase()
    const province = provinces[code]

    rows.push({
      name: province.name,
      channels: item.count,
      epg: `<code>https://iptv-org.github.io/epg/guides/${item.gid}/${item.site}.epg.xml</code>`,
      status: statuses[item.status]
    })
  }

  rows = _.orderBy(rows, ['name', 'channels'], ['asc', 'desc'])
  rows = _.groupBy(rows, 'name')

  const table = markdown.createTable(rows, ['Province', 'Channels', 'EPG', 'Status'])

  await file.create('./.readme/_ca-provinces.md', table)
}

async function updateReadme() {
  logger.info('Updating README.md...')

  const config = require(file.resolve(options.config))
  await file.createDir(file.dirname(config.build))
  await markdown.compile(options.config)
}

async function setUp() {
  log = await parser.parseLogs(`${LOGS_DIR}/update-guides.log`)
}
