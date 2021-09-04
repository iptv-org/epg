const fs = require('fs')
const glob = require('glob')
const path = require('path')
const convert = require('xml-js')
const axios = require('axios')

async function main() {
  let codes = {}
  console.log('Starting...')
  const files = [
    'telkussa.fi',
    'andorradifusio.ad',
    'mediaset.it',
    'znbc.co.zm',
    'hd-plus.de',
    'astro.com.my',
    'comteco.com.bo',
    'mi.tv',
    'meo.pt',
    'tvgid.ua',
    'm.tv.sms.cz',
    'cosmote.gr',
    'programetv.ro',
    'programtv.onet.pl',
    'digiturk.com.tr',
    'programme-tv.net',
    'programacion-tv.elpais.com',
    'guidatv.sky.it',
    'ontvtonight.com',
    'tv.yandex.ru',
    'tvtv.ca',
    'tvtv.us',
    'tv.lv',
    'elcinema.com',
    'maxtv.hrvatskitelekom.hr',
    'mncvision.id',
    'tvguide.com',
    'tvprofil.com'
  ]
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
  writeToFile('codes.json', convertToJSON(sorted))
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
  return JSON.stringify(arr, null, 2)
}

function convertToCSV(arr) {
  let string = 'display_name,tvg_id,country,logo\n'
  for (const item of arr) {
    string += `${item.display_name},${item.tvg_id},${item.country},${item.logo}\n`
  }

  return string
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

      return { tvg_id, logo, display_name, country }
    })
}

main()
