const dayjs = require('dayjs')
const jsdom = require('jsdom')
const { JSDOM } = jsdom

require('dayjs/locale/ro')
dayjs.locale('ro')

module.exports = {
  lang: 'ro',
  site: 'programetv.ro',
  channels: 'programetv.ro.channels.xml',
  output: '.gh-pages/guides/programetv.ro.guide.xml',
  url: function ({ date, channel }) {
    const diff = dayjs().diff(date, 'd')
    let day
    if (diff === 0) {
      day = 'azi'
    } else {
      day = date.format('ddd').toLowerCase()
    }

    return `https://www.programetv.ro/post/${channel.site_id}/${day}/`
  },
  logo({ content }) {
    const data = parseContent(content)

    return data ? data.station.icon : null
  },
  parser: function ({ content }) {
    let programs = []
    const data = parseContent(content)
    if (!data) return programs
    if (data) {
      programs = data.shows.map(i => {
        let title = i.title
        if (i.season) title += ` Sez.${i.season}`
        if (i.episode) title += ` Ep.${i.episode}`
        return {
          title,
          description: i.desc,
          category: i.categories[0],
          start: i.start,
          stop: i.stop,
          icon: i.icon
        }
      })
    }

    return programs
  }
}

function parseContent(content) {
  const pageData = content.match(/var pageData = (.*);/i)
  if (!pageData && !pageData[1]) return null

  return JSON.parse(pageData[1], null, 2)
}
