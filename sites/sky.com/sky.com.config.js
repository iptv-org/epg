const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const debug = require('debug')('site:sky.com')

dayjs.extend(utc)

const nworker = 10

module.exports = {
  site: 'sky.com',
  days: 2,
  url({ date, channel }) {
    return `https://awk.epgsky.com/hawk/linear/schedule/${
      date.format('YYYYMMDD')
    }/${
      channel.site_id
    }`
  },
  parser({ content, channel }) {
    const programs = []
    if (content) {
      const items = JSON.parse(content) || null
      if (Array.isArray(items.schedule)) {
        items.schedule
          .filter(schedule => schedule.sid === channel.site_id)
          .forEach(schedule => {
            if (Array.isArray(schedule.events)) {
              schedule.events
                .forEach(event => {
                  const start = dayjs.utc(event.st * 1000)
                  const stop = start.add(event.d, 's')
                  programs.push({
                    title: event.t,
                    description: event.sy,
                    season: event.seasonnumber,
                    episode: event.episodenumber,
                    start,
                    stop
                  })
                })
            }
          })
      }
    }

    return programs
  },
  async channels() {
    const channels = {}
    const queues = [{ t: 'r', u: 'https://www.sky.com/tv-guide' }]
    await doFetch(queues, (queue, res) => {
      // process regions
      if (queue.t === 'r') {
        const $ = cheerio.load(res)
        const initialData = JSON.parse(decodeURIComponent($('#initialData').text()))
        initialData.state.epgData.regions
          .forEach(region => {
            queues.push({ t: 'c', u: `https://awk.epgsky.com/hawk/linear/services/${region.bouquet}/${region.subBouquet}` })
          })
      }
      // process channels
      if (queue.t === 'c') {
        if (Array.isArray(res.services)) {
          for (const ch of res.services) {
            if (channels[ch.sid] === undefined) {
              channels[ch.sid] = {
                lang: 'en',
                site_id: ch.sid,
                name: ch.t
              }
            }
          }
        }
      }
    })

    return Object.values(channels)
  }
}

async function doFetch(queues, cb) {
  const axios = require('axios')
  let n = Math.min(nworker, queues.length)
  const workers = []
  const adjustWorker = () => {
    if (queues.length > workers.length && workers.length < nworker) {
      let nw = Math.min(nworker, queues.length)
      if (n < nw) {
        n = nw
        createWorker()
      }
    }
  }
  const createWorker = () => {
    while (workers.length < n) {
      startWorker()
    }
  }
  const startWorker = () => {
    const worker = () => {
      if (queues.length) {
        const queue = queues.shift()
        const done = (res, headers) => {
          if (res) {
            cb(queue, res, headers)
            adjustWorker()
          }
          worker()
        }
        const url = typeof queue === 'string' ? queue : queue.u
        const params = typeof queue === 'object' && queue.params ? queue.params : {}
        const method = typeof queue === 'object' && queue.m ? queue.m : 'get'
        if (typeof debug === 'function') {
          debug(`fetch %s with %s`, url, JSON.stringify(params))
        }
        axios[method](url, params)
          .then(response => {
            done(response.data, response.headers)
          })
          .catch(err => {
            console.error(`Unable to fetch ${url}: ${err.message}!`)
            done()
          })
      } else {
        workers.splice(workers.indexOf(worker), 1)
      }
    }
    workers.push(worker)
    worker()
  }
  createWorker()
  await new Promise(resolve => {
    const interval = setInterval(() => {
      if (workers.length === 0) {
        clearInterval(interval)
        resolve()
      }
    }, 500)
  })
}
