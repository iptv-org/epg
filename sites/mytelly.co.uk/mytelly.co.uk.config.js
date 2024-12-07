const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const debug = require('debug')('site:mytelly.co.uk')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

const detailedGuide = false
const tz = 'Europe/London'
const nworker = 10

module.exports = {
  site: 'mytelly.co.uk',
  days: 2,
  url({ date, channel }) {
    return `https://www.mytelly.co.uk/tv-guide/listings/channel/${
      channel.site_id
    }.html?dt=${date.format('YYYY-MM-DD')}`
  },
  async parser({ content, date, channel }) {
    const programs = []

    if (content) {
      const queues = []
      const $ = cheerio.load(content)

      $('table.table > tbody > tr').toArray()
        .forEach(el => {
          const td = $(el).find('td:eq(1)')
          const title = td.find('h5 a')
          if (detailedGuide) {
            queues.push(title.attr('href'))
          } else {
            const subtitle = td.find('h6')
            const time = $(el).find('td:eq(0)')
            const dateString = `${date.format('YYYY-MM-DD')} ${time.text().trim()}`
            let start = dayjs.tz(dateString, 'YYYY-MM-DD H:mm a', tz)
            const prev = programs[programs.length - 1]
            if (prev) {
              if (start.isBefore(prev.start)) {
                start = start.add(1, 'd')
                date = date.add(1, 'd')
              }
              prev.stop = start
            }
            const stop = start.add(30, 'm')
            programs.push({
              title: parseText(title),
              subTitle: parseText(subtitle),
              start,
              stop
            })
          }
        })
    }

    return programs
  },
  async channels() {
    const channels = {}
    const axios = require('axios')
    const queues = [{ t: 'p', m: 'post', u: 'https://www.mytelly.co.uk/getform' }]
    await doFetch(queues, (queue, res) => {
      // process form -> provider
      if (queue.t === 'p') {
        const $ = cheerio.load(res)
        $('#guide_provider option').toArray()
          .forEach(el => {
            const opt = $(el)
            const provider = opt.attr('value')
            queues.push({ t: 'r', m: 'post', u: 'https://www.mytelly.co.uk/getregions', params: { provider } })
          })
      }
      // process provider -> region
      if (queue.t === 'r') {
        const now = dayjs()
        for (const r of Object.values(res)) {
          const params = {
            provider: queue.params.provider,
            region: r.title,
            TVperiod: 'Night',
            date: now.format('YYYY-MM-DD'),
            st: 0,
            u_time: now.format('HHmm'),
            is_mobile: 1
          }
          queues.push({ t: 's', m: 'post', u: 'https://www.mytelly.co.uk/tv-guide/schedule', params })
        }
      }
      // process schedule -> channels
      if (queue.t === 's') {
        const $ = cheerio.load(res)
        $('.channelname')
          .each((i, el) => {
            const name = $(el).find('center > a:eq(1)').text()
            const url = $(el).find('center > a:eq(1)').attr('href')
            const [, number, slug] = url.match(/\/(\d+)\/(.*)\.html$/)
            const site_id = `${number}/${slug}`
            if (channels[site_id] === undefined) {
              channels[site_id] = {
                lang: 'en',
                site_id,
                name
              }
            }
          })
      }
    })

    return Object.values(channels)
  }
}

function parseText($item) {
  return $item.text()
    .replace(/\t/g, '')
    .replace(/\n/g, ' ')
    .replace(/  /g, ' ')
    .trim()
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
        const done = res => {
          if (res) {
            cb(queue, res)
            adjustWorker()
          }
          worker()
        }
        const url = typeof queue === 'string' ? queue : queue.u
        const params = typeof queue === 'object' && queue.params ? queue.params : {}
        const method = typeof queue === 'object' && queue.m ? queue.m : 'get'
        debug(`fetch %s with %s`, url, JSON.stringify(params))
        if (method === 'post') {
          axios
            .post(url, params)
            .then(response => done(response.data))
            .catch(console.error)
        } else {
          axios
            .get(url, params)
            .then(response => done(response.data))
            .catch(console.error)
        }
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

