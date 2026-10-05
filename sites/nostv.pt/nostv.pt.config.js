const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

const headers = {
  'accept': 'application/json, text/plain, */*',
  'accept-language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7,pt;q=0.6,cs;q=0.5',
  'cache-control': 'no-cache',
  'origin': 'https://nostv.pt',
  'pragma': 'no-cache',
  'priority': 'u=1, i',
  'referer': 'https://nostv.pt/',
  'sec-ch-ua': '"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"',
  'sec-ch-ua-mobile': '?1',
  'sec-ch-ua-platform': '"Android"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'cross-site',
  'user-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36',
  'x-apikey': 'xe1dgrShwdR1DVOKGmsj8Ut4QLlGyOFI',
  'x-core-appversion': '2.20.2.2',
  'x-core-contentratinglimit': '0',
  'x-core-deviceid': '',
  'x-core-devicetype': 'web',
  'x-core-timezoneoffset': '3600000'
}

module.exports = {
  site: 'nostv.pt',
  days: 2,
  url({ channel, date }) {
    return `https://api.clg.nos.pt/nostv/ott/schedule/range/contents/guest?channels=${channel.site_id}&minDate=${date.format('YYYY-MM-DD')}T00:00:00Z&maxDate=${date.format('YYYY-MM-DD')}T23:59:59Z&isDateInclusive=true&client_id=${headers['x-apikey']}`
  },
  request: { headers },
  parser({ content }) {
    const programs = []
    if (content) {
      const items = Array.isArray(content) ? content : JSON.parse(content)
      items.forEach(item => {
        const image = item.Images
          ? `https://mage.stream.nos.pt/mage/v1/Images?sourceUri=${item.Images[0].Url}&profile=ott_1_452x340&client_id=${headers['x-apikey']}`
          : null
        programs.push({
          title: item.Metadata?.Title,
          sub_title: item.Metadata?.SubTitle ? item.Metadata?.SubTitle : null,
          description: item.Metadata?.Description,
          season: item.Metadata?.Season,
          episode: item.Metadata?.Episode,
          icon: {
            src: image
          },
          image,
          start: dayjs.utc(item.UtcDateTimeStart),
          stop: dayjs.utc(item.UtcDateTimeEnd)
        })
      })
    }

    return programs
  },
  async channels() {
    const result = await axios
      .get(
        `https://api.clg.nos.pt/nostv/ott/channels/guest?client_id=${headers['x-apikey']}`,
        { headers }
      )
      .then(r => r.data)
      .catch(console.error)

    return result.map(item => {
      return {
        lang: 'pt',
        site_id: item.ServiceId,
        name: item.Name
      }
    })
  }
}
