const dayjs = require('dayjs')
const doFetch = require('@ntlab/sfetch')

let cachedPrograms = {}

module.exports = {
  site: 'tvtv.us',
  days: 2,
  url({ date, channel }) {
    return `https://www.tvtv.us/api/v1/lineup/USA-NY71652-X/grid/${date.toJSON()}/${date
      .add(1, 'day')
      .toJSON()}/${channel.site_id}`
  },
  async parser({ content }) {
    let programs = []
    let queue = []

    const items = parseItems(content)
    items.forEach(item => {
      const start = dayjs(item.startTime)
      const stop = start.add(item.duration, 'minute')

      programs.push({
        id: item.programId,
        title: item.title,
        subtitle: item.subtitle || null,
        start,
        stop
      })

      if (item.programId && !cachedPrograms[item.programId]) {
        queue.push({
          programId: item.programId,
          url: `https://tvtv.us/api/v1/programs/${item.programId}`
        })
      }
    })

    await doFetch(queue, (req, data) => {
      if (!data || !data.title) return

      cachedPrograms[req.programId] = data
    })

    programs.forEach(program => {
      const data = cachedPrograms[program.id]

      if (!data) return

      program.description = data.description || null
      program.image = data.image ? `https://tvtv.us${data.image}` : null
      program.date = data.releaseYear ? data.releaseYear.toString() : null
      program.directors = data.directors
      program.categories = data.genres
      program.actors = parseActors(data)
      program.writers = parseWriters(data)
      program.producers = parseProducers(data)
      program.ratings = parseRatings(data)
      program.season = parseSeason(data)
      program.episode = parseEpisode(data)
    })

    return programs
  }
}

function parseEpisode(data) {
  if (!data?.seriesEpisode?.seasonEpisode) return null

  const [, episode] = data.seriesEpisode.seasonEpisode.match(/Episode (\d+)/) || [null, null]

  return episode ? parseInt(episode) : null
}

function parseSeason(data) {
  if (!data?.seriesEpisode?.seasonEpisode) return null

  const [, season] = data.seriesEpisode.seasonEpisode.match(/Season (\d+);/) || [null, null]

  return season ? parseInt(season) : null
}

function parseRatings(data) {
  return data.ratings.map(rating => ({
    value: rating.code,
    system: rating.body
  }))
}

function parseWriters(data) {
  return data.crew.filter(member => member.role.includes('Writer')).map(member => member.name)
}

function parseProducers(data) {
  return data.crew.filter(member => member.role.includes('Producer')).map(member => member.name)
}

function parseActors(data) {
  return data.cast.map(actor => {
    const guest = actor.role.includes('Guest Star') ? 'yes' : undefined
    const role = actor.role.replace(' - Guest Star', '')

    return {
      value: actor.name,
      role,
      guest
    }
  })
}

function parseItems(content) {
  try {
    const json = JSON.parse(content)
    if (!json.length) return []

    return json[0]
  } catch {
    return []
  }
}
