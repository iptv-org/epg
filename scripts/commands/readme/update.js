const { file, markdown, parser, logger, api, table } = require('../../core')
const { program } = require('commander')
const langs = require('langs')
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
  let files = log.reduce((acc, curr) => {
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

  let groups = {}
  for (const filename in files) {
    const item = files[filename]
    const lang = langs.where('1', item.lang)

    if (!lang) continue

    if (!groups[lang.name]) groups[lang.name] = { lang: lang.name, data: [] }

    groups[lang.name].data.push([
      `<a href="https://${item.site}">${item.site}</a>`,
      item.channels,
      `<code>https://iptv-org.github.io/epg/guides/${filename}.xml</code>`,
      `<a href="https://github.com/iptv-org/epg/actions/workflows/${item.site}.yml"><img src="https://github.com/iptv-org/epg/actions/workflows/${item.site}.yml/badge.svg" alt="${item.site}" style="max-width: 100%;"></a>`
    ])
  }

  groups = _.sortBy(Object.values(groups), 'lang')

  let guides = ''
  for (let group of groups) {
    let lang = group.lang
    let data = group.data

    data = _.orderBy(data, [item => item[0], item => item[1]], ['asc', 'desc'])
    data = Object.values(_.groupBy(data, item => item[0]))

    guides += `### ${lang}\r\n\r\n`
    guides += table.create(data, [
      'Site&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
      'Channels',
      'EPG&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
      'Status&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'
    ])
    guides += `\r\n\r\n`
  }
  await file.create('./.readme/_guides.md', guides)
}

async function updateReadme() {
  logger.info('updating readme.md...')

  const config = require(file.resolve(options.config))
  await file.createDir(file.dirname(config.build))
  await markdown.compile(options.config)
}
