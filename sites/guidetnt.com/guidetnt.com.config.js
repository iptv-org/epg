const cheerio = require('cheerio')
const axios = require('axios')
const dayjs = require('dayjs')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
require('dayjs/locale/fr')

dayjs.extend(customParseFormat)
dayjs.extend(utc)
dayjs.extend(timezone)

const PARIS_TZ = 'Europe/Paris'

module.exports = {
  site: 'guidetnt.com',
  days: 2,
  url({ channel, date }) {
    const now = dayjs()
    const demain = now.add(1, 'd')
    if (date && date.isSame(demain, 'day')) {
      return `https://www.guidetnt.com/tv-demain/programme-${channel.site_id}`
    } else if (!date || date.isSame(now, 'day')) {
      return `https://www.guidetnt.com/tv/programme-${channel.site_id}`
    } else {
      return null
    }
  },
  async parser({ content, date }) {
    const programs = []
    const allItems = parseItems(content)
    const items = allItems?.rows
    const itemDate = allItems?.formattedDate
    for (const item of items) {
      const prev = programs[programs.length - 1]
      const $item = cheerio.load(item)
      const title = parseTitle($item)
      let start = parseStart($item, itemDate)

      if (!start || !title) return
      if (prev) {
        if (start.isBefore(prev.start)) {
          start = start.add(1, 'd')
          date = date.add(1, 'd')
        }
        prev.stop = start
      }
      let stop = start.add(30, 'm')

      let itemDetails = null
      let subTitle = null
      //let duration = null
      let country = null
      let productionDate = null
      let episode = null
      let season = null
      let category = parseCategory($item)
      let description = parseDescription($item)
      const itemDetailsURL = parseDescriptionURL($item)
      if (itemDetailsURL) {
        const url = 'https://www.guidetnt.com' + itemDetailsURL
        try {
          const response = await axios.get(url)
          itemDetails = parseItemDetails(response.data)
        } catch (err) {
          console.error(`Erreur lors du fetch des détails pour l'item: ${url}`, err)
        }

        const timeRange = parseTimeRange(itemDetails?.programHour, date.format('YYYY-MM-DD'))
        start = timeRange?.start
        stop = timeRange?.stop

        subTitle = itemDetails?.subTitle
        if (title == subTitle) subTitle = null
        description = itemDetails?.description

        const categoryDetails = parseCategoryText(itemDetails?.category)
        //duration = categoryDetails?.duration
        country = categoryDetails?.country
        productionDate = categoryDetails?.productionDate
        season = categoryDetails?.season
        episode = categoryDetails?.episode
      }
      // See https://www.npmjs.com/package/epg-parser for parameters
      programs.push({
        title,
        subTitle: subTitle,
        description: description,
        image: itemDetails?.image,
        category: category,
        directors: itemDetails?.directorActors?.Réalisateur,
        actors: itemDetails?.directorActors?.Acteur,
        country: country,
        date: productionDate,
        //duration: duration, // Tried with length: too, but does not work ! (stop-start is not accurate because of Ads)
        season: season,
        episode: episode,
        start,
        stop
      })
    }

    return programs
  },
  async channels() {
    const response = await axios.get('https://www.guidetnt.com')
    const channels = []
    const $ = cheerio.load(response.data)

    // Look inside each .tvlogo container
    $('.tvlogo').each((i, el) => {
      // Find all descendants that have an alt attribute
      $(el)
        .find('[alt]')
        .each((j, subEl) => {
          const alt = $(subEl).attr('alt')
          const href = $(subEl).attr('href')
          if (href && alt && alt.trim() !== '') {
            const name = alt.trim()
            const site_id = href.replace(/^\/tv\/programme-/, '')
            channels.push({
              lang: 'fr',
              name,
              site_id
            })
          }
        })
    })
    return channels
  }
}

function parseTimeRange(timeRange, baseDate) {
  // Split times
  const [startStr, endStr] = timeRange.split(' - ').map(s => s.trim())

  // Parse with base date
  const start = dayjs(`${baseDate} ${startStr}`, 'YYYY-MM-DD HH:mm')
  let end = dayjs(`${baseDate} ${endStr}`, 'YYYY-MM-DD HH:mm')

  // Handle possible day wrap (e.g., 23:30 - 00:15)
  if (end.isBefore(start)) {
    end = end.add(1, 'day')
  }

  // Calculate duration in minutes
  const diffMinutes = end.diff(start, 'minute')

  return {
    start: start.format(),
    stop: end.format(),
    duration: diffMinutes
  }
}

