const jsdom = require('jsdom')
const { JSDOM } = jsdom
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const timezone = require('dayjs/plugin/timezone')
require('dayjs/locale/id')

dayjs.extend(utc)
dayjs.extend(customParseFormat)
dayjs.extend(timezone)

module.exports = {
  lang: 'id',
  site: 'vidio.com',
  channels: 'vidio.com.channels.xml',
  output: '.gh-pages/guides/master.xml',
  url({ channel }) {
    return `https://www.vidio.com/live/${channel.site_id}/schedules`
  },
  parser({ content, date }) {
    const programs = []
    const dom = new JSDOM(content)

    const scheduleDate = dom.window.document.querySelector(
      'div.b-livestreaming-daily-schedule__date-label'
    ).textContent.split(',')
    const currdate = dayjs(scheduleDate[1], 'DD MMMM YYYY', 'id')
    const list = dom.window.document.querySelector(
      `#schedule-content-${currdate.format(
        'YYYYMMDD'
      )} > .b-livestreaming-daily-schedule__scroll-container`
    )
    const items = list.querySelectorAll('div.b-livestreaming-daily-schedule__item')
    items.forEach(item => {
      const title = (
        item.querySelector('div.b-livestreaming-daily-schedule__item-content-title') || {
          textContent: ''
        }
      ).textContent
      const time = (
        item.querySelector('div.b-livestreaming-daily-schedule__item-content-caption') || {
          textContent: ''
        }
      ).textContent
      if (title && time) {
        let start = dayjs.tz(
          currdate.format('YYYY-MM-DD ').concat(time.substring(0, 5)),
          'YYYY-MM-DD HH:mm',
          'Asia/Jakarta'
        )
        let stop = dayjs.tz(
          currdate.format('YYYY-MM-DD ').concat(time.substring(8, 13)),
          'YYYY-MM-DD HH:mm',
          'Asia/Jakarta'
        )
        if (start.diff(stop, 'h') > 0) {
          stop = stop.add(1, 'day')
        }

        programs.push({
          title,
          start,
          stop
        })
      }
    })

    return programs
  }
}

const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

module.exports = {
  lang: 'en',
  site: 'tvtv.us',
  channels: 'tvtv.us.channels.xml',
  output: '.gh-pages/guides/master.xml',
  url: function ({ date, channel }) {
    return `https://www.tvtv.us/tvm/t/tv/v4/stations/${
      channel.site_id
    }/listings?start=${date.format()}&end=${date.add(1, 'd').format()}`
  },
  parser: function ({ content }) {
    let programs = []
    const items = JSON.parse(content)
    if (!items.length) return programs
    items.forEach(item => {
      const start = dayjs.utc(item.listDateTime)
      const stop = start.add(item.duration, 'm')
      const icon = item.showPicture
        ? `https://cdn.tvpassport.com/image/show/480x720/${item.showPicture}`
        : null
      let title = item.showName
      if (title === "Movie") {
        title = item.episodeTitle
      }
      programs.push({
        title: title,
        description: item.description,
        category: item.showType,
        start: start.toString(),
        stop: stop.toString(),
        icon
      })
    })

    return programs
  }
}

const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

module.exports = {
  lang: 'en',
  site: 'tvtv.ca',
  channels: 'tvtv.ca.channels.xml',
  output: '.gh-pages/guides/master.xml',
  url: function ({ date, channel }) {
    return `https://www.tvtv.ca/tvm/t/tv/v4/stations/${
      channel.site_id
    }/listings?start=${date.format()}&end=${date.add(1, 'd').format()}`
  },
  parser: function ({ content }) {
    let programs = []
    const items = JSON.parse(content)
    if (!items.length) return programs
    items.forEach(item => {
      const start = dayjs.utc(item.listDateTime)
      const stop = start.add(item.duration, 'm')
      const icon = item.showPicture
        ? `https://cdn.tvpassport.com/image/show/480x720/${item.showPicture}`
        : null
      programs.push({
        title: item.showName,
        description: item.description,
        category: item.showType,
        start: start.toString(),
        stop: stop.toString(),
        icon
      })
    })

    return programs
  }
}

const jsdom = require('jsdom')
const { JSDOM } = jsdom
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  lang: 'en',
  site: 'znbc.co.zm',
  channels: 'znbc.co.zm.channels.xml',
  output: '.gh-pages/guides/master.xml',
  url({ channel }) {
    return `https://www.znbc.co.zm/${channel.site_id}/`
  },
  logo({ content }) {
    const dom = new JSDOM(content)
    const img = dom.window.document.querySelector(
      '.elementor-tabs-content-wrapper > .elementor-tab-content > table > tbody > tr:nth-child(1) > td > span > img'
    )

    return img ? img.dataset.src : null
  },
  parser({ content, date }) {
    const programs = []
    const items = parseItems(content, date)
    items.forEach(item => {
      const title = parseTitle(item)
      const start = parseStart(item, date)
      const stop = parseStop(item, date)
      if (programs.length) {
        programs[programs.length - 1].stop = start
      }

      programs.push({ title, start, stop })
    })

    return programs
  }
}

function parseStop(item, date) {
  return date.endOf('d')
}

function parseStart(item, date) {
  const row = (item.querySelector('td > p') || { textContent: '' }).textContent
  let time = row.split(' ').shift()
  time = `${date.format('MM/DD/YYYY')} ${time}`

  return dayjs.tz(time, 'MM/DD/YYYY HH:mm', 'Africa/Lusaka')
}

function parseTitle(item) {
  const row = (item.querySelector('td > p') || { textContent: '' }).textContent
  const title = row.split(' ')
  title.shift()

  return title
    .map(i => i.trim())
    .filter(s => s)
    .join(' ')
}

function parseItems(content, date) {
  const day = date.day() // 0 => Sunday
  const dom = new JSDOM(content)
  const tabs = dom.window.document.querySelectorAll(
    `.elementor-tabs-content-wrapper > div[id*='elementor-tab-content']`
  )

  return tabs[day].querySelectorAll(`table > tbody > tr:not(:first-child)`)
}

