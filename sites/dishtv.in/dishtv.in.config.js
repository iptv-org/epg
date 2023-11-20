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
  url: 'https://www.dishtv.in/WhatsonIndiaWebService.asmx/LoadPagginResultDataForProgram',
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
  parser: function ({ content, date }) {
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
    let channels = []

    const pages = await loadPageList()
    for (let page of pages) {
      const data = await axios
        .post(
          'https://www.dishtv.in/WhatsonIndiaWebService.asmx/LoadPagginResultDataForProgram',
          page,
          { timeout: 30000 }
        )
        .then(r => r.data)
        .catch(console.log)

      const $ = cheerio.load(data.d)
      $('.pgrid').each((i, el) => {
        const onclick = $(el).find('.chnl-logo').attr('onclick')
        const number = $(el).find('.cnl-fav > a > span').text().trim()
        const [, name, site_id] = onclick.match(/ShowChannelGuid\('([^']+)','([^']+)'/) || [
          null,
          '',
          ''
        ]

        channels.push({
          lang: 'en',
          number,
          site_id
        })
      })
    }

    const names = await loadChannelNames()
    channels = channels
      .map(channel => {
        channel.name = names[channel.number]

        return channel
      })
      .filter(channel => channel.name)

    return channels
  }
}

async function loadPageList() {
  const data = await axios
    .get('https://www.dishtv.in/channelguide/')
    .then(r => r.data)
    .catch(console.log)

  let pages = []
  const $ = cheerio.load(data)
  $('#MainContent_recordPagging li').each((i, el) => {
    const onclick = $(el).find('a').attr('onclick')
    const [, Channelarr, fromdate, todate] = onclick.match(
      /ShowNextPageResult\('([^']+)','([^']+)','([^']+)'/
    ) || [null, '', '', '']

    pages.push({ Channelarr, fromdate, todate })
  })

  return pages
}

async function loadChannelNames() {
  const names = {}
  const data = await axios
    .post('https://www.dishtv.in/WebServiceMethod.aspx/GetChannelListFromMobileAPI', {
      strChannel: ''
    })
    .then(r => r.data)
    .catch(console.log)

  const $ = cheerio.load(data.d)
  $('#tblpackChnl > div').each((i, el) => {
    const num = $(el).find('p:nth-child(2)').text().trim()
    const name = $(el).find('p').first().text().trim()

    if (num === '') return

    names[num] = name
  })

  return names
}

function parseTitle(item) {
  const $ = cheerio.load(item)

  return $('a').text()
}

function parseStart(item) {
  const $ = cheerio.load(item)
  const onclick = $('i.fa-circle').attr('onclick')
  const [, time] = onclick.match(/RecordingEnteryOpen\('.*','.*','(.*)','.*',.*\)/)

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
