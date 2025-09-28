const dayjs = require('dayjs')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const axios = require('axios')

dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'claro.com.br',
  url({ channel, date }) {
    return `https://programacao.claro.com.br/gatekeeper/exibicao/select?q=id_revel:(${
      channel.site_id
    })+AND+id_cidade:1&wt=json&rows=100000&start=0&sort=id_canal+asc,dh_inicio+asc&fl=dh_fim+dh_inicio+st_titulo+titulo+id_programa+id_canal+id_cidade&fq=dh_inicio:[${date.format(
      'YYYY-M-D[T]HH:mm:ss[Z]'
    )}+TO+${date.add(1, 'd').subtract(1, 'm').format('YYYY-M-D[T]HH:mm:ss[Z]')}]`
  },
  parser({ content }) {
    const items = parseItems(content)

    return items.map(item => {
      return {
        title: item.titulo,
        start: parseTime(item.dh_inicio),
        stop: parseTime(item.dh_fim)
      }
    })
  },
  async channels() {
    const data = await axios
      .get(
        'https://programacao.claro.com.br/gatekeeper/canal/select?q=id_cidade:1&rows=300&wt=json&sort=cn_canal+asc&fl=id_canal+st_canal+cn_canal+nome+url_imagem+id_cidade&fq=nome:*&fq=id_categoria:*'
      )
      .then(r => r.data)
      .catch(console.error)

    return data.response.docs.map(channel => {
      return {
        site_id: `${channel.id_cidade}_${channel.id_canal}`,
        name: channel.nome,
        lang: 'pt'
      }
    })
  }
}

function parseTime(time) {
  return dayjs.tz(time, 'YYYY-M-D[T]HH:mm[Z]', 'America/Sao_Paulo')
}

function parseItems(content) {
  try {
    const data = JSON.parse(content)
    if (!data || !data.response || !Array.isArray(data.response.docs)) return []
    return data.response.docs
  } catch {
    return []
  }
}
