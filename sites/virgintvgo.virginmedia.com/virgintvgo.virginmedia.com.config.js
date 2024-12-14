const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const debug = require('debug')('site:virgintvgo.virginmedia.com')

dayjs.extend(utc)

const detailedGuide = true
const nworker = 25

module.exports = {
  site: 'virgintvgo.virginmedia.com',
  days: 2,
  request: {
    cache: {
      ttl: 24 * 60 * 60 * 1000 // 1 day
    }
  },
  url({ date, segment = 0 }) {
    return `https://staticqbr-prod-gb.gnp.cloud.virgintvgo.virginmedia.com/eng/web/epg-service-lite/gb/en/events/segments/${
      date.format('YYYYMMDD')
    }${
      segment.toString().padStart(2, '0')
    }0000`
  },
  async parser({ content, channel, date }) {
    const programs = []
    if (content) {
      const items = typeof content === 'string' ? JSON.parse(content) : content
      if (Array.isArray(items.entries)) {
        // fetch other segments
        const queues = [
          module.exports.url({ date, segment: 6}),
          module.exports.url({ date, segment: 12}),
          module.exports.url({ date, segment: 18}),
        ]
        await doFetch(queues, (url, res) => {
          if (Array.isArray(res.entries)) {
            items.entries.push(...res.entries)
          }
        })
        items.entries
          .filter(item => item.channelId === channel.site_id)
          .forEach(item => {
            if (Array.isArray(item.events)){
              if (detailedGuide) {
                queues.push(...item.events
                  .map(event =>
                    `https://spark-prod-gb.gnp.cloud.virgintvgo.virginmedia.com/eng/web/linear-service/v2/replayEvent/${
                      event.id
                    }?returnLinearContent=true&forceLinearResponse=true&language=en`
                  )
                )
              } else {
                item.events.forEach(event => {
                  programs.push({
                    title: event.title,
                    start: dayjs.utc(event.startTime * 1000),
                    stop: dayjs.utc(event.endTime * 1000)
                  })
                })
              }
            }
          })
        // fetch detailed guide
        if (queues.length) {
          await doFetch(queues, (url, res) => {
            programs.push({
              title: res.title,
              subTitle: res.episodeName,
              description: res.longDescription ? res.longDescription : res.shortDescription,
              category: res.genres,
              season: res.seasonNumber,
              episode: res.episodeNumber,
              country: res.countryOfOrigin,
              actor: res.actors,
              director: res.directors,
              producer: res.producers,
              date: res.productionDate,
              start: dayjs.utc(res.startTime * 1000),
              stop: dayjs.utc(res.endTime * 1000)
            })
          })
        }
      }
    }

    return programs
  },
  async channels() {
    const channels = []
    const axios = require('axios')
    const res = await axios
      .get('https://spark-prod-gb.gnp.cloud.virgintvgo.virginmedia.com/eng/web/linear-service/v2/channels?cityId=40980&language=en&productClass=Orion-DASH&platform=web')
      .then(r => r.data)
      .catch(console.error)

    if (Array.isArray(res)) {
      channels.push(...res
        .filter(item => !item.isHidden)
        .map(item => {
          return {
            lang: 'en',
            site_id: item.id,
            name: item.name
          }
        })
      )
    }

    return channels
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