const jsdom = require('jsdom')
const { JSDOM } = jsdom
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

let PM = false
module.exports = {
  lang: 'ca',
  site: 'andorradifusio.ad',
  channels: 'andorradifusio.ad.channels.xml',
  output: '.gh-pages/guides/master.xml',
  url({ channel }) {
    return `https://www.andorradifusio.ad/programacio/${channel.site_id}`
  },
  parser({ content, date }) {
    const programs = []
    const items = parseItems(content, date)
    items.forEach(item => {
      const title = parseTitle(item)
      let start = parseStart(item, date)
      if (start.hour() > 11) PM = true
      if (start.hour() < 12 && PM) start = start.add(1, 'd')
      const stop = parseStop(item, date)
      if (programs.length) {
        programs[programs.length - 1].stop = start
      }

      programs.push({
        title,
        start,
        stop
      })
    })

    return programs
  }
}

function parseStop(item, date) {
  return date.tz('Europe/Madrid').endOf('d').add(6, 'h')
}

function parseStart(item, date) {
  let time = (item.time || { textContent: '' }).textContent
  time = `${date.format('MM/DD/YYYY')} ${time}`

  return dayjs.tz(time, 'MM/DD/YYYY HH:mm', 'Europe/Madrid')
}

function parseTitle(item) {
  return (item.title || { textContent: '' }).textContent
}

function parseItems(content, date) {
  const items = []
  const dom = new JSDOM(content)
  const day = date.day() - 1
  const colNum = day < 0 ? 6 : day
  const cols = dom.window.document.querySelectorAll('.programacio-dia')
  const col = cols[colNum]
  const timeRows = col.querySelectorAll(`h4`)
  const titleRows = col.querySelectorAll(`p`)
  timeRows.forEach((time, i) => {
    items.push({
      time,
      title: titleRows[i]
    })
  })

  return items
}

const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

module.exports = {
  lang: 'ms',
  site: 'astro.com.my',
  channels: 'astro.com.my.channels.xml',
  output: '.gh-pages/guides/master.xml',
  request: {
    timeout: 10000
  },
  url: function ({ date, channel }) {
    return `http://ams-api.astro.com.my/ams/v3/getEvents?periodStart=${date.format(
      'YYYY-MM-DD'
    )}:00:00:00&periodEnd=${date.format('YYYY-MM-DD')}:23:59:59&channelId=${channel.site_id}`
  },
  logo: function ({ channel }) {
    return `https://divign0fdw3sv.cloudfront.net/Images/ChannelLogo/contenthub/${channel.site_id}_144.png`
  },
  parser: function ({ content }) {
    const programs = []
    const data = JSON.parse(content)
    const items = data.getevent
    if (!items.length) return programs

    items.forEach(item => {
      if (item.programmeTitle && item.displayDateTimeUtc && item.displayDuration) {
        const start = dayjs.utc(item.displayDateTimeUtc)
        const duration = parseDuration(item.displayDuration)
        const stop = start.add(duration, 's')
        programs.push({
          title: item.programmeTitle,
          description: item.shortSynopsis,
          category: item.subGenre,
          icon: item.epgEventImage,
          start: start.toString(),
          stop: stop.toString()
        })
      }
    })

    return programs
  }
}

function parseDuration(duration) {
  const match = duration.match(/(\d{2}):(\d{2}):(\d{2})/)
  const hours = parseInt(match[1])
  const minutes = parseInt(match[2])
  const seconds = parseInt(match[3])

  return hours * 3600 + minutes * 60 + seconds
}

const jsdom = require('jsdom')
const { JSDOM } = jsdom
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  lang: 'es',
  site: 'comteco.com.bo',
  channels: 'comteco.com.bo.channels.xml',
  output: '.gh-pages/guides/master.xml',
  url: function ({ channel }) {
    return `https://comteco.com.bo/pages/canales-y-programacion-tv/paquete-oro/${channel.site_id}`
  },
  logo: function ({ content }) {
    const dom = new JSDOM(content)
    const img = dom.window.document.querySelector(
      '#myform > div.row > div:nth-child(1) > div.col-xs-5.col-sm-7 > img'
    )

    return img ? `https://comteco.com.bo${img.src}` : null
  },
  parser: function ({ content, date }) {
    const programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const title = parseTitle(item)
      let start = parseStart(item, date)
      const stop = parseStop(item, date)
      if (programs.length) {
        programs[programs.length - 1].stop = start
      }

      programs.push({ title, start, stop })
    })

    return programs
  }
}

function parseStop(item, date) {
  return date.tz('America/La_Paz').endOf('d')
}

function parseStart(item, date) {
  let time = (
    item.querySelector('div > div.col-xs-11 > p > span') || { textContent: '' }
  ).textContent.trim()
  time = `${date.format('MM/DD/YYYY')} ${time}`

  return dayjs.tz(time, 'MM/DD/YYYY HH:mm:ss', 'America/La_Paz')
}

function parseTitle(item) {
  return (
    item.querySelector('div > div.col-xs-11 > p > strong') || { textContent: '' }
  ).textContent.trim()
}

function parseItems(content) {
  const dom = new JSDOM(content)

  return dom.window.document.querySelectorAll('#datosasociados > div > .list-group-item')
}

const jsdom = require('jsdom')
const { JSDOM } = jsdom
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(customParseFormat)

