const dayjs = require('dayjs')
const timezone = require('dayjs/plugin/timezone')
const utc = require('dayjs/plugin/utc')
const isBetween = require('dayjs/plugin/isBetween')

dayjs.extend(timezone)
dayjs.extend(utc)
dayjs.extend(isBetween)

module.exports = {
  site: 'zap2it.com',
  days: 2,
  url: 'https://tvlistings.gracenote.com/api/sslgrid',
  request: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
	  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
    },
    data({ date, channel }) {
      const [device, lineupId, headendId, countryCode, postalCode, prgsvcid] = channel.site_id.split('/')

      const timestamp = dayjs(date).unix().toString()

      return {
        lineupId,
        IsSSLinkNavigation: 'true',
        timespan: '336',
        timestamp,
        prgsvcid,
        headendId,
        countryCode,
        postalCode,
        device,
        userId: '-',
        aid: 'orbebb',
        DSTUTCOffset: '-240',
        STDUTCOffset: '-300',
        DSTStart: '2025-03-09T02:00Z',
        DSTEnd: '2025-11-02T02:00Z',
        languagecode: 'en-us',
      }
    },
  },
  parser: function ({ content, date }) {
    const data = JSON.parse(content)
    const programs = []

    Object.keys(data).forEach(dateKey => {
      data[dateKey].forEach(item => {
        programs.push({
          title: item.program.title,
          subTitle: item.program.episodeTitle || '',
          description: item.program.shortDesc || '',
          genres: item.program.genres ? item.program.genres.map(genre => genre.name) : [],
          start: dayjs.unix(item.startTime).utc().format('YYYY-MM-DD HH:mm:ss'),
          stop: dayjs.unix(item.endTime).utc().format('YYYY-MM-DD HH:mm:ss'),
          icon: item.thumbnail ? `https://zap2it.tmsimg.com/assets/${item.thumbnail}.jpg` : '',
          rating: item.rating || '',
          season: item.program.season || '',
          episode: item.program.episode || '',
          date: item.program.releaseYear || '',
        })
      })
    })

    return programs.filter(p => dayjs(p.start).add(dayjs(p.start).utcOffset(), 'minute').isBetween(date.startOf('day').subtract(dayjs().utcOffset(), 'minute').utc(), 
    date.endOf('day').subtract(dayjs().utcOffset(), 'minute').utc(), 'second', '[]'))
  }
}