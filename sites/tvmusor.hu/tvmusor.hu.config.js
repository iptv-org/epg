const axios = require('axios')
const dayjs = require('dayjs')
const uniqBy = require('lodash.uniqby')

module.exports = {
  site: 'tvmusor.hu',
  days: 2,
  url: 'https://tvmusor.borsonline.hu/a/get-events/',
  request: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    },
    data({ channel, date }) {
      const params = new URLSearchParams()
      params.append(
        'data',
        JSON.stringify({
          blocks: [`${channel.site_id}|${date.format('YYYY-MM-DD')}`]
        })
      )

      return params
    }
  },
  parser({ content, channel, date }) {
    let programs = []
    const items = parseItems(content, channel, date)
    items.forEach(item => {
      const prev = programs[programs.length - 1]
      let start = dayjs(item.e)
      let stop = dayjs(item.f)
      if (prev) {
        start = prev.stop
      }

      programs.push({
        title: item.j,
        category: item.h,
        description: item.c,
        image: parseImage(item),
        start,
        stop
      })
    })

    return programs
  },
  async channels() {
    const data = await axios
      .get('https://tvmusor.borsonline.hu/most/')
      .then(r => r.data)
      .catch(console.log)

    const [, channelData] = data.match(/const CHANNEL_DATA = (.*);/)
    const json = channelData.replace('},}', '}}').replace(/(\d+):/g, '"$1":')
    const channels = JSON.parse(json)

    return Object.values(channels).map(item => {
      return {
        lang: 'hu',
        site_id: item.id,
        name: item.name
      }
    })
  }
}

function parseImage(item) {
  return item.z ? `https://tvmusor.borsonline.hu/images/events/408/${item.z}` : null
}

function parseItems(content, channel, date) {
  const data = JSON.parse(content)
  if (!data || !data.data || !data.data.loadedBlocks) return []
  const blocks = data.data.loadedBlocks
  const blockId = `${channel.site_id}_${date.format('YYYY-MM-DD')}`
  if (!Array.isArray(blocks[blockId])) return []

  return uniqBy(uniqBy(blocks[blockId], a => a.e), b => b.b)
}