module.exports = {
  lang: 'el',
  site: 'cosmote.gr',
  channels: 'cosmote.gr.channels.xml',
  output: '.gh-pages/guides/master.xml',
  url: function ({ date, channel }) {
    return `https://www.cosmote.gr/cosmotetv/residential/program/epg/programchannel?p_p_id=channelprogram_WAR_OTETVportlet&p_p_lifecycle=0&_channelprogram_WAR_OTETVportlet_platform=IPTV&_channelprogram_WAR_OTETVportlet_date=${date.format(
      'DD-MM-YYYY'
    )}&_channelprogram_WAR_OTETVportlet_articleTitleUrl=${channel.site_id}`
  },
  logo: function ({ content }) {
    const dom = new JSDOM(content)
    const img = dom.window.document.querySelector('img.channel_program-banner')

    return img ? 'https://www.cosmote.gr' + img.src : null
  },
  parser: function ({ date, content }) {
    const dom = new JSDOM(content)
    const items = dom.window.document.querySelectorAll(
      '#_channelprogram_WAR_OTETVportlet_programs > tr.visible-xs'
    )
    let programs = []
    items.forEach(item => {
      const title = (item.querySelector('a') || { textContent: '' }).textContent
      const meta = (item.querySelector('td') || { innerHTML: '' }).innerHTML
      const startTime = (item.querySelector('.start-time') || { textContent: '' }).textContent
      const endTime = (item.querySelector('.end-time') || { textContent: '' }).textContent
      const category = meta.match(/\| (.+)<br>/)[1]
      const start = dayjs
        .utc(startTime, 'HH:mm')
        .set('D', date.get('D'))
        .set('M', date.get('M'))
        .set('y', date.get('y'))
      const stop = dayjs
        .utc(endTime, 'HH:mm')
        .set('D', date.get('D'))
        .set('M', date.get('M'))
        .set('y', date.get('y'))

      programs.push({
        title,
        category,
        start,
        stop
      })
    })

    return programs
  }
}

module.exports = {
  lang: 'tr',
  site: 'digiturk.com.tr',
  channels: 'digiturk.com.tr.channels.xml',
  output: '.gh-pages/guides/master.xml',
  url: function ({ date, channel }) {
    return `https://www.digiturk.com.tr/yayin-akisi/api/program/kanal/${
      channel.site_id
    }/${date.format('YYYY-MM-DD')}/0`
  },
  parser: function ({ content, date, channel }) {
    const programs = []
    const data = JSON.parse(content)
    const items = data.listings[channel.site_id]
    if (!items.length) return programs

    const categories = {
      '00': 'Diğer',
      E0: 'Romantik Komedi',
      E1: 'Aksiyon',
      E4: 'Macera',
      E5: 'Dram',
      E6: 'Fantastik',
      E7: 'Komedi',
      E8: 'Korku',
      EB: 'Polisiye',
      EF: 'Western',
      FA: 'Macera',
      FB: 'Yarışma',
      FC: 'Eğlence',
      F0: 'Reality-Show',
      F2: 'Haberler',
      F4: 'Belgesel',
      F6: 'Eğitim',
      F7: 'Sanat ve Kültür',
      F9: 'Life Style'
    }

    items.forEach(item => {
      if (item.ProgramName && item.BroadcastStart && item.BroadcastEnd) {
        programs.push({
          title: item.ProgramName,
          description: item.LongDescription,
          category: categories[item.Genre],
          start: item.BroadcastStart,
          stop: item.BroadcastEnd
        })
      }
    })

    return programs
  }
}

const jsdom = require('jsdom')
const { JSDOM } = jsdom
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)
dayjs.extend(timezone)
dayjs.extend(utc)

module.exports = {
  lang: 'ar',
  site: 'elcinema.com',
  channels: 'elcinema.com.channels.xml',
  output: '.gh-pages/guides/master.xml',
  url({ channel }) {
    return `https://elcinema.com/tvguide/${channel.site_id}/`
  },
  logo({ content }) {
    const dom = new JSDOM(content)
    const img = dom.window.document.querySelector('.intro-box > .row > div.columns.large-2 > img')

    return img.src || null
  },
  parser({ content, date }) {
    const programs = []

    const items = parseItems(content)
    items.forEach(item => {
      const title = parseTitle(item)
      const description = parseDescription(item)
      const category = parseCategory(item)
      const icon = parseIcon(item)
      const start = parseStart(item, date)
      const duration = parseDuration(item)
      const stop = start.add(duration, 'm')

      programs.push({
        title,
        description,
        category,
        icon,
        start,
        stop
      })
    })

    return programs
  }
}

function parseIcon(item) {
  const img =
    item.querySelector('.row > div.columns.small-3.large-1 > a > img') ||
    item.querySelector('.row > div.columns.small-5.large-1 > img')

  return img.dataset.src || null
}

function parseCategory(item) {
  const category = (
    item.querySelector('.row > div.columns.small-6.large-3 > ul > li:nth-child(2)') || {
      textContent: ''
    }
  ).textContent

  return category.replace(/\(\d+\)/, '').trim()
}

function parseDuration(item) {
  const duration = (
    item.querySelector('.row > div.columns.small-3.large-2 > ul > li:nth-child(2) > span') ||
    item.querySelector('.row > div.columns.small-7.large-11 > ul > li:nth-child(2) > span') || {
      textContent: ''
    }
  ).textContent

  return duration.replace(/\D/g, '')
}

function parseStart(item, initDate) {
  let time = (
    item.querySelector('.row > div.columns.small-3.large-2 > ul > li:nth-child(1)') ||
    item.querySelector('.row > div.columns.small-7.large-11 > ul > li:nth-child(2)') || {
      textContent: ''
    }
  ).textContent

  time = time
    .replace(/\[.*\]/, '')
    .replace('مساءً', 'PM')
    .replace('صباحًا', 'AM')
    .trim()

  time = `${initDate.format('DD/MM/YYYY')} ${time}`

  return dayjs.tz(time, 'DD/MM/YYYY H:mm A', 'Africa/Algiers')
}

function parseTitle(item) {
  return (
    item.querySelector('.row > div.columns.small-6.large-3 > ul > li:nth-child(1) > a') ||
    item.querySelector('.row > div.columns.small-7.large-11 > ul > li:nth-child(1)') || {
      textContent: ''
    }
  ).textContent
}

