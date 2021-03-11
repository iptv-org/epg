module.exports = {
  url: function ({ date, channel }) {
    return `https://tv.yandex.ru/channel/${channel.site_id}?date=${date.format('YYYY-MM-DD')}`
  },
  parser: function ({ channel, content }) {
    const initialState = content.match(/window.__INITIAL_STATE__ = (.*);/i)[1]
    const data = JSON.parse(initialState, null, 2)
    let programs = []
    if (data.channel) {
      programs = data.channel.schedule.events.map(i => {
        return {
          title: i.title,
          description: i.program.description,
          start: i.start,
          stop: i.finish,
          lang: 'ru',
          channel: channel['xmltv_id']
        }
      })
    }

    return programs
  }
}