function parseItemDetails(itemDetails) {
  const $ = cheerio.load(itemDetails)

  const program = $('.program-wrapper').first()

  const programHour = program.find('.program-hour').text().trim()
  const programTitle = program.find('.program-title').text().trim()
  const programElementBold = program.find('.program-element-bold').text().trim()
  const programArea1 = program.find('.program-element.program-area-1').text().trim()

  let description = ''
  const programElements = $('.program-element').filter((i, el) => {
    const classAttr = $(el).attr('class')
    // Return true only if it is exactly "program-element" (no extra classes)
    return classAttr.trim() === 'program-element'
  })

  programElements.each((i, el) => {
    description += $(el).text().trim()
  })

  const area2Node = $('.program-area-2').first()
  const area2 = $(area2Node)
  const data = {}
  let currentLabel = null
  let texts = []

  area2.contents().each((i, node) => {
    if (node.type === 'tag' && node.name === 'strong') {
      // If we had collected some text for the previous label, save it
      if (currentLabel && texts.length) {
        data[currentLabel] = texts.join('').trim().replace(/,\s*$/, '') // Remove trailing comma
      }
      // New label - get text without colon
      currentLabel = $(node).text().replace(/:$/, '').trim()
      texts = []
    } else if (currentLabel) {
      // Append the text content (text node or others)
      if (node.type === 'text') {
        texts.push(node.data)
      } else if (node.type === 'tag' && node.name !== 'strong' && node.name !== 'br') {
        texts.push($(node).text())
      }
    }
  })

  // Save last label text
  if (currentLabel && texts.length) {
    data[currentLabel] = texts.join('').trim().replace(/,\s*$/, '')
  }

  const imgSrc = program.find('div[style*="float:left"]')?.find('img')?.attr('src') || null

  return {
    programHour,
    title: programTitle,
    subTitle: programElementBold,
    category: programArea1,
    description: description,
    directorActors: data,
    image: imgSrc
  }
}

function parseCategoryText(text) {
  if (!text) return null

  const parts = text
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
  const len = parts.length

  const category = parts[0] || null

  if (len < 3) {
    return {
      category: category,
      duration: null,
      country: null,
      productionDate: null,
      season: null,
      episode: null
    }
  }

  // Check last part: date if numeric
  const dateCandidate = parts[len - 1]
  const productionDate = /^\d{4}$/.test(dateCandidate) ? dateCandidate : null

  // Check for duration (first part containing "minutes")
  let durationMinute = null
  //let duration = null
  let episode = null
  let season = null
  let durationIndex = -1
  for (let i = 0; i < len; i++) {
    if (parts[i].toLowerCase().includes('minute')) {
      durationMinute = parts[i].trim()
      durationMinute = durationMinute.replace('minutes', '')
      durationMinute = durationMinute.replace('minute', '')
      //duration = [{ units: 'minutes', value: durationMinute }],
      durationIndex = i
    } else if (parts[i].toLowerCase().includes('épisode')) {
      const match = text.match(/épisode\s+(\d+)(?:\/(\d+))?/i)
      if (match) {
        episode = parseInt(match[1], 10)
      }
    } else if (parts[i].toLowerCase().includes('saison')) {
      season = parts[i].replace('saison', '').trim()
    }
  }

  // Country: second to last
  const countryIndex = len - 2
  let country = durationIndex === countryIndex ? null : parts[countryIndex]

  return {
    category,
    durationMinute,
    country,
    productionDate,
    season,
    episode
  }
}

function parseTitle($item) {
  return $item('.channel-programs-title a').text().trim()
}

function parseDescription($item) {
  return $item('#descr').text().trim() || null
}

function parseDescriptionURL($item) {
  const descrLink = $item('#descr a')
  return descrLink.attr('href') || null
}

function parseCategory($item) {
  let type = null
  $item('.channel-programs-title span').each((i, span) => {
    const className = $item(span).attr('class')
    if (className && className.startsWith('text_bg')) {
      type = $item(span).text().trim()
    }
  })
  return type
}

function parseStart($item, itemDate) {
  const dt = $item('.channel-programs-time a').text().trim()
  if (!dt) return null

  const datetimeStr = `${itemDate} ${dt}`
  return dayjs.tz(datetimeStr, 'YYYY-MM-DD HH:mm', PARIS_TZ)
}

function parseItems(content) {
  const $ = cheerio.load(content)

  // Extract header information
  const logoSrc = $('#logo img').attr('src')
  const title = $('#title h1').text().trim()
  const subtitle = $('#subtitle').text().trim()
  const dateMatch = subtitle.match(/(\d{1,2} \w+ \d{4})/)
  const dateStr = dateMatch ? dateMatch[1].toLowerCase() : null

  // Parse the French date string
  const parsedDate = dayjs(dateStr, 'D MMMM YYYY', 'fr')
  // Format it as YYYY-MM-DD
  const formattedDate = parsedDate.format('YYYY-MM-DD')

  const rows = $('.channel-row').toArray()

  return {
    rows,
    logoSrc,
    title,
    formattedDate
  }
}