function parseDescription(item) {
  const excerpt = (
    item.querySelector('.row > div.columns.small-12.large-6 > ul > li:nth-child(3)') || {
      textContent: ''
    }
  ).textContent
  const desc = (
    item.querySelector('.row > div.columns.small-12.large-6 > ul > li:nth-child(3) > .hide') || {
      textContent: ''
    }
  ).textContent

  return excerpt.replace('...اقرأ المزيد', '') + desc
}

function parseItems(content) {
  const dom = new JSDOM(content)

  return dom.window.document.querySelectorAll('.tvgrid > div:nth-child(2) > .padded-half')
}

module.exports = {
  lang: 'it',
  site: 'guidatv.sky.it',
  channels: 'guidatv.sky.it.channels.xml',
  output: '.gh-pages/guides/master.xml',
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
    const data = JSON.parse(content)
    const items = data.events
    if (!items.length) return programs

    items.forEach(item => {
      if (item.eventTitle && item.starttime && item.endtime) {
        const cover = item.content.imagesMap
          ? item.content.imagesMap.find(i => i.key === 'cover')
          : null
        const icon =
          cover && cover.img && cover.img.url ? `https://guidatv.sky.it${cover.img.url}` : null
        programs.push({
          title: item.eventTitle,
          description: item.eventSynopsis,
          category: item.content.genre.name,
          start: item.starttime,
          stop: item.endtime,
          icon
        })
      }
    })

    return programs
  }
}

const jsdom = require('jsdom')
const { JSDOM } = jsdom
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  lang: 'de',
  site: 'hd-plus.de',
  channels: 'hd-plus.de.channels.xml',
  output: '.gh-pages/guides/master.xml',
  url({ date, channel }) {
    const now = dayjs()
    const day = now.diff(date, 'd')

    return `https://www.hd-plus.de/epg/channel/${channel.site_id}?d=${day}`
  },
  logo({ content }) {
    const dom = new JSDOM(content)
    const img = dom.window.document.querySelector('header > img')

    return img ? img.src : null
  },
  parser({ content, date }) {
    const programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const title = parseTitle(item)
      let start = parseStart(item, date)
      const stop = parseStop(item, date)
      if (programs.length) {
        programs[programs.length - 1].stop = start
      }

      programs.push({ title, start, stop })
    })

    return programs
  }
}

function parseStop(item, date) {
  return date.endOf('d')
}

function parseStart(item, date) {
  let time = (item.querySelector('td:nth-child(2)') || { textContent: '' }).textContent
  time = time.split(' ').pop()
  time = `${date.format('MM/DD/YYYY')} ${time}`

  return dayjs.tz(time, 'MM/DD/YYYY HH:mm', 'Europe/Berlin')
}

function parseTitle(item) {
  return (item.querySelector('td:nth-child(1) > a') || { textContent: '' }).textContent
}

function parseItems(content) {
  const dom = new JSDOM(content)

  return dom.window.document.querySelectorAll('table > tbody > tr')
}

const jsdom = require('jsdom')
const iconv = require('iconv-lite')
const { JSDOM } = jsdom
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

let PM = false
module.exports = {
  lang: 'cs',
  site: 'm.tv.sms.cz',
  channels: 'm.tv.sms.cz.channels.xml',
  output: '.gh-pages/guides/master.xml',
  url: function ({ date, channel }) {
    return `https://m.tv.sms.cz/index.php?stanice=${channel.site_id}&cas=0&den=${date.format(
      'YYYY-MM-DD'
    )}`
  },
  logo: function ({ content }) {
    const dom = new JSDOM(content)
    const img = dom.window.document.querySelector('.logo_out > img')

    return img ? img.src : null
  },
  parser: function ({ buffer, date }) {
    const programs = []
    const items = parseItems(buffer)
    items.forEach((item, i) => {
      const title = parseTitle(item)
      const description = parseDescription(item)
      let start = parseStart(item, date)
      if (start.hour() > 11) PM = true
      if (start.hour() < 12 && PM) start = start.add(1, 'd')
      const stop = parseStop(item, date)
      if (programs.length) {
        programs[programs.length - 1].stop = start
      }

      programs.push({
        title,
        description,
        start,
        stop
      })
    })

    return programs
  }
}

function parseStop(item, date) {
  return date.tz('Europe/Prague').endOf('d').add(6, 'h')
}

function parseStart(item, date) {
  let time = (item.querySelector('div > span') || { textContent: '' }).textContent.trim()

  time = `${date.format('MM/DD/YYYY')} ${time}`

  return dayjs.tz(time, 'MM/DD/YYYY HH.mm', 'Europe/Prague')
}

function parseDescription(item) {
  return (item.querySelector('a > div.detail') || { textContent: '' }).textContent.trim()
}

function parseTitle(item) {
  return (item.querySelector('a > div') || { textContent: '' }).textContent.trim()
}

function parseItems(buffer) {
  const string = iconv.decode(buffer, 'win1250')
  const dom = new JSDOM(string)

  return dom.window.document.querySelectorAll('#obsah > div > div.porady > div.porad')
}

const dayjs = require('dayjs')

module.exports = {
  lang: 'hr',
  site: 'maxtv.hrvatskitelekom.hr',
  channels: 'maxtv.hrvatskitelekom.hr.channels.xml',
  output: '.gh-pages/guides/master.xml',
  request: {
    method: 'POST',
    data: function ({ channel, date }) {
      return {
        channelList: [channel.site_id],
        startDate: date.startOf('d').unix(),
        endDate: date.endOf('d').unix()
      }
    }
  },
  url: function ({ date, channel }) {
    return `https://player.maxtvtogo.tportal.hr:8082/OTT4Proxy/proxy/epg/shows`
  },
  logo: function ({ content }) {
    const json = JSON.parse(content)
    return json.data ? json.data[0].logo : null
  },
  parser: function ({ content }) {
    const programs = []
    const json = JSON.parse(content)
    if (!json.data) return programs

    const items = json.data[0].shows
    items.forEach(item => {
      if (item.title && item.startTime && item.endTime) {
        const start = dayjs.unix(item.startTime)
        const stop = dayjs.unix(item.endTime)
        programs.push({
          title: item.title,
          category: item.category,
          start: start.toString(),
          stop: stop.toString()
        })
      }
    })

    return programs
  }
}

