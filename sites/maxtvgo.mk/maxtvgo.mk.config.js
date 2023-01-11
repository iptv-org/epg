const axios = require('axios')
const dayjs = require('dayjs')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)

module.exports = {
  site: 'maxtvgo.mk',
  days: 2,
  url: function ({ channel, date }) {
    return `https://prd-static-mkt.spectar.tv/rev-1636968171/client_api.php/epg/list/instance_id/1/language/mk/channel_id/${
      channel.site_id
    }/start/${date.format('YYYYMMDDHHmmss')}/stop/${date
      .add(1, 'd')
      .format('YYYYMMDDHHmmss')}/include_current/true/format/json`
  },
  parser: function ({ content }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
      programs.push({
        title: item.title,
        category: item.category,
        description: parseDescription(item),
        icon: parseIcon(item),
        start: parseStart(item),
        stop: parseStop(item)
      })
    })

    return programs
  },
  async channels({ country, lang }) {
    const channels = await axios
      .get(
        `https://prd-static-mkt.spectar.tv/rev-1636968171/client_api.php/channel/all/application_id/deep_blue/device_configuration/2/instance_id/1/language/mk/http_proto/https/format/json`
      )
      .then(r => r.data)
      .catch(console.log)

    return channels.map(item => {
      return {
        lang: 'mk',
        site_id: item.id,
        name: item.name
      }
    })
  }
}

function parseStart(item) {
  return dayjs(item['@attributes'].start, 'YYYYMMDDHHmmss ZZ')
}

function parseStop(item) {
  return dayjs(item['@attributes'].stop, 'YYYYMMDDHHmmss ZZ')
}

function parseDescription(item) {
  return typeof item.desc === 'string' ? item.desc : null
}

function parseIcon(item) {
  return item.icon['@attributes'].src
}

function parseItems(content, channel) {
  const data = JSON.parse(content)
  if (!data || !Array.isArray(data.programme)) return []

  return data.programme
}
