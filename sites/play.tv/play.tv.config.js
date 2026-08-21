const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

const siteUrl = 'https://www.play.tv'
const nextFragmentPattern = /self\.__next_f\.push\(\[1,((?:"(?:\\.|[^"])*"))\]\)<\/script>/gs

module.exports = {
  site: 'play.tv',
  days: 2,
  request: {
    headers: {
      accept: 'text/html,application/xhtml+xml'
    }
  },
  url({ channel, date }) {
    return `${siteUrl}/tv-gids/${channel.site_id}/${date.format('YYYY-MM-DD')}`
  },
  parser({ content }) {
    if (!content) return []

    const items = parseProgramItems(content)
    if (!items.length) return []

    return items.map(item => {
      const program = item.program
      const path = program.video?.data?.path
      const start = dayjs.unix(Number(program.timestamp)).utc()
      const stop = start.add(Number(program.duration), 'second')

      return {
        title: program.programTitle,
        subTitle: program.episodeTitle || null,
        description: program.contentEpisode || program.programConcept || null,
        category: program.genre || null,
        season: program.season ? Number(program.season) : null,
        episode: program.episodeNr ? Number(program.episodeNr) : null,
        image: item.programVideoImage || program.video?.data?.images?.default || null,
        url: path ? `${siteUrl}${path}` : null,
        start,
        stop
      }
    })
  },
  async channels() {
    const data = await axios
      .get(`${siteUrl}/tv-gids`, module.exports.request)
      .then(r => r.data)
      .catch(() => '')

    return parseBrands(data).map(item => ({
      lang: 'nl',
      site_id: item.slug,
      name: item.label
    }))
  }
}

function parseBrands(content) {
  const fragments = extractNextFragments(content)
  const stream = fragments.join('')

  const index = stream.indexOf('"brands":[')
  if (index === -1) return []

  const startIndex = stream.indexOf('[', index)
  const arrayValue = extractBalancedValue(stream, startIndex, '[', ']')
  const brands = parseJsonValue(arrayValue)

  return Array.isArray(brands) ? brands : []
}

function parseProgramItems(content) {
  const fragments = extractNextFragments(content)
  const stream = fragments.join('')
  const programs = []

  let index = stream.indexOf('{"program":')

  while (index !== -1) {
    const objectValue = extractBalancedValue(stream, index, '{', '}')

    if (!objectValue) {
      index = stream.indexOf('{"program":', index + 1)
      continue
    }

    const programItem = parseJsonValue(objectValue)

    if (hasDuration(programItem) && programItem.program.programTitle) {
      programs.push(programItem)
    }

    index = stream.indexOf('{"program":', index + objectValue.length)
  }

  return programs.sort((left, right) => Number(left.program.timestamp) - Number(right.program.timestamp))
}

function extractNextFragments(content) {
  return Array.from(content.matchAll(nextFragmentPattern))
    .map(([, encodedFragment]) => {
      try {
        return JSON.parse(encodedFragment)
      } catch {
        return null
      }
    })
    .filter(Boolean)
}

function extractBalancedValue(content, startIndex, openChar, closeChar) {
  let depth = 0
  let escaped = false
  let insideString = false

  for (let index = startIndex; index < content.length; index++) {
    const character = content[index]

    if (escaped) {
      escaped = false
      continue
    }

    if (character === '\\') {
      escaped = true
      continue
    }

    if (character === '"') {
      insideString = !insideString
      continue
    }

    if (insideString) continue

    if (character === openChar) depth++
    if (character === closeChar) depth--

    if (depth === 0) return content.slice(startIndex, index + 1)
  }

  return ''
}

function parseJsonValue(value) {
  if (!value) return null

  try {
    return JSON.parse(value.replace(/"\$undefined"/g, 'null'))
  } catch {
    return null
  }
}

function hasDuration(programItem) {
  const title = programItem?.program?.programTitle || ''

  return Boolean(
    programItem?.program?.timestamp &&
      title &&
      !isPlaceholderTitle(title) &&
      Number(programItem.program.duration) > 0
  )
}

function isPlaceholderTitle(title) {
  return /^geen uitzending\b/i.test(title)
}

