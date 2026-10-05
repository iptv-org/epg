const dayjs = require('dayjs')
const axios = require('axios')

module.exports = {
  site: 'sporttv.pt',
  days: 2,
  request: {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
      'X-Client-Platform': 'web',
      'X-Device-Platform': 'web'
    }
  },
  url({ date, channel }) {
    const startDate = date.format('DD/MM/YYYY%20HH:mm')
    const endDate = date.add(1, 'day').format('DD/MM/YYYY%20HH:mm')
    return `https://www.sporttv.pt/api/channels/epg?dataInicio=${startDate}&dataFim=${endDate}&tipoMedia=thumbnail&idCanal=${channel.site_id}`
  },
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
  },
  async channels() {
    let access = axios.get('https://www.sporttv.pt/api/channels/live', { headers: this.request.headers })

    let { data } = await access
    data = data.filter(item => item.id !== 0)
    return data.map(item_1 => ({
      site_id: item_1.id,
      name: item_1.nome,
      logo: item_1.logo_url
    }))
  }
}

function parseItems(content, channel, date) {
  if (!content) return []
  let json_data
  try {
    json_data = JSON.parse(content)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return []
  }
  if (!Array.isArray(json_data)) return []

  return json_data
    .filter(
      item => item.canal.id === parseInt(channel.site_id) && date.isSame(dayjs(item.data), 'd')
    )
    .sort((a, b) => {
      if (a < b) return -1
      if (a > b) return 1
      return 0
    })
}