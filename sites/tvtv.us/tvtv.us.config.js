const dayjs = require('dayjs')

let cachedPrograms = {}

module.exports = {
  site: 'tvtv.us',
  days: 2,
  url({ date, channel }) {
    return `https://www.tvtv.us/api/v1/lineup/USA-NY71652-X/grid/${date.toJSON()}/${date
      .add(1, 'day')
      .toJSON()}/${channel.site_id}`
  },
  request: {
    headers: {
      Accept: '*/*',
      Connection: 'keep-alive',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
      'sec-ch-ua': '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"'
    }
  },
  async parser(ctx) {
    let programs = []
    let queue = []

    const items = parseItems(ctx.content)
    for (const item of items) {
      const start = dayjs(item.startTime)
      const stop = start.add(item.duration, 'minute')

      programs.push({
        id: item.programId,
        title: item.title,
        subtitle: item.subtitle || null,
        start,
        stop
      })

      // NOTE: This part of the code is commented out because loading additional data leads either to error 429 Too Many Requests or to even greater delays between requests.
      // if (item.programId && !cachedPrograms[item.programId]) {
      //   queue.push({
      //     programId: item.programId,
      //     url: `https://tvtv.us/api/v1/programs/${item.programId}`,
      //     httpAgent: ctx.request.agent,
      //     httpsAgent: ctx.request.agent,
      //     headers: module.exports.request.headers
      //   })
      // }
    }

    const axios = require('axios')
    for (const req of queue) {
      await wait(5000)

      const data = await axios(req)
        .then(r => r.data)
        .catch(console.error)

      if (!data || !data.title) continue

      cachedPrograms[req.programId] = data
    }

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
  return Array.isArray(data.ratings)
    ? data.ratings.map(rating => ({
        value: rating.code,
        system: rating.body
      }))
    : []
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

function wait(ms) {
  if (process.env.NODE_ENV === 'test') return

  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}
