const dayjs = require('dayjs')
const doFetch = require('@ntlab/sfetch')
const debug = require('debug')('site:tv.yandex.ru')

doFetch.setDebugger(debug).setMaxWorker(10)

// enable to fetch guide description but its take a longer time
const detailedGuide = true

// update this data by heading to https://tv.yandex.ru and change the values accordingly
const cookies = {
  i: 'eIUfSP+/mzQWXcH+Cuz8o1vY+D2K8fhBd6Sj0xvbPZeO4l3cY+BvMp8fFIuM17l6UE1Z5+R2a18lP00ex9iYVJ+VT+c=',
  spravka:
    'dD0xNzM0MjA0NjM4O2k9MTI1LjE2NC4xNDkuMjAwO0Q9QTVCQ0IyOTI5RDQxNkU5NkEyOTcwMTNDMzZGMDAzNjRDNTFFNDM4QkE2Q0IyOTJDRjhCOTZDRDIzODdBQzk2MzRFRDc5QTk2Qjc2OEI1MUY5MTM5M0QzNkY3OEQ2OUY3OTUwNkQ3RjBCOEJGOEJDMjAwMTQ0RDUwRkFCMDNEQzJFMDI2OEI5OTk5OUJBNEFERUYwOEQ1MjUwQTE0QTI3RDU1MEQwM0U0O3U9MTczNDIwNDYzODUyNDYyNzg1NDtoPTIxNTc0ZTc2MDQ1ZjcwMDBkYmY0NTVkM2Q2ZWMyM2Y1',
  yandexuid: '1197179041732383499',
  yashr: '4682342911732383504',
  yuidss: '1197179041732383499',
  user_display: 824
}
const headers = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 OPR/114.0.0.0'
}
const caches = {}

module.exports = {
  site: 'tv.yandex.ru',
  days: 2,
  url({ date }) {
    return getUrl(date)
  },
  request: {
    cache: {
      ttl: 3600000 // 1 hour
    },
    headers: getHeaders()
  },
  async parser({ content, date, channel }) {
    const programs = []
    const events = []

    if (content && parseContent(content, date, true)) {
      const cacheid = date.format('YYYY-MM-DD')
      if (!caches[cacheid]) {
        debug(`Please wait while fetching schedules for ${cacheid}`)
        caches[cacheid] = await fetchSchedules({ date, content })
      }
      if (detailedGuide) {
        await fetchPrograms({ schedules: caches[cacheid], date, channel })
      }
      caches[cacheid].forEach(schedule => {
        schedule.events
          .filter(
            event => event.channelFamilyId == channel.site_id && date.isSame(event.start, 'day')
          )
          .forEach(event => {
            if (events.indexOf(event.id) < 0) {
              events.push(event.id)
              programs.push({
                title: event.title,
                description: event.program.description,
                category: event.program.type.name,
                start: dayjs(event.start),
                stop: dayjs(event.finish)
              })
            }
          })
      })
    }

    return programs
  },
  async channels() {
    const channels = []
    const included = []
    const schedules = await fetchSchedules({ date: dayjs() })
    schedules.forEach(schedule => {
      if (schedule.channel && included.indexOf(schedule.channel.familyId) < 0) {
        included.push(schedule.channel.familyId)
        channels.push({
          lang: 'ru',
          site_id: schedule.channel.familyId.toString(),
          name: schedule.channel.title
        })
      }
    })

    return channels
  }
}

async function fetchSchedules({ date, content = null }) {
  const schedules = []
  const queues = []
  const fetches = []
  const url = getUrl(date)

  let mainApi
  // parse content as schedules and add to queue if more requests is needed
  const f = (src, res, headers) => {
    if (src) {
      fetches.push(src)
    }
    if (headers) {
      parseCookies(headers)
    }
    const [q, s] = parseContent(res, date)
    if (!mainApi) {
      mainApi = true
      if (caches.region) {
        queues.push(getQueue(getUrl(date, caches.region), src))
      }
    }
    for (const url of q) {
      if (fetches.indexOf(url) < 0) {
        queues.push(getQueue(url, src))
      }
    }
    schedules.push(...s)
  }
  // is main html already fetched?
  if (content) {
    f(url, content)
  } else {
    queues.push(getQueue(url, 'https://tv.yandex.ru/'))
  }
  // fetch all queues
  await doFetch(queues, f)

  return schedules
}

