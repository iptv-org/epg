const axios = require('axios')
const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'dishtv.in',
  days: 2,
  url: `https://www.dishtv.in/WhatsonIndiaWebService.asmx/LoadPagginResultDataForProgram`,
  request: {
    method: 'POST',
    data({ channel, date }) {
      return {
        Channelarr: channel.site_id,
        fromdate: date.format('YYYYMMDDHHmm'),
        todate: date.add(1, 'd').format('YYYYMMDDHHmm')
      }
    }
  },
  parser: function ({ content, channel, date }) {
    let programs = []
    const data = parseContent(content)
    const items = parseItems(data)
    items.forEach(item => {
      const title = parseTitle(item)
      const start = parseStart(item, date)
      const stop = parseStop(item, start)
      if (title === 'No Information Available') return

      programs.push({
        title,
        start: start.toString(),
        stop: stop.toString()
      })
    })

    return programs
  },
  async channels() {
    const channelguide = await axios
      .get(`https://www.dishtv.in/channelguide/`)
      .then(r => r.data)
      .catch(console.log)
    const $channelguide = cheerio.load(channelguide)

    let ids = []
    $channelguide('#MainContent_recordPagging li').each((i, item) => {
      const onclick = $channelguide(item).find('a').attr('onclick')
      const [, list] = onclick.match(/ShowNextPageResult\('([^']+)/) || [null, null]

      ids = ids.concat(list.split(','))
    })
    ids = ids.filter(Boolean)

    const channels = {}
    const channelList = await axios
      .post(`https://www.dishtv.in/WebServiceMethod.aspx/GetChannelListFromMobileAPI`, {
        strChannel: ''
      })
      .then(r => r.data)
      .catch(console.log)
    const $channelList = cheerio.load(channelList.d)
    $channelList('#tblpackChnl > div').each((i, item) => {
      let num = $channelList(item).find('p:nth-child(2)').text().trim()
      const name = $channelList(item).find('p').first().text().trim()

      if (num === '') return

      channels[parseInt(num)] = {
        name
      }
    })

    const date = dayjs().add(1, 'd')
    const promises = []
    for (let id of ids) {
      const promise = axios
        .post(
          `https://www.dishtv.in/WhatsonIndiaWebService.asmx/LoadPagginResultDataForProgram`,
          {
            Channelarr: id,
            fromdate: date.format('YYYYMMDD[0000]'),
            todate: date.format('YYYYMMDD[2300]')
          },
          { timeout: 5000 }
        )
        .then(r => r.data)
        .then(data => {
          const $channelGuide = cheerio.load(data.d)

          const num = $channelGuide('.cnl-fav > a > span').text().trim()

          if (channels[num]) {
            channels[num].site_id = id
          }
        })
        .catch(console.log)

      promises.push(promise)
    }

    await Promise.allSettled(promises)

    return Object.values(channels)
  }
}

function parseTitle(item) {
  const $ = cheerio.load(item)

  return $('a').text()
}

function parseStart(item, date) {
  const $ = cheerio.load(item)
  const onclick = $('i.fa-circle').attr('onclick')
  const [_, time] = onclick.match(/RecordingEnteryOpen\('.*','.*','(.*)','.*',.*\)/)

  return dayjs.tz(time, 'YYYYMMDDHHmm', 'Asia/Kolkata')
}

function parseStop(item, start) {
  const $ = cheerio.load(item)
  const duration = $('*').data('time')

  return start.add(duration, 'm')
}

function parseContent(content) {
  const data = JSON.parse(content)

  return data.d
}

function parseItems(data) {
  const $ = cheerio.load(data)

  return $('.datatime').toArray()
}
