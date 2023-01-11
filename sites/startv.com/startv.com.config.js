const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

const API_ENDPOINT = 'https://www.startv.com/umbraco/api/startvguideproxy'

module.exports = {
  site: 'startv.com',
  days: 2,
  skip: true, // REASON: Request failed with status code 405
  url: `${API_ENDPOINT}/GetTvGuideSchedule`,
  request: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=UTF-8'
    },
    data({ channel, date }) {
      return {
        Channels: channel.site_id,
        Start: date.format('YYYYMMDDHHmm'),
        Stop: date.add(1, 'd').format('YYYYMMDDHHmm')
      }
    }
  },
  parser: function ({ content, channel }) {
    let programs = []
    const items = parseItems(content, channel)
    items.forEach(item => {
      programs.push({
        title: item.title,
        description: item.desc,
        icon: item.programmeurl,
        category: item.subgenre,
        start: parseStart(item),
        stop: parseStop(item)
      })
    })

    return programs
  },
  async channels() {
    const data = await axios
      .post(
        `${API_ENDPOINT}/GetChannelResult`,
        { Genre: 'All Channels' },
        {
          headers: {
            'Content-Type': 'application/json; charset=UTF-8'
          }
        }
      )
      .then(r => JSON.parse(r.data))
      .catch(console.log)

    const channels = data.channelsbygenreandlanguage.channellist.channelnames.split(',')
    return channels.map(item => {
      return {
        lang: 'hi',
        site_id: item,
        name: item
      }
    })
  }
}

function parseStart(item) {
  return dayjs.tz(item.start, 'YYYYMMDDHHmm', 'Asia/Kolkata')
}

function parseStop(item) {
  return dayjs.tz(item.stop, 'YYYYMMDDHHmm', 'Asia/Kolkata')
}

function parseItems(content, channel) {
  if (!content.length) return []
  const json = JSON.parse(content)
  if (!json.length) return []
  const data = JSON.parse(json)
  if (!data || !data.ScheduleGrid || !Array.isArray(data.ScheduleGrid.channel)) return []
  const channelData = data.ScheduleGrid.channel.find(c => c.channeldisplayname === channel.site_id)

  return channelData && Array.isArray(channelData.programme) ? channelData.programme : []
}
