const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(timezone)

module.exports = {
  site: 'rev.bs',
  days: 2,
  url: function ({ date }) {
    return `https://www.rev.bs/wp-content/uploads/tv-guide/${date.format('YYYY-MM-DD')}_0.json`
  },
  parser: async function ({ content, channel, date }) {
    const programs = []
    const items0 = parseItems(content, channel)
    if (!items0.length) return programs
    const items1 = parseItems(await loadNextItems(date, 1), channel)
    const items2 = parseItems(await loadNextItems(date, 2), channel)
    const items3 = parseItems(await loadNextItems(date, 3), channel)
    const unionBy = (key, ...arrays) => [...new Map(arrays.flat().map(item => [item[key], item])).values()];
    const items = unionBy('sid', items0, items1, items2, items3);
    items.forEach(item => {
      const start = parseStart(item, date)
      const stop = start.add(item.duration, 'm')
      programs.push({
        title: item.title,
        start,
        stop
      })
    })

    return programs
  }
}

async function loadNextItems(date, index) {
  const url = `https://www.rev.bs/wp-content/uploads/tv-guide/${date.format(
    'YYYY-MM-DD'
  )}_${index}.json`

  return axios
    .get(url, {
      responseType: 'arraybuffer'
    })
    .then(res => res.data.toString())
    .catch(console.log)
}

function parseStart(item, date) {
  const shift = parseInt(item.s)

  return dayjs.tz(date.add(shift, 'm').toString(), 'America/New_York')
}

function parseItems(content, channel) {
  let data
  try {
    data = JSON.parse(content)
  } catch (error) {
    return []
  }

  if (!data || data.status !== 'OK') return []

  return data.data.schedule[channel.site_id] || []
}
