const { Command } = require('commander')
const { db } = require('../core')
const path = require('path')
const _ = require('lodash')
const fs = require('fs')

const program = new Command()
program
  .requiredOption('-c, --config <config>', 'Config file')
  .option('-s, --set [args...]', 'Set custom arguments', [])
  .option('-o, --output <output>', 'Output file')
  .parse(process.argv)

const options = program.opts()

async function main() {
  await db.channels.load()
  const config = require(path.resolve(options.config))
  const args = {}
  options.set.forEach(arg => {
    const [key, value] = arg.split(':')
    args[key] = value
  })
  let channels = config.channels(args)
  if (isPromise(channels)) {
    channels = await channels
  }
  channels = _.uniqBy(channels, 'site_id')

  for (const channel of channels) {
    const data = await db.channels
      .find({ site: config.site, site_id: channel.site_id.toString() })
      .limit(1)
    if (data.length) {
      const first = data[0]
      channel.xmltv_id = first.xmltv_id
      channel.name = first.name
    }
  }

  const xml = json2xml(channels, config.site)

  const dir = path.parse(options.config).dir
  const output = options.output || `${dir}/${config.site}.channels.xml`

  fs.writeFileSync(path.resolve(output), xml)

  console.log(`File '${output}' successfully saved`)
}

main()

function isPromise(promise) {
  return !!promise && typeof promise.then === 'function'
}

function json2xml(items, site) {
  let output = `<?xml version="1.0" encoding="UTF-8"?>\r\n<site site="${site}">\r\n  <channels>\r\n`

  items.forEach(channel => {
    const logo = channel.logo ? ` logo="${channel.logo}"` : ''
    const xmltv_id = channel.xmltv_id || ''
    const lang = channel.lang || ''
    const site_id = channel.site_id || ''
    output += `    <channel lang="${lang}" xmltv_id="${escapeString(
      xmltv_id
    )}" site_id="${site_id}"${logo}>${escapeString(channel.name)}</channel>\r\n`
  })

  output += `  </channels>\r\n</site>\r\n`

  return output
}

function escapeString(string, defaultValue = '') {
  if (!string) return defaultValue

  const regex = new RegExp(
    '((?:[\0-\x08\x0B\f\x0E-\x1F\uFFFD\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]))|([\\x7F-\\x84]|[\\x86-\\x9F]|[\\uFDD0-\\uFDEF]|(?:\\uD83F[\\uDFFE\\uDFFF])|(?:\\uD87F[\\uDF' +
      'FE\\uDFFF])|(?:\\uD8BF[\\uDFFE\\uDFFF])|(?:\\uD8FF[\\uDFFE\\uDFFF])|(?:\\uD93F[\\uDFFE\\uD' +
      'FFF])|(?:\\uD97F[\\uDFFE\\uDFFF])|(?:\\uD9BF[\\uDFFE\\uDFFF])|(?:\\uD9FF[\\uDFFE\\uDFFF])' +
      '|(?:\\uDA3F[\\uDFFE\\uDFFF])|(?:\\uDA7F[\\uDFFE\\uDFFF])|(?:\\uDABF[\\uDFFE\\uDFFF])|(?:\\' +
      'uDAFF[\\uDFFE\\uDFFF])|(?:\\uDB3F[\\uDFFE\\uDFFF])|(?:\\uDB7F[\\uDFFE\\uDFFF])|(?:\\uDBBF' +
      '[\\uDFFE\\uDFFF])|(?:\\uDBFF[\\uDFFE\\uDFFF])(?:[\\0-\\t\\x0B\\f\\x0E-\\u2027\\u202A-\\uD7FF\\' +
      'uE000-\\uFFFF]|[\\uD800-\\uDBFF][\\uDC00-\\uDFFF]|[\\uD800-\\uDBFF](?![\\uDC00-\\uDFFF])|' +
      '(?:[^\\uD800-\\uDBFF]|^)[\\uDC00-\\uDFFF]))',
    'g'
  )

  string = String(string || '').replace(regex, '')

  return string
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/\n|\r/g, ' ')
    .replace(/  +/g, ' ')
    .trim()
}

module.exports = { json2xml }
