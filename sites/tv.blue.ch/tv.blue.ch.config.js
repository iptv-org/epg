const axios = require('axios')
const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

module.exports = {
  site: 'tv.blue.ch',
  days: 2,
  url: function ({ channel, date }) {
    return `https://services.sg101.prd.sctv.ch/catalog/tv/channels/list/(ids=${
      channel.site_id
    };start=${date.format('YYYYMMDDHHss')};end=${date
      .add(1, 'd')
      .format('YYYYMMDDHHss')};level=normal)`
  },
  parser: function ({ content }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const title = parseTitle(item)
      if (title === 'Sendepause') return
      programs.push({
        title,
        description: parseDescription(item),
        icon: parseIcon(item),
        start: parseStart(item),
        stop: parseStop(item)
      })
    })

    return programs
  },
  async channels() {
    const items = await axios
      .get(`https://services.sg101.prd.sctv.ch/portfolio/tv/channels`)
      .then(r => r.data)
      .catch(console.log)

    return items.map(item => {
      return {
        lang: item.Languages[0] || 'de',
        site_id: item.Identifier,
        name: item.Title
      }
    })
  }
}

function parseTitle(item) {
  return item.Content.Description.Title
}

function parseDescription(item) {
  return item.Content.Description.Summary
}

function parseIcon(item) {
  const image = item.Content.Nodes ? item.Content.Nodes.Items.find(i => i.Kind === 'Image') : null
  const path = image ? image.ContentPath : null

  return path ? `https://services.sg101.prd.sctv.ch/content/images${path}_w1920.webp` : null
}

function parseStart(item) {
  const available = item.Availabilities.length ? item.Availabilities[0] : null

  return dayjs(available.AvailabilityStart)
}

function parseStop(item) {
  const available = item.Availabilities.length ? item.Availabilities[0] : null

  return dayjs(available.AvailabilityEnd)
}

function parseItems(content) {
  const data = JSON.parse(content)
  const nodes = data.Nodes.Items.filter(i => i.Kind === 'Channel')
  if (!nodes.length) return []

  return nodes[0].Content.Nodes && Array.isArray(nodes[0].Content.Nodes.Items)
    ? nodes[0].Content.Nodes.Items.filter(i => i.Kind === 'Broadcast')
    : []
}
