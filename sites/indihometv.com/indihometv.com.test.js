const { parser, url } = require('./indihometv.com.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const date = dayjs.utc('2022-08-08').startOf('d')
const channel = {
  site_id: 'metrotv',
  xmltv_id: 'MetroTV.id'
}

it('can generate valid url', () => {
  expect(url({ channel })).toBe('https://www.indihometv.com/livetv/metrotv')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'), 'utf8')
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
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.html'), 'utf8')
  })
  expect(result).toMatchObject([])
})
