const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'mytelly.co.uk',
  days: 2,
  request: {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 OPR/117.0.0.0'
    }
  },
  url({ date, channel }) {
    return `https://www.mytelly.co.uk/tv-guide/listings/channel/${
      channel.site_id
    }.html?dt=${date.format('YYYY-MM-DD')}`
  },
  async parser({ content, date }) {
    const programs = []

    const items = parseItems(content)
    items.forEach(item => {
      const $item = cheerio.load(item)
      const td = $item('td:eq(1)')
      const title = td.find('h5 a')
      const subtitle = td.find('h6')
      const time = $item('td:eq(0)')
      let start = parseTime(date, time.text().trim())
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
    })

    return programs
  },
  async channels() {
    const doFetch = require('@ntlab/sfetch')
    const channels = {}
    const queues = [{ t: 'p', url: 'https://www.mytelly.co.uk/getform', params: this.request }]
    await doFetch(queues, (queue, res) => {
      // process form -> provider
      if (queue.t === 'p') {
        const $ = cheerio.load(res)
        $('#guide_provider option')
          .toArray()
          .forEach(el => {
            const opt = $(el)
            const provider = opt.attr('value')
            queues.push({
              t: 'r',
              url: 'https://www.mytelly.co.uk/getregions',
              params: { ...this.request, provider }
            })
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
          queues.push({
            t: 's',
            method: 'post',
            url: 'https://www.mytelly.co.uk/tv-guide/schedule',
            params: { ...this.request, data: params }
          })
        }
      }
      // process schedule -> channels
      if (queue.t === 's') {
        const $ = cheerio.load(res)
        $('.channelname').each((i, el) => {
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

function parseItems(content) {
  const $ = cheerio.load(content)

  return $('table.table > tbody > tr').toArray()
}

function parseTime(date, time) {
  return dayjs.tz(`${date.format('YYYY-MM-DD')} ${time}`, 'YYYY-MM-DD H:mm a', 'Europe/London')
}

function parseText($item) {
  let text = $item.text().replace(/\t/g, '').replace(/\n/g, ' ').trim()
  while (true) {
    if (text.match(/\s\s/)) {
      text = text.replace(/\s\s/g, ' ')
      continue
    }
    break
  }

  return text
}
