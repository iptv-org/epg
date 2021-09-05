const fs = require('fs')
const path = require('path')
const convert = require('xml-js')
const axios = require('axios')
const countries = require('./countries.json')

async function main() {
  console.log('Starting...')

  let codes = {}
  for (const filename of files) {
    const url = `https://iptv-org.github.io/epg/guides/${filename}.guide.xml`
    console.log(`Loading '${url}'...`)
    const file = await axios
      .get(url)
      .then(r => r.data)
      .catch(console.log)
    const channels = parseChannels(file)
    channels.forEach(channel => {
      if (!codes[channel.tvg_id + channel.display_name]) {
        codes[channel.tvg_id + channel.display_name] = channel
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

function parseChannels(file) {
  const result = convert.xml2js(file)
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

const files = [
  'andorradifusio.ad',
  'astro.com.my',
  'comteco.com.bo',
  'cosmote.gr',
  'digiturk.com.tr',
  'elcinema.com',
  'guidatv.sky.it',
  'hd-plus.de',
  'm.tv.sms.cz',
  'maxtv.hrvatskitelekom.hr',
  'mediaset.it',
  'meo.pt',
  'mi.tv',
  'mncvision.id',
  'ontvtonight.com',
  'programacion-tv.elpais.com',
  'programetv.ro',
  'programme-tv.net',
  'programtv.onet.pl',
  'telkussa.fi',
  'tv.lv',
  'tv.yandex.ru',
  'tvgid.ua',
  'tvguide.com',
  'tvprofil.com',
  'tvtv.ca',
  'tvtv.us',
  'vidio.com',
  'znbc.co.zm'
]

main()
