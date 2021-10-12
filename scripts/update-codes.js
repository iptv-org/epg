const fs = require('fs')
const path = require('path')
const convert = require('xml-js')
const axios = require('axios')
const countries = require('./countries.json')
const file = require('./file.js')

async function main() {
  console.log('Starting...')

  const files = await file.list('.gh-pages/guides/**/*.xml')

  let codes = {}
  for (const filename of files) {
    const url = filename.replace('.gh-pages', 'https://iptv-org.github.io/epg')
    const channels = parseChannels(file.read(filename))
    channels.forEach(channel => {
      if (!codes[channel.tvg_id]) {
        channel.guides = [url]
        codes[channel.tvg_id] = channel
      } else {
        codes[channel.tvg_id].guides.push(url)
      }
    })
  }

  const sorted = Object.values(codes).sort((a, b) => {
    if (a.display_name.toLowerCase() < b.display_name.toLowerCase()) return -1
    if (a.display_name.toLowerCase() > b.display_name.toLowerCase()) return 1
    return 0
  })
  writeToFile('.gh-pages/codes.json', convertToJSON(sorted))

  const _items = {}
  countries.forEach(country => {
    _items[country.code] = {
      ...country,
      expanded: false,
      channels: []
    }
  })

  sorted.forEach(channel => {
    const item = _items[channel.country]
    if (item) {
      channel.hash = `${channel.display_name}:${channel.tvg_id}`.toLowerCase()
      item.channels.push(channel)
    }
  })
  writeToFile('.gh-pages/items.json', convertToJSON(_items))

  console.log('Done')
}

function writeToFile(filename, data) {
  console.log(`Saving all codes to '${filename}'...`)
  const dir = path.resolve(path.dirname(filename))
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  fs.writeFileSync(path.resolve(filename), data)
}

function convertToJSON(arr) {
  return JSON.stringify(arr)
}

function parseChannels(xml) {
  const result = convert.xml2js(xml)
  const tv = result.elements.find(el => el.name === 'tv')

  return tv.elements
    .filter(el => el.name === 'channel')
    .map(channel => {
      const tvg_id = (channel.attributes || { id: '' }).id
      const logo = (channel.elements.find(el => el.name === 'icon') || { attributes: { src: '' } })
        .attributes.src
      const displayName = channel.elements.find(el => el.name === 'display-name')
      const display_name = displayName
        ? displayName.elements.find(el => el.type === 'text').text
        : null
      const country = tvg_id.split('.')[1]

      return { tvg_id, display_name, logo, country }
    })
}

main()
