const axios = require('axios')
const dayjs = require('dayjs')

module.exports = {
  site: 'go3.ee',
  days: 2,
  url({ channel, date }) {
    return `https://go3.ee/api/products/lives/programmes?liveId%5B%5D=${channel.site_id}&since=${date.format('YYYY-MM-DD')}T00%3A00%2B0000&till=${date.format('YYYY-MM-DD')}T23%3A59%2B0000&platform=BROWSER&lang=ET&tenant=OM_EE`
  },
  parser({ content }) {
    const items = parseItems(content)

    return items.map(item => {
      return {
        title: item.title,
        description: item.description,
        category: item.mainCategory?.title,
        images: parseImages(item),
        start: dayjs(item.since),
        stop: dayjs(item.till)
      }
    })
  },
  async channels() {
    const data = await axios
      .get('https://go3.ee/api/products/lives?platform=BROWSER&lang=ET&tenant=OM_EE')
      .then(r => r.data)
      .catch(console.error)

    return data.map(channel => {
      return {
        lang: 'et',
        name: channel.title,
        site_id: channel.id
      }
    })
  }
}

function parseImages(item) {
  if (!item.images || !Array.isArray(item.images['16x9'])) return []

  return item.images['16x9'].map(image => `https:${image.mainUrl}`)
}

function parseItems(content) {
  try {
    const data = JSON.parse(content)
    if (!Array.isArray(data)) return []

    return data
  } catch {
    return []
  }
}
