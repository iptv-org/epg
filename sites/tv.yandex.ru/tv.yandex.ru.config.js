const axios = require('axios')
const AxiosMockAdapter = require('axios-mock-adapter')
const dayjs = require('dayjs')
const debug = require('debug')('site:tv.yandex.ru')

const responses = {},
  caches = {}
// enable to fetch guide description but its take a longer time
const detailedGuide = true
const browserCloseDelay = 10000
const requestDoneDelay = 1000
const activityWaitDelay = 2000
const loopDelay = 100
const headless = true

const mock = new AxiosMockAdapter(axios)
mock.onGet(/.*/).reply(config => {
  delete config.signal
  return puppeteerAdapter(config)
})

let browser,
  page,
  autocloseBrowser = false,
  browserCloseHandled = false

module.exports = {
  site: 'tv.yandex.ru',
  days: 2,
  url({ date }) {
    return getUrl(date)
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
            if (!events.includes(event.id)) {
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
    if (!autocloseBrowser) {
      doCloseBrowserWhenIdle()
    }

    return programs
  },
  async channels() {
    const channels = []
    const included = []
    autocloseBrowser = true
    await axios
      .get(getUrl(dayjs()))
      .then(response => response.data)
      .catch(console.error)

    const schedules = await fetchSchedules({ date: dayjs() })
    schedules.forEach(schedule => {
      if (schedule.channel && !included.includes(schedule.channel.familyId)) {
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

async function fetchSchedules({ date, content }) {
  const schedules = []
  if (Object.entries(responses).length === 0) {
    if (content) {
      const s = await fetchSchedulesUrls({ date, content })
      schedules.push(...s)
    }
  } else {
    for (const [url, data] of Object.entries(responses)) {
      if (url.includes(`date=${date.format('YYYY-MM-DD')}`)) {
        const [, s] = parseContent(data.data, date)
        schedules.push(...s)
      }
    }
  }

  return schedules
}

async function fetchSchedulesUrls({ date, content }) {
  const schedules = []
  const queues = []
  const fetches = []
  const url = getUrl(date)

  let mainApi
  // parse content as schedules and add to queue if more requests is needed
  const f = (src, res) => {
    if (src) {
      fetches.push(src)
    }
    const [q, s] = parseContent(res, date)
    if (!mainApi) {
      mainApi = true
      if (caches.region) {
        queues.push(getUrl(date, caches.region))
      }
    }
    for (const url of q) {
      if (fetches.indexOf(url) < 0) {
        queues.push(url)
      }
    }
    schedules.push(...s)
  }
  // is main html already fetched?
  if (content) {
    f(url, content)
  } else {
    queues.push(url)
  }
  // fetch all queues
  while (queues.length) {
    const url = queues.shift()
    await axios
      .get(url)
      .then(response => {
        f(url, response.data)
      })
      .catch(console.error)
  }

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
          .map(event =>
            getUrl(null, caches.region, null, { ...event, programCoId: event?.program?.coId })
          )
      )
    })
  for (const queue of queues) {
    await axios
      .get(queue)
      .then(res => {
        const data = res.data
        // is it a program?
        if (data?.program) {
          let updated = false
          schedules.forEach(schedule => {
            schedule.events.forEach(event => {
              if (event.channelFamilyId === data.channelFamilyId && event.id === data.id) {
                Object.assign(event, data)
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
      .catch(console.error)
  }
}

function parseContent(content, date, check = false) {
  const queues = []
  const schedules = []
  let valid = false
  if (content) {
    if (Buffer.isBuffer(content)) {
      content = content.toString()
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
      if (region) {
        caches.region = region
        valid = true
      }
    }
  }

  return check ? valid : [queues, schedules]
}

function getSchedules(schedules) {
  return schedules.filter(schedule => schedule.events.length)
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
    url += `${url.endsWith('/') ? '' : '/'}event?eventId=${event.id}&programCoId=${
      event.programCoId ?? ''
    }`
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

async function puppeteerAdapter(config) {
  if (responses[config.url] === undefined) {
    debug('Fetching', config.url, 'using Puppeteer...')
    if (browser === undefined) {
      const puppeteer = require('puppeteer')
      browser = await puppeteer.launch({ headless })
    }
    const pages = await browser.pages()
    page = pages.length ? pages[0] : await browser.newPage()
    const apiRegex = /tv\.yandex\.ru\/api\//
    if (!config.url.match(apiRegex)) {
      await puppeterFetch(config.url, apiRegex)
    } else {
      await puppeteerXhr(config.url)
    }
    if (autocloseBrowser) {
      await closeBrowser()
    }
    debug('Done', config.url)
  }

  return responses[config.url]
}

async function puppeterFetch(url, re) {
  // catch page activity such as request or response
  if (page._monitored === undefined) {
    page._monitored = true
    page._requests = []
    page._finished = []
    await page.setRequestInterception(true)
    page.on('request', interceptor => {
      page._treq = new Date().getTime()
      const url = interceptor.url()
      if (url.match(re) && !page._requests.includes(url) && !page._finished.includes(url)) {
        page._requests.push(url)
      }
      interceptor.continue()
    })
    page.on('response', async res => {
      page._tres = new Date().getTime()
      const url = res.url()
      if (url.match(re)) {
        debug('Api', url)
        if (!page._finished.includes(url)) {
          page._finished.push(url)
        }
        if (page._requests.indexOf(url) >= 0) {
          page._requests.splice(page._requests.indexOf(url), 1)
        }
        await cacheResponse(url, res)
      }
    })
  }
  // open url
  const res = await page.goto(url, { waitUntil: 'load' })
  // simulate page scroll to retrieve all data
  debug('Start scrolling page!')
  await page.evaluate(() => {
    /* eslint-disable */
    let height
    const f = () => {
      const h = document.body.scrollHeight
      if (height === undefined || height < h) {
        height = h
      }
      if (window.scrollY < height - 1 && window._noscroll === undefined) {
        window.scrollBy(0, window.innerHeight)
        setTimeout(f, 100)
        if (window._scrolled === undefined) {
          setTimeout(() => {
            window._scrolled = true
          }, 3000)
        }
      }
    }
    f()
    /* eslint-enable */
  })
  // wait for all api request to be completed
  await new Promise(resolve => {
    const f = () => {
      let tmo
      /* eslint-disable */
      page
        .evaluate(() => window._scrolled)
        /* eslint-enable */
        .then(scrolled => {
          let done = scrolled && page._requests.length === 0
          if (done) {
            const t = new Date().getTime()
            if (t - page._treq < activityWaitDelay || t - page._tres < activityWaitDelay) {
              done = false
            }
          }
          if (done) {
            tmo = setTimeout(() => {
              debug('No more api request!')
              resolve()
            }, requestDoneDelay)
          } else {
            if (tmo) {
              clearTimeout(tmo)
              tmo = null
            }
            setTimeout(f, loopDelay)
          }
        })
    }
    f()
  })
  await page.evaluate(() => {
    /* eslint-disable */
    window._noscroll = true
    /* eslint-enable */
  })
  await cacheResponse(url, res)
}

async function puppeteerXhr(url) {
  // perform fetch
  await page.evaluate(url => {
    /* eslint-disable */
    return fetch(url, {
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-Tv-Sk': window.__INITIAL_SK__.key,
        'X-User-Session-Id': window.__USER_SESSION_ID__
      }
    })
    /* eslint-enable */
  }, url)
  // wait for response to arrive
  await new Promise(resolve => {
    const f = () => {
      if (responses[url]) {
        resolve()
      } else {
        setTimeout(f, loopDelay)
      }
    }
    f()
  })
}

async function cacheResponse(url, res) {
  const status = res.status()
  const headers = res.headers()
  let data
  if (status >= 200 && status < 400) {
    data = Buffer.from(await res.content())
  }
  if (data && headers['content-type'] && headers['content-type'].match(/application\/json/)) {
    data = JSON.parse(data)
  }
  responses[url] = { headers, status, data }
}

async function closeBrowser() {
  if (browser) {
    await browser.close()
    browser = undefined
  }
}

function doCloseBrowserWhenIdle() {
  if (browser && !browserCloseHandled) {
    browserCloseHandled = true
    const f = async () => {
      let lastTime
      const pages = await browser.pages()
      for (const page of pages) {
        if (page._treq && (lastTime === undefined || page._treq > lastTime)) {
          lastTime = page._treq
        }
        if (page._tres && (lastTime === undefined || page._tres > lastTime)) {
          lastTime = page._tres
        }
      }
      if (lastTime !== undefined) {
        const deltaTime = new Date().getTime() - lastTime
        if (deltaTime > browserCloseDelay) {
          debug(`Auto closing browser, last activity was ${new Date(lastTime)}...`)
          await closeBrowser()
        } else {
          setTimeout(f, loopDelay)
        }
      } else {
        setTimeout(f, loopDelay)
      }
    }
    f()
  }
}
