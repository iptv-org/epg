// npx epg-grabber --config=sites/indihometv.com/indihometv.com.config.js --channels=sites/indihometv.com/indihometv.com.channels.xml --output=guide.xml --timeout=30000 --days=2

const { parser, url, request } = require('./indihometv.com.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const date = dayjs.utc('2022-08-08', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'metrotv',
  xmltv_id: 'MetroTV.id'
}
const content = `<!DOCTYPE html><html><head></head><body><section class="live-tv-channels" id="top"><div><div class="schedule-list"><div id="pills-2022-08-08"><div class="row"><div><a class="schedule-item"><span class="replay"></span><p>07:00 - 07:05</p><b>Headline News</b></a></div><div><a class="schedule-item"><span class="replay"></span><p>07:05 - 07:30</p><b>Editorial Media Indonesia</b></a></div><div><a class="schedule-item"><span class="replay"></span><p>07:30 - 07:45</p><b>Editorial Media Indonesia</b></a></div><div><a class="schedule-item"><span class="replay"></span><p>07:45 - 08:00</p><b>Editorial Media Indonesia</b></a></div></div></div></div></div></section></body>`

it('can generate valid url', () => {
  expect(url({ channel })).toBe('https://www.indihometv.com/tvod/metrotv')
})

it('can parse response', () => {
  const result = parser({ content, channel, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      title: 'Headline News',
      start: '2022-08-08T00:00:00.000Z',
      stop: '2022-08-08T00:05:00.000Z'
    },
    {
      title: 'Editorial Media Indonesia',
      start: '2022-08-08T00:05:00.000Z',
      stop: '2022-08-08T00:30:00.000Z'
    },
    {
      title: 'Editorial Media Indonesia',
      start: '2022-08-08T00:30:00.000Z',
      stop: '2022-08-08T00:45:00.000Z'
    },
    {
      title: 'Editorial Media Indonesia',
      start: '2022-08-08T00:45:00.000Z',
      stop: '2022-08-08T01:00:00.000Z'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: `<!DOCTYPE html><html><head></head><body></body></html>`
  })
  expect(result).toMatchObject([])
})
