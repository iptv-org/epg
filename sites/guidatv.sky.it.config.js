module.exports = {
  lang: 'it',
  site: 'guidatv.sky.it',
  channels: 'guidatv.sky.it.channels.xml',
  output: '.gh-pages/guides/guidatv.sky.it.guide.xml',
  url: function ({ date, channel }) {
    const [env, id] = channel.site_id.split('#')
    return `https://apid.sky.it/gtv/v1/events?from=${date.format(
      'YYYY-MM-DD'
    )}T00:00:00Z&to=${date
      .add(1, 'd')
      .format('YYYY-MM-DD')}T00:00:00Z&pageSize=999&pageNum=0&env=${env}&channels=${id}`
  },
  logo: function ({ content }) {
    if (!content.events) return null
    const logo = content.events[0].channel.logo
    return logo ? `https://guidatv.sky.it${logo}` : null
  },
  parser: function ({ content, date }) {
    const programs = []
    if (!content.events) return programs

    content.events.forEach(item => {
      if (item.eventTitle && item.starttime && item.endtime) {
        programs.push({
          title: item.eventTitle,
          description: item.eventSynopsis,
          category: item.content.genre.name,
          start: item.starttime,
          stop: item.endtime
        })
      }
    })

    return programs
  }
}