const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(customParseFormat)

module.exports = {
  lang: 'it',
  site: 'mediaset.it',
  channels: 'mediaset.it.channels.xml',
  output: '.gh-pages/guides/master.xml',
  url: function ({ date, channel }) {
    return `http://www.mediaset.it/guidatv/inc/canali/${date.format('YYYYMM')}/${date.format(
      'YYYYMMDD'
    )}_${channel.site_id}.sjson`
  },
  logo: function ({ channel }) {
    return `http://www.mediaset.it/include/img/loghi/${channel.site_id}.png`
  },
  parser: function ({ content, date }) {
    const programs = []
    const data = JSON.parse(content)
    if (!data.events) return programs

    data.events.forEach(item => {
      if (item.title && item.startTime && item.endTime) {
        const start = dayjs
          .utc(item.startTime, 'HH:mm')
          .set('D', date.get('D'))
          .set('M', date.get('M'))
          .set('y', date.get('y'))
          .toString()

        const stop = dayjs
          .utc(item.endTime, 'HH:mm')
          .set('D', date.get('D'))
          .set('M', date.get('M'))
          .set('y', date.get('y'))
          .toString()

        programs.push({
          title: item.displayTitle || item.title,
          description: item.description,
          category: item.genere,
          start,
          stop
        })
      }
    })

    return programs
  }
}

const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(customParseFormat)
dayjs.extend(timezone)

module.exports = {
  lang: 'pt',
  site: 'meo.pt',
  channels: 'meo.pt.channels.xml',
  output: '.gh-pages/guides/master.xml',
  request: {
    method: 'POST',
    data: function ({ channel, date }) {
      return {
        service: 'channelsguide',
        channels: [channel.site_id],
        dateStart: date.format('YYYY-MM-DDT00:00:00-00:00'),
        dateEnd: date.add(1, 'd').format('YYYY-MM-DDT00:00:00-00:00'),
        accountID: ''
      }
    }
  },
  logo({ content }) {
    const data = parseContent(content)
    return data.d.channels[0] ? data.d.channels[0].logo : null
  },
  url() {
    return `https://www.meo.pt/_layouts/15/Ptsi.Isites.GridTv/GridTvMng.asmx/getProgramsFromChannels`
  },
  parser({ content }) {
    let programs = []
    const data = parseContent(content)
    const items = data.d.channels[0] ? data.d.channels[0].programs : []
    if (!items.length) return programs

    items.forEach(item => {
      const title = item.name
      const localStart = dayjs.utc(`${item.date}/${item.timeIni}`, 'D-M-YYYY/HH:mm')
      const start = dayjs.tz(localStart.toString(), 'Europe/Lisbon').toString()
      const localStop = dayjs.utc(`${item.date}/${item.timeEnd}`, 'D-M-YYYY/HH:mm')
      const stop = dayjs.tz(localStop.toString(), 'Europe/Lisbon').toString()

      if (title && start && stop) {
        programs.push({
          title,
          start,
          stop
        })
      }
    })

    return programs
  }
}

function parseContent(content) {
  return JSON.parse(content)
}

const jsdom = require('jsdom')
const { JSDOM } = jsdom
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

let PM = false
module.exports = {
  lang: 'pt',
  site: 'mi.tv',
  channels: 'mi.tv.channels.xml',
  output: '.gh-pages/guides/master.xml',
  url({ date, channel }) {
    const [country, id] = channel.site_id.split('#')
    return `https://mi.tv/${country}/async/channel/${id}/${date.format('YYYY-MM-DD')}/180`
  },
  logo({ content }) {
    const dom = new JSDOM(content)
    const img = dom.window.document.querySelector('#listings > div.channel-info > img')
    return img ? img.src : null
  },
  parser({ content, date }) {
    const programs = []
    const items = parseItems(content)

    items.forEach(item => {
      const title = parseTitle(item)
      let start = parseStart(item, date)
      if (!start) return
      if (start.hour() > 11) PM = true
      if (start.hour() < 12 && PM) start = start.add(1, 'd')
      const stop = parseStop(item, start)
      if (programs.length) {
        programs[programs.length - 1].stop = start
      }

      programs.push({
        title,
        start,
        stop
      })
    })

    return programs
  }
}

function parseStop(item, date) {
  return date.endOf('d').add(6, 'h')
}

function parseStart(item, date) {
  let time = (item.querySelector('a > div.content > span.time') || { textContent: '' }).textContent
  if (!time) return null
  time = `${date.format('MM/DD/YYYY')} ${time}`

  return dayjs.tz(time, 'MM/DD/YYYY HH:mm', 'America/Sao_Paulo')
}

function parseTitle(item) {
  return (item.querySelector('a > div.content > h2') || { textContent: '' }).textContent
}

function parseItems(content) {
  const dom = new JSDOM(content)

  return dom.window.document.querySelectorAll('#listings > ul > li')
}

