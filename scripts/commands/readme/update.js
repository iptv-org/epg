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
  let results = await parser.parseLogs(logPath)
  let files = results.reduce((acc, curr) => {
    if (acc[curr.filename]) {
      acc[curr.filename].channels++
    } else {
      acc[curr.filename] = {
        country: curr.country,
        channels: 1,
        filename: curr.filename
      }
    }

    return acc
  }, {})

  let data = []
  for (const filename in files) {
    const item = files[filename]
    const country = api.countries.find({ code: item.country })
    if (!country) continue

    data.push([
      country.name,
      `${country.flag}&nbsp;${country.name}`,
      item.channels,
      `<code>https://iptv-org.github.io/epg/guides/${filename}.xml</code>`
    ])
  }

  data = _.orderBy(
    data,
    [item => item[0], item => (item[3].includes('_en') ? Infinity : item[2])],
    ['asc', 'desc']
  )
  data = data.map(i => {
    i.shift()
    return i
  })
  data = Object.values(_.groupBy(data, item => item[0]))

  const output = table.create(data, ['Country', 'Channels', 'EPG'])

  await file.create('./.readme/_countries.md', output)

  await updateReadme()
}

main()

async function updateReadme() {
  logger.info('updating readme.md...')

  const config = require(file.resolve(options.config))
  await file.createDir(file.dirname(config.build))
  await markdown.compile(options.config)
}
