const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)
dayjs.tz.setDefault('Europe/Paris')

// Because France is excellent at pointing hours, their programs ALL start at 5/6 am,
// so we need to keep track of the earlier day's program to get the midnight programming. How... odd.
module.exports = {
  site: 'france.tv',
  days: 2,
  url: function ({ channel, date }) {
    return `https://www.france.tv/api/epg/videos/?date=${date.format('YYYY-MM-DD')}&channel=${channel.site_id}`
  },
  parser: function ({ content, date }) {
    const programs = []
    let items = []
    
    try {
      items = JSON.parse(content)
    } catch {
      return programs
    }

    items.forEach(item => {
      const { start, stop } = parseDuration(date, item)
      if (!start.isValid() || !stop.isValid()) return
      // Can contain Season and Episode in title, but not always. If title is missing, skip the program
      if (!item?.content?.title) return

      let title = item.content.title
      let season = null
      let episode = null

      const seMatch = title.match(/\s*-?\s*S(\d+)\s+E(\d+)\s*-?\s*/)
      if (seMatch) {
      season = parseInt(seMatch[1])
      episode = parseInt(seMatch[2])
      title = title.replace(seMatch[0], ' ').replace(/^\s+/, '').replace(/\s+$/, '').trim()
      }

      const fullTitle = (item.content.titleLeading ? item.content.titleLeading + (title ? ' - ' : '') : '') + title

      programs.push({
      title: fullTitle,
      description: item.content.description,
      image: getImageUrl(item),
      icon: getImageUrl(item),
      start,
      stop,
      season: season,
      episode: episode,
      rating: item.content.csa
      })
    })

    return programs
  }
}

let reachedNextDay = false

function parseDuration(date, item) {
  const current_date = date.format('YYYY-MM-DD')
  const time = item.content?.broadcastBeginDate
  const duration = item.content?.duration // e.g. "11 min 45 s", "1 h 30 min", "30 min"

  if (!time) return { start: dayjs(null), stop: dayjs(null) }

  const timeParts = time.split('h')
  const hour = parseInt(timeParts[0])

  // Once we've seen programs and encounter 00h, mark as next day
  if (reachedNextDay) {
    return { start: dayjs(null), stop: dayjs(null) }
  }

  if (hour === 0) {
    reachedNextDay = true
    return { start: dayjs(null), stop: dayjs(null) }
  }

  let durationInSeconds = 0
  if (duration) {
    const durationParts = duration.split(' ')
    for (let i = 0; i < durationParts.length; i++) {
      const part = durationParts[i]
      if (part === 'h' && i > 0) {
        durationInSeconds += parseInt(durationParts[i - 1]) * 3600
      } else if (part === 'min' && i > 0) {
        durationInSeconds += parseInt(durationParts[i - 1]) * 60
      } else if (part === 's' && i > 0) {
        durationInSeconds += parseInt(durationParts[i - 1])
      }
    }
  }

  const start = dayjs.utc(`${current_date} ${timeParts[0]}:${timeParts[1]}`, 'YYYY-MM-DD HH:mm')
  const stop = start.add(durationInSeconds, 'second')
  return { start, stop }
}

function getImageUrl(item) {
  const url = item.content?.thumbnail?.x1
  return url
}