const FormData = require('form-data')
const jsdom = require('jsdom')
const { JSDOM } = jsdom
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  lang: 'en',
  site: 'mncvision.id',
  channels: 'mncvision.id.channels.xml',
  output: '.gh-pages/guides/master.xml',
  request: {
    method: 'POST',
    data: function ({ channel, date }) {
      const formData = new FormData()
      formData.setBoundary('X-EPG-BOUNDARY')
      formData.append('search_model', 'channel')
      formData.append('af0rmelement', 'aformelement')
      formData.append('fdate', date.format('YYYY-MM-DD'))
      formData.append('fchannel', channel.site_id)
      formData.append('submit', 'Search')

      return formData
    },
    headers: {
      'Content-Type': 'multipart/form-data; boundary=X-EPG-BOUNDARY'
    }
  },
  logo({ channel }) {
    return `https://www.mncvision.id/userfiles/image/channel/channel_${channel.site_id}.png`
  },
  url({ channel }) {
    return `https://www.mncvision.id/schedule/table`
  },
  parser({ content, date }) {
    const programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const title = parseTitle(item)
      const start = parseStart(item, date)
      const duration = parseDuration(item)
      const stop = start.add(duration, 'm')

      programs.push({ title, start, stop })
    })

    return programs
  }
}

function parseDuration(item) {
  let duration = (item.querySelector('td:nth-child(3)') || { textContent: '' }).textContent
  const match = duration.match(/(\d{2}):(\d{2})/)
  const hours = parseInt(match[1])
  const minutes = parseInt(match[2])

  return hours * 60 + minutes
}

function parseStart(item, date) {
  let time = (item.querySelector('td:nth-child(1)') || { textContent: '' }).textContent
  time = `${date.format('DD/MM/YYYY')} ${time}`

  return dayjs.tz(time, 'DD/MM/YYYY HH:mm', 'Asia/Jakarta')
}

function parseTitle(item) {
  return (item.querySelector('td:nth-child(2) > a') || { textContent: '' }).textContent
}

function parseItems(content) {
  const dom = new JSDOM(content)

  return dom.window.document.querySelectorAll('tr[valign="top"]')
}

const jsdom = require('jsdom')
const { JSDOM } = jsdom
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  lang: 'en',
  site: 'ontvtonight.com',
  channels: 'ontvtonight.com.channels.xml',
  output: '.gh-pages/guides/master.xml',
  url: function ({ date, channel }) {
    const [region, id] = channel.site_id.split('#')
    return region
      ? `https://www.ontvtonight.com/${region}/guide/listings/channel/${id}.html?dt=${date.format(
          'YYYY-MM-DD'
        )}`
      : `https://www.ontvtonight.com/guide/listings/channel/${id}.html?dt=${date.format(
          'YYYY-MM-DD'
        )}`
  },
  logo: function ({ content }) {
    const dom = new JSDOM(content)
    const img =
      dom.window.document.querySelector('#content > div > div > div.span6 > img') ||
      dom.window.document.querySelector('#inner-headline > div > div > div > img')

    return img ? img.src : null
  },
  parser: function ({ content, date }) {
    const programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const title = parseTitle(item)
      const start = parseStart(item, date)
      const stop = parseStop(item, date)

      if (title && start) {
        if (programs.length) {
          programs[programs.length - 1].stop = start
        }

        programs.push({
          title,
          start,
          stop
        })
      }
    })

    return programs
  }
}

function parseStop(item, date) {
  return date.tz('Europe/London').endOf('d')
}

function parseStart(item, date) {
  let time = (item.querySelector('td:nth-child(1) > h5') || { textContent: '' }).textContent.trim()
  time = `${date.format('DD/MM/YYYY')} ${time.toUpperCase()}`

  return dayjs.tz(time, 'DD/MM/YYYY H:mm A', 'Europe/London')
}

function parseTitle(item) {
  return (item.querySelector('td:nth-child(2) > h5 > a') || { textContent: '' }).textContent
    .toString()
    .trim()
}

function parseItems(content) {
  const dom = new JSDOM(content)

  return dom.window.document.querySelectorAll(
    '#content > div > div > div.span6 > table > tbody > tr'
  )
}

const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(timezone)

module.exports = {
  lang: 'es',
  site: 'programacion-tv.elpais.com',
  channels: 'programacion-tv.elpais.com.channels.xml',
  output: '.gh-pages/guides/master.xml',
  url: function ({ date }) {
    return `https://programacion-tv.elpais.com/data/parrilla_${date.format('DDMMYYYY')}.json`
  },
  logo: function ({ channel }) {
    return `https://programacion-tv.elpais.com/imagenes/canales/${channel.site_id}.jpg`
  },
  parser: function ({ content, date, channel }) {
    const programs = []
    const data = JSON.parse(content)
    const channelData = data.find(i => i.idCanal === channel.site_id)
    if (!channelData) return programs
    channelData.programas.forEach(item => {
      if (item.title && item.iniDate && item.endDate) {
        const startLocal = dayjs.utc(item.iniDate).toString()
        const start = dayjs.tz(startLocal.toString(), 'Europe/Madrid')
        const stopLocal = dayjs.utc(item.endDate).toString()
        const stop = dayjs.tz(stopLocal.toString(), 'Europe/Madrid')
        programs.push({
          title: item.title,
          description: item.description,
          category: item.txtSection,
          start,
          stop
        })
      }
    })

    return programs
  }
}

const dayjs = require('dayjs')
const jsdom = require('jsdom')
const { JSDOM } = jsdom

require('dayjs/locale/ro')
dayjs.locale('ro')

