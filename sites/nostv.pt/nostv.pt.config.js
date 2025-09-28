const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

const headers = {
  'X-Apikey': 'xe1dgrShwdR1DVOKGmsj8Ut4QLlGyOFI',
  'X-Core-Appversion': '2.20.0.3',
  'X-Core-Contentratinglimit': '0',
  'X-Core-Deviceid': '',
  'X-Core-Devicetype': 'web',
  Origin: 'https://nostv.pt',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

module.exports = {
  site: 'nostv.pt',
  days: 2,
  url({ channel, date }) {
    return `https://api.clg.nos.pt/nostv/ott/schedule/range/contents/guest?channels=${channel.site_id
      }&minDate=${date.format('YYYY-MM-DD')}T00:00:00Z&maxDate=${date.format(
        'YYYY-MM-DD'
      )}T23:59:59Z&isDateInclusive=true&client_id=${headers['X-Apikey']}`
  },
  request: { headers },
  parser({ content }) {
    const programs = []
    if (content) {
      const items = Array.isArray(content) ? content : JSON.parse(content)
      items.forEach(item => {
        const image = item.Images
          ? `https://mage.stream.nos.pt/mage/v1/Images?sourceUri=${item.Images[0].Url}&profile=ott_1_452x340&client_id=${headers['X-Apikey']}`
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
        `https://api.clg.nos.pt/nostv/ott/channels/guest?client_id=${headers['X-Apikey']}`,
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
