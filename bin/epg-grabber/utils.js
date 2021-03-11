const fs = require('fs')
const path = require('path')
const convert = require('xml-js')
const dayjs = require('dayjs')
const glob = require('glob')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
dayjs.extend(utc)
dayjs.extend(timezone)

const utils = {}
utils.escapeString = function (string) {
  return string
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/\n|\r/g, ' ')
    .replace(/  +/g, ' ')
    .trim()
}

utils.convertToXMLTV = function ({ config, channels, programs }) {
  let output = '<?xml version="1.0" encoding="UTF-8" ?><tv>'

  for (let channel of channels) {
    const displayName = this.escapeString(channel.name)
    output += `
<channel id="${channel['xmltv_id']}"><display-name>${displayName}</display-name></channel>`
  }

  for (let program of programs) {
    if (!program) continue

    const start = program.start
      ? dayjs.tz(program.start, config.timezone).format('YYYYMMDDHHmmss ZZ')
      : ''
    const stop = program.stop
      ? dayjs.tz(program.stop, config.timezone).format('YYYYMMDDHHmmss ZZ')
      : ''
    const title = program.title ? this.escapeString(program.title) : ''
    const description = program.description ? this.escapeString(program.description) : ''
    const category = program.category ? this.escapeString(program.category) : ''
    const lang = program.lang ? program.lang : 'en'

    if (start && title) {
      output += `
<programme start="${start}"`

      if (stop) {
        output += ` stop="${stop}"`
      }

      output += ` channel="${program.channel}"><title lang="${lang}">${title}</title>`

      if (description) {
        output += `<desc lang="${lang}">${description}</desc>`
      }

      if (category) {
        output += `<category lang="${lang}">${category}</category>`
      }

      output += '</programme>'
    }
  }

  output += '\r\n</tv>'

  return output
}

utils.parseConfig = function (configPath) {
  const xml = fs.readFileSync(path.resolve(process.cwd(), configPath), {
    encoding: 'utf-8'
  })
  const result = convert.xml2js(xml)
  const settings = result.elements.find(el => el.name === 'settings')
  const filename = this.getElementText('filename', settings.elements)
  const days = this.getElementText('days', settings.elements)
  const userAgent = this.getElementText('user-agent', settings.elements)
  const timezone = this.getElementText('timezone', settings.elements)
  const cookie = this.getElementText('cookie', settings.elements)
  const channels = settings.elements
    .filter(el => el.name === 'channel')
    .map(el => {
      const channel = el.attributes
      channel.name = el.elements.find(el => el.type === 'text').text

      return channel
    })

  return {
    filename,
    days,
    userAgent,
    timezone,
    channels,
    cookie
  }
}

utils.getElementText = function (name, elements) {
  const el = elements.find(el => el.name === name)

  return el ? el.elements.find(el => el.type === 'text').text : null
}

utils.loadSites = function (sitesPath) {
  const sites = {}
  glob.sync(`${sitesPath}/*.js`).forEach(function (file) {
    const name = path.parse(file).name
    sites[name] = require(path.resolve(file))
  })

  return sites
}

utils.sleep = function (ms) {
  return function (x) {
    return new Promise(resolve => setTimeout(() => resolve(x), ms))
  }
}

utils.createDir = function (dir) {
  if (!fs.existsSync(path.resolve(__dirname, dir))) {
    fs.mkdirSync(path.resolve(__dirname, dir))
  }
}

utils.writeToFile = function (filename, data) {
  fs.writeFileSync(path.resolve(__dirname, filename), data)
}

module.exports = utils
