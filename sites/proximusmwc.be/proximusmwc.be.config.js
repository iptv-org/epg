const axios = require('axios')
const dayjs = require('dayjs')

module.exports = {
  site: 'proximusmwc.be',
  days: 2,
  skip: true, // site is not working (https://github.com/iptv-org/epg/runs/5505070902?check_suite_focus=true)
  url: 'https://api.proximusmwc.be/v2/graphql',
  request: {
    headers: {
      'Content-Type': 'application/json'
    },
    data({ channel, date }) {
      return {
        query:
          'query ($language: String!, $startTime: Int!, $endTime: Int!, $options: SchedulesByIntervalOptions) { schedulesByInterval(language: $language, startTime: $startTime, endTime: $endTime, options: $options) { trailId programReferenceNumber channelId title category startTime endTime image { key url __typename } parentalRating detailUrl grouped description shortDescription category categoryId subCategory links { episodeNumber id seasonId seasonName seriesId seriesTitle title type __typename } seriesId __typename }}',
        variables: {
          startTime: date.unix(),
          endTime: date.add(1, 'd').unix(),
          language: 'fr',
          options: { channelIds: [channel.site_id] }
        }
      }
    }
  },
  parser: function ({ content, date, channel }) {
    const programs = []
    const items = parseItems(content)
    items.forEach(item => {
      programs.push({
        title: item.title,
        description: item.description,
        icon: parseIcon(item),
        category: parseCategory(item),
        start: dayjs.unix(item.startTime),
        stop: dayjs.unix(item.endTime)
      })
    })

    return programs
  },
  async channels() {
    const query = {
      operationName: 'getPlayableChannels',
      variables: { language: 'fr', id: '0' },
      query:
        'query getPlayableChannels($language: String!, $queryParams: ChannelQueryParams, $id: String) { playableChannels(language: $language, queryParams: $queryParams, id: $id) { id name language radio }}'
    }
    const data = await axios
      .post(`https://api.proximusmwc.be/v2/graphql`, query)
      .then(r => r.data)
      .catch(console.log)

    const channels = []
    for (let item of data.data.playableChannels) {
      if (item.radio) continue
      channels.push({
        lang: item.language,
        site_id: item.id,
        name: item.name
      })
    }

    return channels
  }
}

function parseCategory(item) {
  return item.category ? item.category.replace(/^C\./, '') : null
}

function parseIcon(item) {
  return item.image[0] ? item.image[0].url : null
}

function parseItems(content) {
  const data = JSON.parse(content)
  if (!data || !data.data || !Array.isArray(data.data.schedulesByInterval)) return []

  return data.data.schedulesByInterval
}
