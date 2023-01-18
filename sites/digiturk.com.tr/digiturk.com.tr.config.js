const _ = require('lodash')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(timezone)
// category list is not complete
// const categories = {
//   '00': 'Diğer',
//   E0: 'Romantik Komedi',
//   E1: 'Aksiyon',
//   E4: 'Macera',
//   E5: 'Dram',
//   E6: 'Fantastik',
//   E7: 'Komedi',
//   E8: 'Korku',
//   EB: 'Polisiye',
//   EF: 'Western',
//   FA: 'Macera',
//   FB: 'Yarışma',
//   FC: 'Eğlence',
//   F0: 'Reality-Show',
//   F2: 'Haberler',
//   F4: 'Belgesel',
//   F6: 'Eğitim',
//   F7: 'Sanat ve Kültür',
//   F9: 'Life Style'
// }

module.exports = {
  site: 'digiturk.com.tr',
  days: 2,
  url: function ({ date, channel }) {
    return `https://www.digiturk.com.tr/_Ajax/getBroadcast.aspx?channelNo=${channel.site_id}&date=${date.format('DD.MM.YYYY')}&tomorrow=false&primetime=false`
  },
  request: {
    method: 'GET',
    headers: {
      Referer: 'https://www.digiturk.com.tr/'
    }
  },
  parser: function ({ content }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
      programs.push({
        title: item.PName,
        // description: item.LongDescription,
        // category: parseCategory(item),
        start :parseTime(item.PStartTime),
        stop: parseTime(item.PEndTime)
      })
    })

    programs = _.sortBy(programs, 'start')

    return programs
  }
}


function parseTime(time){
  let timestamp = parseInt(time.replace('/Date(', '').replace('+0300)/', ''))
  return dayjs(timestamp)
}

// function parseCategory(item) {
//   return (item.PGenre) ? categories[item.PGenre] : null
// }

function parseItems(content) {
  if (!content) return []
  const data = JSON.parse(content)
  return (data && data.BChannels && data.BChannels[0].CPrograms) ? data.BChannels[0].CPrograms : []
}
