const jsdom = require('jsdom')
const { JSDOM } = jsdom

module.exports = {
  site: 'tv.yandex.ru',
  request: {
    headers: {
      Cookie:
        'yandexuid=8747786251615498142; Expires=Tue, 11 Mar 2031 21:29:02 GMT; Domain=yandex.ru; Path=/'
    }
  },
  url: function ({ date, channel }) {
    const [region, id] = channel.site_id.split('#')
    return `https://tv.yandex.ru/${region}/channel/${id}?date=${date.format('YYYY-MM-DD')}`
  },
  logo: function ({ content }) {
    const dom = new JSDOM(content)
    const img = dom.window.document.querySelector(
      '#mount > div > main > div > div > div.content__header > div > div.channel-header__title > figure > img'
    )

    return img ? 'https:' + img.src : null
  },
  parser: function ({ content }) {
    const initialState = content.match(/window.__INITIAL_STATE__ = (.*);/i)
    let programs = []
    if (!initialState && !initialState[1]) return programs

    const data = JSON.parse(initialState[1], null, 2)
    if (data.channel) {
      programs = data.channel.schedule.events.map(i => {
        return {
          title: i.title,
          description: i.program.description,
          start: i.start,
          stop: i.finish
        }
      })
    }

    return programs
  }
}
