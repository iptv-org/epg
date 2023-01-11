const { padStart } = require('lodash')
const cheerio = require('cheerio')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

module.exports = {
  site: 'directv.com',
  days: 2,
  url({ channel, date }) {
    return `https://www.directv.com/json/channelschedule?channels=${
      channel.site_id
    }&startTime=${date.format()}&hours=24`
  },
  async parser({ content }) {
    const programs = []
    const items = parseItems(content)
    for (let item of items) {
      if (item.programID === '-1') continue
      const detail = await loadProgramDetail(item.programID)
      const start = parseStart(item)
      const stop = start.add(item.duration, 'm')
      programs.push({
        title: item.title,
        description: parseDescription(detail),
        category: item.subcategoryList,
        season: item.seasonNumber,
        episode: item.episodeNumber,
        start,
        stop
      })
    }

    return programs
  },
  async channels({ zip }) {
    const html = await axios
      .get(`https://www.directv.com/guide`, {
        headers: {
          cookie: `dtve-prospect-zip=${zip}`
        }
      })
      .then(r => r.data)
      .catch(console.log)

    const $ = cheerio.load(html)
    const script = $('#dtvClientData').html()
    const [_, json] = script.match(/var dtvClientData = (.*);/) || [null, null]
    const data = JSON.parse(json)

    let items = data.guideData.channels

    return items.map(item => {
      return {
        lang: 'en',
        site_id: item.chNum,
        name: item.chName
      }
    })
  }
}

function parseDescription(detail) {
  return detail ? detail.description : null
}

function loadProgramDetail(programID) {
  return axios
    .get(`https://www.directv.com/json/program/flip/${programID}`)
    .then(r => r.data)
    .then(d => d.programDetail)
    .catch(console.err)
}

function parseStart(item) {
  return dayjs.utc(item.airTime)
}

function parseItems(content) {
  const data = JSON.parse(content)

  return data && data.schedule && data.schedule[0] ? data.schedule[0].schedules : []
}
