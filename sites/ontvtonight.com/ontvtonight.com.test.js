const { parser, url } = require('./ontvtonight.com.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-25', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'au#1692/7two',
  xmltv_id: '7two.au'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://www.ontvtonight.com/au/guide/listings/channel/1692/7two.html?dt=2021-11-25'
  )
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
      start: '2021-11-24T13:10:00.000Z',
      stop: '2021-11-24T13:50:00.000Z',
      title: 'What A Carry On'
    },
    {
      start: '2021-11-24T13:50:00.000Z',
      stop: '2021-11-25T11:50:00.000Z',
      title: 'Bones',
      description: 'The Devil In The Details'
    },
    {
      start: '2021-11-25T11:50:00.000Z',
      stop: '2021-11-25T12:50:00.000Z',
      title: 'Inspector Morse: The Remorseful Day'
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
