const axios = require('axios')
const dayjs = require('dayjs')

let apiVersion

module.exports = {
  site: 'pickx.be',
  days: 2,
  async url({ channel, date }) {
    if (!apiVersion) {
      await fetchApiVersion()
    }

    return `https://px-epg.azureedge.net/airings/${apiVersion}/${date.format(
      'YYYY-MM-DD'
    )}/channel/${channel.site_id}?timezone=Europe%2FBrussels`
  },
  request: {
    headers: {
      Origin: 'https://www.pickx.be',
      Referer: 'https://www.pickx.be/'
    }
  },
  parser({ channel, content }) {
    const programs = []
    if (content) {
      const items = JSON.parse(content)
      items.forEach(item => {
        programs.push({
          title: item.program.title,
          sub_title: item.program.episodeTitle,
          description: item.program.description,
          category: item.program.translatedCategory?.[channel.lang]
            ? item.program.translatedCategory[channel.lang]
            : item.program.category.split('.')[1],
          image: item.program.posterFileName
            ? `https://experience-cache.proximustv.be/posterserver/poster/EPG/w-166_h-110/${item.program.posterFileName}`
            : null,
          season: item.program.seasonNumber,
          episode: item.program.episodeNumber,
          actors: item.program.actors,
          director: item.program.director ? [item.program.director] : null,
          start: dayjs(item.programScheduleStart),
          stop: dayjs(item.programScheduleEnd)
        })
      })
    }

    return programs
  },
  async channels() {
    let channels = []

    const query = {
      operationName: 'getChannels',
      variables: {
        language: 'fr',
        queryParams: {},
        id: '0',
        params: {
          shouldReadFromCache: true
        }
      },
      query: `query getChannels($language: String!, $queryParams: ChannelQueryParams, $id: String, $params: ChannelParams) {
        channels(language: $language, queryParams: $queryParams, id: $id, params: $params) {
          id
          name
          language
          radio
        }
      }`
    }

    const data = await axios
      .post('https://api.proximusmwc.be/tiams/v3/graphql', query)
      .then(r => r.data)
      .catch(console.error)

    data.data.channels.forEach(channel => {
      let lang = channel.language || 'fr'
      if (channel.language === 'ger') lang = 'de'

      channels.push({
        lang,
        site_id: channel.id,
        name: channel.name
      })
    })

    return channels
  }
}

async function fetchApiVersion() {
  const hashUrl = 'https://www.pickx.be/nl/televisie/tv-gids'
  const hashData = await axios
    .get(hashUrl)
    .then(r => {
      const re = /"hashes":\["(.*)"\]/
      const match = r.data.match(re)
      if (match && match[1]) {
        return match[1]
      } else {
        throw new Error('React app version hash not found')
      }
    })
    .catch(console.error)

  const versionUrl = `https://www.pickx.be/api/s-${hashData}`
  const response = await axios.get(versionUrl, {
    headers: {
      Origin: 'https://www.pickx.be',
      Referer: 'https://www.pickx.be/'
    }
  })

  return new Promise((resolve, reject) => {
    try {
      if (response.status === 200) {
        apiVersion = response.data.version
        resolve()
      } else {
        console.error(`Failed to fetch API version. Status: ${response.status}`)
        reject(`Failed to fetch API version. Status: ${response.status}`)
      }
    } catch (error) {
      console.error('Error during fetchApiVersion:', error)
      reject(error)
    }
  })
}
