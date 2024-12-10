const axios = require('axios')
const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const debug = require('debug')('site:startimestv.com')

dayjs.extend(utc)
dayjs.extend(customParseFormat)

const nworker = 5

module.exports = {
  site: 'startimestv.com',
  days: 2,
  url({ channel, date }) {
    return `https://www.startimestv.com/channeldetail/${channel.site_id}/${date.format(
      'YYYY-MM-DD'
    )}.html`
  },
  parser({ content, date }) {
    const programs = []
    if (content) {
      const $ = cheerio.load(content)
      $('.box .mask').toArray()
        .forEach(el => {
          let title = parseText($(el).find('h4'))
          const [s, e] = title.substr(0, title.indexOf(' ')).split('-') || [null, null]
          const start = dayjs.utc(`${date.format('YYYY-MM-DD')} ${s}`, 'YYYY-MM-DD HH:nn')
          const stop = dayjs.utc(`${date.format('YYYY-MM-DD')} ${e}`, 'YYYY-MM-DD HH:nn')
          title = title.substr(title.indexOf(' ') + 1)
          const [, season, episode] = title.match(/ S(\d+) E(\d+)/) || [null, null, null]
          const description = parseText($(el).find('p'))
          programs.push({
            title,
            description: description !== 'NA' ? description : null,
            season: season ? parseInt(season) : season,
            episode: episode ? parseInt(episode) : episode,
            start,
            stop
          })
        })
    }

    return programs
  },
  async channels() {
    const channels = {}
    const queues = [{ t: 'a', u: 'https://www.startimestv.com/tv_guide.html' }]
    await doFetch(queues, (queue, res) => {
      // process area-id
      if (queue.t === 'a') {
        const $ = cheerio.load(res)
        $('dd.update-areaID').toArray()
          .forEach(el => {
            const dd = $(el)
            const areaId = dd.attr('area-id')
            queues.push({
              t: 's',
              u: 'https://www.startimestv.com/tv_guide.html',
              params: {
                headers: {
                  cookie: `default_areaID=${areaId}`
                }
              }
            })
          })
      }
      // process channel
      if (queue.t === 's') {
        if (res) {
          const $ = cheerio.load(res)
          $(`.channl .c`).toArray()
            .forEach(el => {
              // only process channel with schedule only
              const clazz = $(el).attr('class')
              const [idx] = clazz.match(/\d+/) || [null]
              if (idx && $(`.item.item-${idx} .mask`).length) {
                const ch = $(el).find('.pic a[title]')
                const [site_id] = ch.attr('href').match(/\d+/) || [null]
                if (channels[site_id] === undefined) {
                  channels[site_id] = {
                    lang: 'en',
                    name: ch.attr('title'),
                    site_id
                  }
                }
              }
            })
        }
      }
    })

    return Object.values(channels)
  }
}

function parseText($item) {
  let text = $item.text()
    .replace(/\t/g, '')
    .replace(/\n/g, ' ')
    .trim()
  while (true) {
    if (text.match(/  /)) {
      text = text.replace(/  /g, ' ')
      continue
    }
    break
  }

  return text
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
