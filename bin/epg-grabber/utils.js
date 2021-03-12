const fs = require('fs')
const path = require('path')
const axios = require('axios')
const axiosCookieJarSupport = require('axios-cookiejar-support').default
const tough = require('tough-cookie')
const convert = require('xml-js')
const glob = require('glob')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.tz.setDefault('UTC')
axiosCookieJarSupport(axios)

const utils = {}
utils.loadConfig = function (file) {
  if (!file) throw new Error('Path to [site].config.js is missing')
  console.log(`Loading '${file}'...`)

  const configPath = path.resolve(process.cwd(), file)
  const config = require(configPath)
  const channelsPath = path.resolve(this.getDirectory(configPath), `${config.site}.channels.xml`)

  return Object.assign(
    {},
    {
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36 Edg/79.0.309.71',
      days: 1,
      cookie: '',
      lang: 'en',
      channels: channelsPath,
      delay: 3000
    },
    config
  )
}

utils.parseChannels = function (file) {
  if (!file) throw new Error('Path to [site].channels.xml is missing')
  console.log(`Loading '${file}'...`)

  const xml = fs.readFileSync(path.resolve(__dirname, file), {
    encoding: 'utf-8'
  })
  const result = convert.xml2js(xml)
  const site = result.elements.find(el => el.name === 'site')
  const channels = site.elements.find(el => el.name === 'channels')

  return channels.elements
    .filter(el => el.name === 'channel')
    .map(el => {
      const channel = el.attributes
      channel.name = el.elements.find(el => el.type === 'text').text
      channel.site = channel.site || site.attributes.site

      return channel
    })
}

utils.sleep = function (ms) {
  return function (x) {
    return new Promise(resolve => setTimeout(() => resolve(x), ms))
  }
}

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
  let output = `<?xml version="1.0" encoding="UTF-8" ?><tv>\r\n`

  for (let channel of channels) {
    const displayName = this.escapeString(channel.name)
    output += `<channel id="${channel['xmltv_id']}"><display-name>${displayName}</display-name></channel>\r\n`
  }

  for (let program of programs) {
    if (!program) continue

    const title = program.title ? this.escapeString(program.title) : ''
    const description = program.description ? this.escapeString(program.description) : ''
    const category = program.category ? this.escapeString(program.category) : ''
    const start = program.start ? dayjs(program.start).format('YYYYMMDDHHmmss ZZ') : ''
    const stop = program.stop ? dayjs(program.stop).format('YYYYMMDDHHmmss ZZ') : ''
    const lang = program.lang || config.lang

    if (start && title) {
      output += `<programme start="${start}"`

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

      output += '</programme>\r\n'
    }
  }

  output += '</tv>'

  return output
}

utils.getDirectory = function (file) {
  return path.dirname(file)
}

utils.createDir = function (dir) {
  if (!fs.existsSync(path.resolve(__dirname, dir))) {
    fs.mkdirSync(path.resolve(__dirname, dir))
  }
}

utils.writeToFile = function (filename, data) {
  fs.writeFileSync(path.resolve(__dirname, filename), data)
}

utils.createHttpClient = function (config) {
  return axios.create({
    headers: {
      'User-Agent': config.userAgent,
      Cookie: config.cookie
    },
    withCredentials: true,
    jar: new tough.CookieJar()
  })
}

utils.getUTCDate = function () {
  return dayjs.utc()
}

module.exports = utils
