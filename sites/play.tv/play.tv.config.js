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
      // The video hanging off a programme is whichever episode of that series the catalogue holds
      // now, which is often not the one being broadcast. latestVideo is the site's own answer: it
      // is what makes it offer "bekijk online" rather than "vorige aflevering". The still comes
      // out of the same video, so it goes the same way.
      const video = program.latestVideo ? program.video?.data : null
      const start = dayjs.unix(Number(program.timestamp)).utc()
      const stop = start.add(Number(program.duration), 'second')

      return {
        title: program.programTitle,
        subTitle: program.episodeTitle || null,
        description: program.contentEpisode || program.programConcept || null,
        category: program.genre || null,
        season: program.season ? Number(program.season) : null,
        episode: program.episodeNr ? Number(program.episodeNr) : null,
        image: video ? item.programVideoImage || video.images?.default || null : null,
        url: buildUrls(video?.path, program.video?.data?.path),
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

// The episode that airs, and the programme it belongs to beside it as <url system="program">.
//
// The programme slug is the second segment of any of its videos' paths, so unlike the episode link
// this one is not gated on latestVideo: when the catalogue holds another episode of the series the
// episode is wrong but the programme is not. Checked against play's own page api over 43
// broadcasts carrying a programme uuid, the derived url named the broadcast's programme every
// time, latestVideo or not — and it reaches 44 of 60 broadcasts where the episode link reaches 33.
//
// A film's path stops at that segment: /video/v-for-vendetta, not /video/<program>/<season>/<ep>.
function buildUrls(videoPath, programVideoPath) {
  const urls = []
  if (videoPath) urls.push({ system: 'episode', value: `${siteUrl}${videoPath}` })

  const slug = (programVideoPath || '').match(/^\/video\/([^/]+)(?:\/|$)/)
  if (slug) urls.push({ system: 'program', value: `${siteUrl}/${slug[1]}` })

  return urls
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

