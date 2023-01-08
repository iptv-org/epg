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

  await createCountriesTable(log)
  await createSourcesTable(log)

  await updateReadme()
}

main()

async function createSourcesTable(log) {
  let files = log
    .filter(c => c.groupedBy === 'site+lang')
    .reduce((acc, curr) => {
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
      `<code>https://iptv-org.github.io/epg/guides/${filename}.xml</code>`
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

  const output = table.create(data, ['Site', 'Channels', 'EPG'])

  await file.create('./.readme/_sources.md', output)
}

async function createCountriesTable(log) {
  let files = log
    .filter(c => c.groupedBy === 'country')
    .reduce((acc, curr) => {
      if (!acc[curr.filename]) {
        acc[curr.filename] = {
          country: curr.country,
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
    const country = api.countries.find({ code: item.country })
    if (!country) continue

    data.push([
      country.name,
      item.lang,
      `${country.flag}&nbsp;${country.name}`,
      item.channels,
      `<code>https://iptv-org.github.io/epg/guides/${filename}.xml</code>`
    ])
  }

  data = _.orderBy(
    data,
    [item => item[0], item => (item[1] === 'en' ? Infinity : item[3])],
    ['asc', 'desc']
  )
  data = data.map(i => {
    i.splice(0, 2)
    return i
  })
  data = Object.values(_.groupBy(data, item => item[0]))

  const output = table.create(data, ['Country', 'Channels', 'EPG'])

  await file.create('./.readme/_countries.md', output)
}

async function updateReadme() {
  logger.info('updating readme.md...')

  const config = require(file.resolve(options.config))
  await file.createDir(file.dirname(config.build))
  await markdown.compile(options.config)
}
