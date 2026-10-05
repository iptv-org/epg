const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(customParseFormat)
dayjs.extend(timezone)

module.exports = {
  site: 'mediasetinfinity.mediaset.it',
  days: 2,
  url: function ({ date, channel }) {
    // Get the epoch timestamp
    const todayEpoch = date.startOf('day').utc().valueOf()
    // Get the epoch timestamp for the next day
    const nextDayEpoch = date.add(1, 'day').startOf('day').utc().valueOf()
    return `https://api-ott-prod-fe.mediaset.net/PROD/play/feed/allListingFeedEpg/v2.0?byListingTime=${todayEpoch}~${nextDayEpoch}&byCallSign=${channel.site_id}`
  },
  parser: function ({ content }) {
    const programs = []
    const data = JSON.parse(content)

    if (
      !data.response ||
      !data.response.entries ||
      !data.response.entries[0] ||
      !data.response.entries[0].listings
    ) {
      // If the structure is not as expected, return an empty array
      return programs
    }

    const listings = data.response.entries[0].listings

    listings.forEach(listing => {
      const title = listing.mediasetlisting$epgTitle
      const subTitle = listing.program.title
      const season = parseSeason(listing)
      const episode = parseEpisode(listing)

      if (listing.program.title && listing.startTime && listing.endTime) {
        programs.push({
          title: title || subTitle,
          sub_title: title && title != subTitle ? subTitle : null,
          description: listing.program.description || null,
          category: listing.program.mediasetprogram$skyGenre || null,
          season: episode && !season ? '0' : season,
          episode: episode,
          start: parseTime(listing.startTime),
          stop: parseTime(listing.endTime),
          image: getMaxResolutionThumbnails(listing)
        })
      }
    })

    return programs
  }
}

function parseTime(timestamp) {
  return dayjs(timestamp).utc().format('YYYY-MM-DD HH:mm')
}

function parseSeason(item) {
  if (!item.mediasetlisting$shortDescription) return null
  const season = item.mediasetlisting$shortDescription.match(/S(\d+)\s/)
  return season ? season[1] : null
}

function parseEpisode(item) {
  if (!item.mediasetlisting$shortDescription) return null
  const episode = item.mediasetlisting$shortDescription.match(/Ep(\d+)\s/)
  return episode ? episode[1] : null
}

function getMaxResolutionThumbnails(item) {
  const thumbnails = item.program.thumbnails || null
  const maxResolutionThumbnails = {}

  for (const key in thumbnails) {
    const type = key.split('-')[0] // Estrarre il tipo di thumbnail
    const { width, height, url, title } = thumbnails[key]

    if (
      !maxResolutionThumbnails[type] ||
      width * height > maxResolutionThumbnails[type].width * maxResolutionThumbnails[type].height
    ) {
      maxResolutionThumbnails[type] = { width, height, url, title }
    }
  }
  if (maxResolutionThumbnails.image_keyframe_poster)
    return maxResolutionThumbnails.image_keyframe_poster.url
  else if (maxResolutionThumbnails.image_header_poster)
    return maxResolutionThumbnails.image_header_poster.url
  else return null
}
