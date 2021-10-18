const countries = require('./countries.json')
const file = require('./file.js')
const parser = require('epg-parser')

async function main() {
  console.log('Starting...')

  const files = await file.list('.gh-pages/guides/**/*.xml')

  let codes = {}
  for (const filename of files) {
    const url = filename.replace('.gh-pages', 'https://iptv-org.github.io/epg')
    const epg = file.read(filename)
    const parsed = parser.parse(epg)
    parsed.channels.forEach(channel => {
      if (!codes[channel.id]) {
        codes[channel.id] = {
          tvg_id: channel.id,
          display_name: channel.name[0].value,
          logo: channel.icon[0],
          country: channel.id.split('.')[1],
          guides: [url]
        }
      } else {
        codes[channel.id].guides.push(url)
      }
    })
  }

  const sorted = Object.values(codes).sort((a, b) => {
    if (a.display_name.toLowerCase() < b.display_name.toLowerCase()) return -1
    if (a.display_name.toLowerCase() > b.display_name.toLowerCase()) return 1
    return 0
  })
  console.log(`Saving '.gh-pages/codes.json'...`)
  file.write('.gh-pages/codes.json', JSON.stringify(sorted))

  const _items = {}
  Object.values(countries).forEach(country => {
    _items[country.code] = {
      flag: country.flag,
      name: country.name,
      code: country.code,
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
  console.log(`Saving '.gh-pages/items.json'...`)
  file.write('.gh-pages/items.json', JSON.stringify(_items))

  console.log('Done')
}

main()
