const axios = require('axios')
const cheerio = require('cheerio')
const crypto = require('crypto')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const doFetch = require('@ntlab/sfetch')

dayjs.extend(utc)

const eventIds = []
const caches = {}
const headers = {
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
}

module.exports = {
  site: 'tv.mail.ru',
  days: 2,
  request: {
    cache: {
      ttl: 24 * 60 * 60 * 1000 // 1 day
    },
    headers
  },
  async url({ date }) {
    return await followUrl(getUrl(date))
  },
  async parser({ content, channel, date }) {
    const programs = []
    if (content) {
      // common utility
      const v = { e: [], d: date, p: 1 }
      const ev = (res, url) => {
        if (typeof res === 'string' || Buffer.isBuffer(res)) {
          res = JSON.parse(res)
        }
        if (Array.isArray(res?.data?.schedule?.items)) {
          res.data.schedule.items
            .filter(schedule => schedule.id == channel.site_id)
            .forEach(schedule => {
              if (Array.isArray(schedule.events)) {
                schedule.events
                  .filter(event => !eventIds.includes(event.id))
                  .forEach(event => {
                    // use event id as unique filter
                    if (!v.e.find(item => item.id === event.id)) {
                      v.e.push(event)
                    }
                  })
              }
            })
          // cache result
          if (url) {
            caches[url] = res
          }
        }
      }
      const mu = (next = true, dt = null) => {
        return getUrl(dt ? dt : v.d, next ? ++v.p : v.p)
      }
      const mq = oUrl => ({
        async url(queue) {
          return await followUrl(queue.oUrl)
        },
        oUrl,
        params: module.exports.request
      })
      const cr = async (next = true, dt = null) => {
        const oUrl = mu(next, dt)
        if (caches[oUrl]) {
          ev(caches[oUrl])
        } else {
          await doFetch([mq(oUrl)], (queue, res) => {
            ev(res, queue.oUrl)
          })
        }
      }
      // add main content
      ev(content)
      // fetch next page until site is found
      await new Promise(resolve => {
        const f = async () => {
          if (v.e.length) {
            resolve()
          } else {
            await cr()
            f()
          }
        }
        f()
      })
      if (v.e.length) {
        date = date.startOf('d')
        v.n = [...v.e]
        v.e = []
        // fetch previous day
        await cr(false, date.subtract(1, 'd'))
        v.e.push(...v.n)
        // process collected events
        const queues = []
        const events = []
        v.e
          .forEach(event => {
            const start = dayjs.utc(event.start_ts * 1000)
            const stop = dayjs.utc(event.stop_ts * 1000)
            if (date.isSame(start, 'd') || (date.isSame(stop, 'd') && stop > date)) {
              eventIds.push(event.id)
              const url = `https://tv.mail.ru${event.url}`
              const evt = {
                program: {
                  title: event.name,
                  image: event.image,
                  start,
                  stop
                }
              }
              if (caches[url]) {
                evt.detail = caches[url]
              } else {
                queues.push({
                  async url(queue) {
                    return await followUrl(queue.oUrl)
                  },
                  oUrl: url,
                  params: module.exports.request,
                  evt
                })
              }
              events.push(evt)
            }
          })
        // fetch detailed programs
        if (process.env.EPG_DETAILED_GUIDE) {
          await doFetch(queues, (queue, res) => {
            queue.evt.detail = res
            caches[queue.oUrl] = res
          })
        }
        // add programs
        programs.push(...events
          .map(evt => ({
              ...evt.program,
              ...parseProgram(evt.detail)
            })
          )
        )
      }
    }

    return programs
  },
  async channels() {
    const channels = []
    const args = { date: dayjs(), page: 0 }
    const queues = [getUrl(args.date, ++args.page)]
    await doFetch(queues, (url, res) => {
      if (res?.data?.schedule?.has_next_page) {
        queues.push(getUrl(args.date, ++args.page))
      }
      if (Array.isArray(res?.data?.schedule?.items)) {
        channels.push(...res.data.schedule.items
          .map(item => ({
            lang: 'ru',
            name: item.name,
            site_id: item.id
          }))
        )
      }
    })

    return channels
  }
}

function parseProgram(data) {
  const res = {}
  if (data) {
    const props = {
      title: '.fa7d86047b [data-qa="Title"]',
      sub_title: '.d4a57e7163',
      category: '[data-qa="TagLink"] [data-qa="Text"]',
      description: ['.f9cbc7a035', 'h2'],
      actor: '[data-qa*="TEST_IDS__EVENT_ATTR__actors_link_"]',
      director: '[data-qa*="TEST_IDS__EVENT_ATTR__director_link_"]',
      date: '[data-qa="TEST_IDS__TEVENT_META__start_year"]',
      country: '.ec1bc00977'
    }
    const $ = cheerio.load(data)
    for (const [prop, selector] of Object.entries(props)) {
      const item = $(Array.isArray(selector) ? selector[0] : selector)
      if (item.length) {
        // prune children
        if (Array.isArray(selector)) {
          item.find(selector[1]).remove()
        }
        if (item.length > 1) {
          res[prop] = item.toArray()
            .map(item => $(item).text().trim())
        } else {
          res[prop] = item.text().trim()
        }
      }
    }
  }

  return res
}

function getUrl(date, page = 1) {
  page = page > 1 ? `&page=${page}` : ''
  return `https://tv.mail.ru/ajax/service/index/schedule/?region_id=70&channel_type=all&date=${
    date.format('YYYY-MM-DD')
  }&appearance=grid&period=all${
    page
  }`
}

async function followUrl(url) {
  const f = async (m = 'head') => {
    await axios[m](url, { headers })
      .then(res => {
        if (res.headers && res.headers['x-challenge'] === 'required') {
          const challengeUrl = new URL(res.request.res.responseUrl)
          if (challengeUrl.searchParams.has('hash429')) {
            const key = crypto.hash('md5', challengeUrl.searchParams.get('hash429'))
            if (challengeUrl.searchParams.has('key')) {
              challengeUrl.searchParams.set('key', key)
            } else {
              challengeUrl.searchParams.append('key', key)
            }
            url = challengeUrl.toString()
          } else {
            throw new Error('Unknown challenge page!')
          }
        }
      })
      // @todo: handle captcha on 429
      .catch(console.error)

    return url
  }

  return await f()
}
