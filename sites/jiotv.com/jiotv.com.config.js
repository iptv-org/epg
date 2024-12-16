const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'jiotv.com',
  days: 1,
  url: function ({ channel }) {
    return `https://tsdevil.fun/testing/jtv-epg.php?channel_id=${channel.site_id}&offset=0`
  },
  request: {
    method: 'GET',
    headers: {
      Origin: 'https://www.jiotv.com',
      Referer: 'https://www.jiotv.com',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0'
    }
  },
  parser: function ({ content, channel }) {
    let programs = []
    const items = parseItems(content, channel)
    items.forEach(item => {
      programs.push({
        title: item.showname,
        description: item.episode_num ? item.description + ' E' + item.episode_num : item.description,
        image: 'https://jiotvimages.cdn.jio.com/dare_images/shows/700/-/' + item.episodePoster,
        start: parseStart(item),
        stop: parseStop(item)
      })
    })
    return programs
  },  
  async channels() {
    const items = await axios
      .get(
        'https://tsdevil.fun/testing/jtv-epg.php?langid=6&devicetype=phone&os=android&usertype=JIO&version=343',
        { 
          headers: {
            Origin: 'https://www.jiotv.com',
            Referer: 'https://www.jiotv.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0'
          } 
        }
      )
      .then(r => r.data.result)
      .catch(console.log)
    let channels = []
    items.forEach(item => {
      channels.push({
        lang: 'en',
        site_id: item.channel_id,
        name: item.channel_name,
        logo: 'https://jiotvimages.cdn.jio.com/dare_images/images/' + item.logoUrl
      })
    })
    return channels
  }
}

function parseStart(item) {
  return dayjs(item.startEpoch).utcOffset('+05:30')
}

function parseStop(item) {
  return dayjs(item.endEpoch).utcOffset('+05:30')
}

function parseItems(content, channel) {
  let data
  try {
    data = JSON.parse(content)
  } catch (err) {
    console.log('Content -' + content)
    return []
  }
  return data.epg ? data.epg : []
}