async function fetchPrograms({ schedules, date, channel }) {
  const queues = []
  schedules
    .filter(schedule => schedule.channel.familyId == channel.site_id)
    .forEach(schedule => {
      queues.push(
        ...schedule.events
          .filter(event => date.isSame(event.start, 'day'))
          .map(event => getQueue(getUrl(null, caches.region, null, event), 'https://tv.yandex.ru/'))
      )
    })
  await doFetch(queues, (queue, res, headers) => {
    if (headers) {
      parseCookies(headers)
    }
    // is it a program?
    if (res?.program) {
      let updated = false
      schedules.forEach(schedule => {
        schedule.events.forEach(event => {
          if (event.channelFamilyId === res.channelFamilyId && event.id === res.id) {
            Object.assign(event, res)
            updated = true
            return true
          }
        })
        if (updated) {
          return true
        }
      })
    }
  })
}

function parseContent(content, date, checkOnly = false) {
  const queues = []
  const schedules = []
  let valid = false
  if (content) {
    if (Buffer.isBuffer(content)) {
      content = content.toString()
    }
    // got captcha, its look like our cookies has expired
    if (
      content?.type === 'captcha' ||
      (typeof content === 'string' && content.match(/SmartCaptcha/))
    ) {
      throw new Error('Got captcha, please goto https://tv.yandex.ru and update cookies!')
    }
    if (typeof content === 'object') {
      let items
      if (content.schedule) {
        // fetch next request based on schedule map
        if (Array.isArray(content.schedule.scheduleMap)) {
          queues.push(...content.schedule.scheduleMap.map(m => getUrl(date, caches.region, m)))
        }
        // find some schedules?
        if (Array.isArray(content.schedule.schedules)) {
          items = content.schedule.schedules
        }
      }
      // find another schedules?
      if (Array.isArray(content.schedules)) {
        items = content.schedules
      }
      // add programs
      if (items && items.length) {
        schedules.push(...getSchedules(items))
      }
    } else {
      // prepare headers for next http request
      const [, region] = content.match(/region: '(\d+)'/i) || [null, null]
      const [, initialSk] = content.match(/window.__INITIAL_SK__ = (.*);/i) || [null, null]
      const [, sessionId] = content.match(/window.__USER_SESSION_ID__ = "(.*)";/i) || [null, null]
      const tvSk = initialSk ? JSON.parse(initialSk) : {}
      if (region) {
        caches.region = region
      }
      if (tvSk.key) {
        headers['X-Tv-Sk'] = tvSk.key
      }
      if (sessionId) {
        headers['X-User-Session-Id'] = sessionId
      }
      if (checkOnly && region && tvSk.key && sessionId) {
        valid = true
      }
    }
  }

  return checkOnly ? valid : [queues, schedules]
}

function parseCookies(headers) {
  if (Array.isArray(headers['set-cookie'])) {
    headers['set-cookie'].forEach(cookie => {
      const [key, value] = cookie.split('; ')[0].split('=')
      if (cookies[key] !== value) {
        cookies[key] = value
        debug(`Update cookie ${key}=${value}`)
      }
    })
  }
}

function getSchedules(schedules) {
  return schedules.filter(schedule => schedule.events.length)
}

function getHeaders(data = {}) {
  return Object.assign(
    {},
    headers,
    {
      Cookie: Object.keys(cookies)
        .map(cookie => `${cookie}=${cookies[cookie]}`)
        .join('; ')
    },
    data
  )
}

function getUrl(date, region = null, page = null, event = null) {
  let url = 'https://tv.yandex.ru/'
  if (region) {
    url += `api/${region}`
  }
  if (page && page.id !== undefined) {
    url += `${url.endsWith('/') ? '' : '/'}main/chunk?page=${page.id}`
  }
  if (event && event.id !== undefined) {
    url += `${url.endsWith('/') ? '' : '/'}event?eventId=${event.id}&programCoId=`
  }
  if (date) {
    url += `${url.indexOf('?') < 0 ? '?' : '&'}date=${date.format('YYYY-MM-DD')}${
      !page ? '&grid=all' : ''
    }&period=all-day`
  }
  if (page && page.id !== undefined && page.offset !== undefined) {
    url += `${url.indexOf('?') < 0 ? '?' : '&'}offset=${page.offset}`
  }
  if (page && page.id !== undefined && page.limit !== undefined) {
    url += `${url.indexOf('?') < 0 ? '?' : '&'}limit=${page.limit}`
  }
  return url
}

function getQueue(url, referer) {
  const data = {
    Origin: 'https://tv.yandex.ru'
  }
  if (referer) {
    data['Referer'] = referer
  }
  if (url.indexOf('api') > 0) {
    data['X-Requested-With'] = 'XMLHttpRequest'
  }
  const headers = getHeaders(data)
  return {
    url,
    params: { headers }
  }
}
