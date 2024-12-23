const dayjs = require('dayjs')
const cheerio = require('cheerio')

module.exports = {
  site: 'sporttv.pt',
  days: 2,
  url: 'https://www.sporttv.pt/guia',
  parser({ content, date, channel }) {
    let programs = []
    const items = parseItems(content, channel, date)
    items.forEach(item => {
      const start = dayjs(item.data)
      const stop = start.add(item.duracao, 'ms')

      programs.push({
        title: item.descricao,
        description: item?.evento?.nome,
        image: item.imagem,
        category: item?.modalidade?.nomeModalidade,
        start,
        stop
      })
    })

    return programs
  }
}

function parseItems(content, channel, date) {
  const $ = cheerio.load(content)
  const nuxtData = $('#__NUXT_DATA__').html()
  if (!nuxtData) return []
  const parsed = JSON.parse(nuxtData)
  const dataIndex = parsed[1].data
  const epgIndex = Object.values(parsed[dataIndex])[3] // 1611
  const epg = parsed[epgIndex].map(i => parsed[i]).map(obj => dataMapper(obj, parsed))
  if (!Array.isArray(epg)) return []

  return epg
    .filter(
      item => item.canal.id === parseInt(channel.site_id) && date.isSame(dayjs(item.data), 'd')
    )
    .sort((a, b) => {
      if (a < b) return -1
      if (a > b) return 1
      return 0
    })
}

function dataMapper(object, parsed) {
  let output = {}

  for (let key in object) {
    const value = parsed[object[key]]
    if (typeof value === 'object') {
      output[key] = dataMapper(value, parsed)
    } else {
      output[key] = value
    }
  }

  return output
}