module.exports = {
  lang: 'ro',
  site: 'programetv.ro',
  channels: 'programetv.ro.channels.xml',
  output: '.gh-pages/guides/master.xml',
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

const jsdom = require('jsdom')
const { JSDOM } = jsdom
const parseDuration = require('parse-duration')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const duration = require('dayjs/plugin/duration')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(duration)
dayjs.extend(customParseFormat)

module.exports = {
  lang: 'fr',
  site: 'programme-tv.net',
  channels: 'programme-tv.net.channels.xml',
  output: '.gh-pages/guides/master.xml',
  url: function ({ date, channel }) {
    return `https://www.programme-tv.net/programme/chaine/${date.format('YYYY-MM-DD')}/programme-${
      channel.site_id
    }.html`
  },
  logo: function ({ content }) {
    const dom = new JSDOM(content)
    const img = dom.window.document.querySelector(
      '#corps > div > div.page.channel > div.gridChannel > div.gridChannel-leftColumn > div.gridChannel-epgGrid > div.gridChannel-header > div > div > div > img'
    )

    return img ? img.dataset.src : null
  },
  parser: function ({ content, date }) {
    const programs = []
    const dom = new JSDOM(content)
    const broadcastCards = dom.window.document.querySelectorAll('.singleBroadcastCard')
    broadcastCards.forEach(card => {
      const hour = (
        card.getElementsByClassName('singleBroadcastCard-hour')[0] || { textContent: '' }
      ).textContent
        .toString()
        .trim()
      const durationContent = (
        card.getElementsByClassName('singleBroadcastCard-durationContent')[0] || { textContent: '' }
      ).textContent
        .toString()
        .trim()
      const title = (
        card.getElementsByClassName('singleBroadcastCard-title')[0] || { textContent: '' }
      ).textContent
        .toString()
        .trim()
      const category = (
        card.getElementsByClassName('singleBroadcastCard-genre')[0] || { textContent: '' }
      ).textContent
        .toString()
        .trim()

      if (hour && title) {
        const start = dayjs
          .utc(hour.replace('h', '-'), 'HH-mm')
          .set('D', date.get('D'))
          .set('M', date.get('M'))
          .set('y', date.get('y'))

        let stop = null
        if (durationContent) {
          const durationInMilliseconds = parseDuration(durationContent)
          stop = start.add(dayjs.duration(durationInMilliseconds)).toString()
        }

        programs.push({
          title,
          category,
          start: start.toString(),
          stop
        })
      }
    })

    return programs
  }
}

const jsdom = require('jsdom')
const { JSDOM } = jsdom
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

let PM = false
module.exports = {
  lang: 'pl',
  site: 'programtv.onet.pl',
  channels: 'programtv.onet.pl.channels.xml',
  output: '.gh-pages/guides/master.xml',
  url: function ({ date, channel }) {
    const day = dayjs().diff(date, 'd')
    return `https://programtv.onet.pl/program-tv/${channel.site_id}?dzien=${day}`
  },
  logo: function ({ content }) {
    const dom = new JSDOM(content)
    const img = dom.window.document.querySelector('#channelTV > section > header > span > img')

    return img ? 'https:' + img.src : null
  },
  parser: function ({ content, date }) {
    const programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const title = parseTitle(item)
      const description = parseDescription(item)
      const category = parseCategory(item)
      let start = parseStart(item, date)
      if (start.hour() > 11) PM = true
      if (start.hour() < 12 && PM) start = start.add(1, 'd')
      const stop = parseStop(item, date)
      if (programs.length) {
        programs[programs.length - 1].stop = start
      }

      programs.push({
        title,
        description,
        category,
        start,
        stop
      })
    })

    return programs
  }
}

function parseStop(item, date) {
  return date.add(1, 'd').hour(3).startOf('h')
}

function parseStart(item, date) {
  let time = (item.querySelector('.hours > .hour') || { textContent: '' }).textContent
  time = `${date.format('MM/DD/YYYY')} ${time}`

  return dayjs.tz(time, 'MM/DD/YYYY HH:mm', 'Europe/Warsaw')
}

function parseCategory(item) {
  return (item.querySelector('.titles > .type') || { textContent: '' }).textContent
}

function parseDescription(item) {
  return (item.querySelector('.titles > p') || { textContent: '' }).textContent
}

function parseTitle(item) {
  return (item.querySelector('.titles > a') || { textContent: '' }).textContent
}

function parseItems(content) {
  const dom = new JSDOM(content)

  return dom.window.document.querySelectorAll('#channelTV > section > div.emissions > ul > li')
}

const dayjs = require('dayjs')

module.exports = {
  lang: 'fi',
  site: 'telkussa.fi',
  channels: 'telkussa.fi.channels.xml',
  output: '.gh-pages/guides/master.xml',
  url: function ({ date, channel }) {
    return `https://telkussa.fi/API/Channel/${channel.site_id}/${date.format('YYYYMMDD')}`
  },
  logo: function ({ channel }) {
    return `https://telkussa.fi/images/chan${channel.site_id}@3x.png`
  },
  parser: function ({ content, date, channel }) {
    const programs = []
    const items = JSON.parse(content)
    if (!items.length) return programs

    items.forEach(item => {
      if (item.name && item.start && item.stop) {
        const start = dayjs.unix(parseInt(item.start) * 60)
        const stop = dayjs.unix(parseInt(item.stop) * 60)

        programs.push({
          title: item.name,
          description: item.description,
          start: start.toString(),
          stop: stop.toString()
        })
      }
    })

    return programs
  }
}

const dayjs = require('dayjs')

module.exports = {
  lang: 'lv',
  site: 'tv.lv',
  channels: 'tv.lv.channels.xml',
  output: '.gh-pages/guides/master.xml',
  url: function ({ date, channel }) {
    return `https://www.tv.lv/programme/listing/none/${date.format(
      'DD-MM-YYYY'
    )}?filter=channel&subslug=${channel.site_id}`
  },
  logo: function ({ content }) {
    const data = JSON.parse(content)
    const logo = data.schedule.programme.length ? data.schedule.programme[0].channel.logo_64 : null

    return logo ? `https://cdn.tvstart.com/img/channel/${logo}` : null
  },
  parser: function ({ content }) {
    const programs = []
    const data = JSON.parse(content)
    const items = data.schedule.programme
    if (!items.length) return programs

    items.forEach(item => {
      if (item.title && item.start_unix && item.stop_unix) {
        const start = dayjs.unix(item.start_unix)
        const stop = dayjs.unix(item.stop_unix)
        programs.push({
          title: item.title,
          description: item.description_long,
          category: item.categorystring,
          icon: item.image,
          start: start.toString(),
          stop: stop.toString()
        })
      }
    })

    return programs
  }
}

