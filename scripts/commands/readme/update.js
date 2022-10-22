const { file, markdown, parser, logger, api, table } = require('../../core')
const { program } = require('commander')
const _ = require('lodash')

const CHANNELS_PATH = process.env.CHANNELS_PATH || 'sites/**/*.channels.xml'

const options = program
  .option('-c, --config <config>', 'Set path to config file', '.readme/readme.json')
  .parse(process.argv)
  .opts()

async function main() {
  const items = []

  await api.countries.load().catch(console.error)
  const files = await file.list(CHANNELS_PATH).catch(console.error)
  for (const filepath of files) {
    try {
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
    } catch (err) {
      console.error(err)
      continue
    }
  }

  await generateCountriesTable(items)
  await updateReadme()
}

main()

async function generateCountriesTable(items = []) {
  logger.info('generating countries table...')

  let data = []
  for (const item of items) {
    const country = api.countries.find({ code: item.code.toUpperCase() })
    if (!country) continue

    data.push([
      country.name,
      `${country.flag}&nbsp;${country.name}`,
      item.count,
      `<code>https://iptv-org.github.io/epg/guides/${item.group}.epg.xml</code>`
    ])
  }

  data = _.orderBy(data, [item => item[0], item => item[2]], ['asc', 'desc'])
  data = data.map(i => {
    i.shift()
    return i
  })
  data = Object.values(_.groupBy(data, item => item[0]))

  const output = table.create(data, [
    'Country&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
    'Channels',
    'EPG'
  ])

  await file.create('./.readme/_countries.md', output)
}

async function updateReadme() {
  logger.info('updating readme.md...')

  const config = require(file.resolve(options.config))
  await file.createDir(file.dirname(config.build))
  await markdown.compile(options.config)
}
