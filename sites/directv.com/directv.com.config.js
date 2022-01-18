const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

module.exports = {
  site: 'directv.com',
  url({ channel, date }) {
    return `https://www.directv.com/json/channelschedule?channels=${
      channel.site_id
    }&startTime=${date.format()}&hours=24`
  },
  logo({ channel }) {
    return channel.logo
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
        start,
        stop
      })
    }

    return programs
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
