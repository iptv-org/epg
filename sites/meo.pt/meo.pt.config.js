const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
dayjs.extend(utc)
dayjs.extend(timezone)

module.exports = {
  site: 'meo.pt',
  days: 2,
  url: function ({ channel, date }) {
    return `https://meogouser.apps.meo.pt/Services/GridTv/GridTv.svc/GetLiveChannelProgramsByDate?callLetter=${channel.site_id}&date=${date.format('YYYY-MM-DD')}&userAgent=IPTV_OFR_GTV`
  },
  request: {
    method: 'GET',
    headers: {
      'accept': '*/*',
      'accept-language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7,pt;q=0.6,cs;q=0.5',
      'cache-control': 'no-cache',
      'origin': 'https://www.meo.pt',
      'pragma': 'no-cache',
      'priority': 'u=1, i',
      'referer': 'https://www.meo.pt/',
      'sec-ch-ua': '"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"',
      'sec-ch-ua-mobile': '?1',
      'sec-ch-ua-platform': '"Android"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-site',
      'user-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36'
    }
  },
  async parser({ content, channel }) {
    let programs = []
    const items = parseItems(content)
    if (!items.length) return programs

    for (const item of items) {
      const start = dayjs.tz(item.StartDate, 'Europe/Lisbon').utc()
      const stop = dayjs.tz(item.EndDate, 'Europe/Lisbon').utc()

      const prog = {
        title: item.Title || 'Sem título',
        start,
        stop
      }

      if (item.Synopsis) {
        prog.description = item.Synopsis
      }

      // Construct image URL using the same logic as before if possible
      if (item.Title && channel.site_id) {
        const encodedTitle = encodeURIComponent(item.Title)
        const image = `https://cdn-er-images.online.meo.pt/eemstb/ImageHandler.ashx?chCallLetter=${channel.site_id}&progTitle=${encodedTitle}&profile=16_9&profileFallback=false&noFallback=true&appSource=PC_CHROME_PWA&width=1920&csf`
        prog.icon = { src: image }
        prog.image = image
      }

      programs.push(prog)
    }

    return programs
  },
  async channels() {
    const axios = require('axios')
    const data = await axios
      .get('https://meogouser.apps.meo.pt/Services/GridTv/GridTv.svc/GetContentsForChannels?userAgent=IPTV_OFR_GTV', {
        headers: {
          'accept': '*/*',
          'accept-language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7,pt;q=0.6,cs;q=0.5',
          'cache-control': 'no-cache',
          'origin': 'https://www.meo.pt',
          'pragma': 'no-cache',
          'priority': 'u=1, i',
          'referer': 'https://www.meo.pt/',
          'sec-ch-ua': '"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"',
          'sec-ch-ua-mobile': '?1',
          'sec-ch-ua-platform': '"Android"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-site',
          'user-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36'
        }
      })
      .then(r => r.data)
      .catch(console.log)

    return data.Result
      .map(item => {
        return {
          lang: 'pt',
          site_id: item.CallLetter,
          name: item.Title
        }
      })
      .filter(channel => channel.site_id)
  }
}

function parseItems(content) {
  if (!content) return []
  try {
    const data = typeof content === 'string' ? JSON.parse(content) : content
    return Array.isArray(data.Result) ? data.Result : []
  } catch {
    return []
  }
}