const jsdom = require('jsdom')
const { JSDOM } = jsdom

module.exports = {
  lang: 'ru',
  site: 'tv.yandex.ru',
  channels: 'tv.yandex.ru.channels.xml',
  output: '.gh-pages/guides/master.xml',
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

const jsdom = require('jsdom')
const iconv = require('iconv-lite')
const { JSDOM } = jsdom
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

let PM = false
module.exports = {
  lang: 'uk',
  site: 'tvgid.ua',
  channels: 'tvgid.ua.channels.xml',
  output: '.gh-pages/guides/master.xml',
  url: function ({ date, channel }) {
    return `https://tvgid.ua/channels/${channel.site_id}/${date.format('DDMMYYYY')}/tmall/`
  },
  parser: function ({ buffer, date }) {
    const programs = []
    const items = parseItems(buffer)
    items.forEach(item => {
      const title = parseTitle(item)
      let start = parseStart(item, date)
      if (!start) return
      if (start.hour() > 11) PM = true
      if (start.hour() < 12 && PM) start = start.add(1, 'd')
      const stop = parseStop(item, start)
      if (programs.length) {
        programs[programs.length - 1].stop = start
      }

      programs.push({ title, start, stop })
    })

    return programs
  }
}

function parseStop(item, date) {
  return date.hour(7)
}

function parseStart(item, date) {
  let time = (item.querySelector('td > table > tbody > tr > td.time') || { textContent: '' })
    .textContent
  if (!time) return null
  time = `${date.format('MM/DD/YYYY')} ${time}`

  return dayjs.tz(time, 'MM/DD/YYYY HH:mm', 'Europe/Kiev')
}

function parseTitle(item) {
  return (
    item.querySelector('td > table > tbody > tr > td.item > a') ||
    item.querySelector('td > table > tbody > tr > td.item') || { textContent: '' }
  ).textContent
}

function parseItems(buffer) {
  const string = iconv.decode(buffer, 'win1251')
  const dom = new JSDOM(string)

  return dom.window.document.querySelectorAll(
    '#container > tbody > tr:nth-child(2) > td > table > tbody > tr > td > table:nth-child(2) > tbody > tr:not(:first-child)'
  )
}

const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(timezone)

module.exports = {
  lang: 'en',
  site: 'tvguide.com',
  channels: 'tvguide.com.channels.xml',
  output: '.gh-pages/guides/master.xml',
  url: function ({ date, channel }) {
    const localTime = date.tz('America/New_York')
    const parts = channel.site_id.split('#')
    const start = localTime.startOf('d')
    const duration = localTime.endOf('d').diff(start, 'm')
    const url = `https://cmg-prod.apigee.net/v1/xapi/tvschedules/tvguide/${
      parts[0]
    }/web?start=${start.unix()}&duration=${duration}&channelSourceIds=${parts[1]}`

    return url
  },
  parser: function ({ content }) {
    const programs = []
    const items = parseItems(content)
    items.forEach(item => {
      programs.push({
        title: item.title,
        start: parseTime(item.startTime),
        stop: parseTime(item.endTime)
      })
    })

    return programs
  }
}

function parseTime(timestamp) {
  return dayjs.unix(timestamp)
}

function parseItems(content) {
  const json = JSON.parse(content)

  return json.data.items[0].programSchedules
}

const cheerio = require('cheerio')
const dayjs = require('dayjs')

module.exports = {
  lang: 'hr',
  site: 'tvprofil.com',
  channels: 'tvprofil.com.channels.xml',
  output: '.gh-pages/guides/master.xml',
  request: {
    headers: {
      'x-requested-with': 'XMLHttpRequest'
    }
  },
  url: function ({ channel, date }) {
    const parts = channel.site_id.split('#')
    const query = buildQuery(parts[1], date)

    return `https://tvprofil.com/${parts[0]}/program/?${query}`
  },
  logo: function ({ content }) {
    const result = parseContent(content)

    return `https://cdn-0.tvprofil.com/cdn/100x40/10/img/kanali-logo/${result.data.channel.logo}`
  },
  parser: function ({ content, channel, date }) {
    let programs = []
    const result = parseContent(content)
    const items = parseItems(result.data.program)
    items.forEach(item => {
      const $item = cheerio.load(item)
      const title = parseTitle($item)
      const category = parseCategory($item)
      const start = parseStart($item)
      const duration = parseDuration($item)
      const stop = start.add(duration, 's')
      const icon = parseIcon($item)

      programs.push({ title, category, start, stop, icon })
    })

    return programs
  }
}

function parseIcon($item) {
  return $item(':root').data('image')
}

function parseDuration($item) {
  return $item(':root').data('len')
}

function parseStart($item) {
  const timestamp = $item(':root').data('ts')

  return dayjs.unix(timestamp)
}

function parseCategory($item) {
  return $item('.col:nth-child(2) > small').text() || null
}

function parseTitle($item) {
  let title = $item('.col:nth-child(2) > a').text()
  title += $item('.col:nth-child(2)').clone().children().remove().end().text()

  return title.replace('®', '').trim().replace(/,$/, '')
}

function parseItems(program) {
  const $ = cheerio.load(program)

  return $('.row').toArray()
}

function parseContent(content) {
  let data = (content.match(/cb\((.*)\)/) || [null, null])[1]

  return JSON.parse(data)
}

function buildQuery(site_id, date) {
  const query = {
    datum: date.format('YYYY-MM-DD'),
    kanal: site_id,
    callback: `cb`
  }

  const a = query.datum + query.kanal
  const ua = query.kanal + query.datum

  let i = a.length,
    b = 2,
    c = 2

  for (var j = 0; j < ua.length; j++) c += ua.charCodeAt(j)
  while (i--) {
    b += (a.charCodeAt(i) + c * 2) * i
  }

  const key = 'b' + b.toString().charCodeAt(2)

  query[key] = b

  return new URLSearchParams(query).toString()
}


