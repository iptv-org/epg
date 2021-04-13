const fs = require('fs')
const glob = require('glob')
const path = require('path')
const convert = require('xml-js')

function main() {
  let codes = {}
  console.log('Starting...')
  glob('sites/**/*.xml', null, function (er, files) {
    files.forEach(filename => {
      const channels = parseChannels(filename)
      channels.forEach(channel => {
        if (!codes[channel.xmltv_id + channel.name]) {
          codes[channel.xmltv_id + channel.name] = {
            name: channel.name,
            code: channel.xmltv_id
          }
        }
      })
    })

    const sorted = Object.values(codes).sort((a, b) => {
      if (a.name.toLowerCase() < b.name.toLowerCase()) return -1
      if (a.name.toLowerCase() > b.name.toLowerCase()) return 1
      return 0
    })
    writeToFile('codes.csv', convertToCSV(sorted))
    console.log('Done')
  })
}

function writeToFile(filename, data) {
  console.log(`Saving all codes to '${filename}'...`)
  const dir = path.resolve(path.dirname(filename))
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  fs.writeFileSync(path.resolve(filename), data)
}

function convertToCSV(arr) {
  let string = 'Channel Name,EPG Code (tvg-id)\n'
  for (const item of arr) {
    string += `${item.name},${item.code}\n`
  }

  return string
}

function parseChannels(filename) {
  if (!filename) throw new Error('Path to [site].channels.xml is missing')
  console.log(`Loading '${filename}'...`)

  const xml = fs.readFileSync(path.resolve(filename), { encoding: 'utf-8' })
  const result = convert.xml2js(xml)
  const site = result.elements.find(el => el.name === 'site')
  const channels = site.elements.find(el => el.name === 'channels')

  return channels.elements
    .filter(el => el.name === 'channel')
    .map(el => {
      const channel = el.attributes
      channel.name = el.elements.find(el => el.type === 'text').text

      return channel
    })
}

main()
