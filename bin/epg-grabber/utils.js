const fs = require('fs')
const path = require('path')
const convert = require('xml-js')
const dayjs = require('dayjs')
const glob = require('glob')

const utils = {}
utils.convertToXMLTV = function ({ channels, programs }) {
  let output = '<?xml version="1.0" encoding="UTF-8" ?><tv>'

  for (let channel of channels) {
    output += `
<channel id="${channel['xmltv_id']}"><display-name>${channel.name}</display-name></channel>`
  }

  for (let program of programs) {
    const start = program.start ? dayjs(program.start).format('YYYYMMDDHHmmss ZZ') : null
    const stop = program.stop ? dayjs(program.stop).format('YYYYMMDDHHmmss ZZ') : null
    const title = program.title ? program.title.toString().trim().replace('&', '&amp;') : null
    const lang = program.lang ? program.lang : 'en'

    if (start && title) {
      output += `
<programme start="${start}" stop="${stop}" channel="${program.channel}"><title lang="${lang}">${title}</title>`

      if (program.category) {
        output += `<category lang="${lang}">${program.category}</category>`
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
    channels
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
