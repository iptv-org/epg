const dayjs = require('dayjs')

module.exports = {
  site: 'winplay.co',
  days: 2,
  url: 'https://next.platform.mediastre.am/graphql',
  request: {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'x-client-id': 'a084524ea449c15dfe5e75636fb55ce6a9d0d7601aac946daa',
      'x-ott-language': 'es'
    },
    data() {
      return {
        operationName: 'getLivesEpg',
        variables: { page: 1, hours: 48 },
        query:
          'query getLivesEpg($page: Int = 1, $hours: Int, $ids: [String]) {\n getLives(ids: $ids) {\n _id\n logo\n name\n schedules(hours: $hours, page: {limit: 0, page: $page}) {\n _id\n name\n date_start\n date_end\n current\n match {\n matchDay\n __typename\n }\n show {\n _id\n title\n __typename\n }\n live {\n _id\n dvr\n type\n purchased\n __typename\n }\n __typename\n }\n __typename\n }\n}\n'
      }
    }
  },
  parser({ content, channel, date }) {
    let programs = []
    const items = parseItems(content, channel, date)
    for (let item of items) {
      programs.push({
        title: item.name,
        start: dayjs(item.date_start),
        stop: dayjs(item.date_end)
      })
    }

    return programs
  }
}

function parseItems(content, channel, date) {
  const data = JSON.parse(content)
  if (!data || !data.data || !data.data.getLives) return []
  const channelData = data.data.getLives.find(i => i._id === channel.site_id)
  if (!Array.isArray(channelData.schedules)) return []

  return channelData.schedules.filter(i => date.isSame(dayjs(i.date_start), 'd'))
}
