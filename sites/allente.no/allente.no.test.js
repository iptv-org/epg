const { parser, url } = require('./allente.no.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-17', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'se#0148',
  xmltv_id: 'SVT1.se'
}

it('can generate valid url', () => {
  if (channel.site_id.split('#')[0] !== 'se') {
    expect(url({ channel, date })).toBe('https://cs-vcb.allente.se/epg/events?date=2021-11-17')
  } else if (channel.site_id.split('#')[0] === 'fi') {
    expect(url({ channel, date })).toBe('https://cs-vcb.allente.fi/epg/events?date=2021-11-17')
  } else if (channel.site_id.split('#')[0] === 'no') {
    expect(url({ channel, date })).toBe('https://cs-vcb.allente.no/epg/events?date=2021-11-17')
  } else if (channel.site_id.split('#')[0] === 'dk') {
    expect(url({ channel, date })).toBe('https://cs-vcb.allente.dk/epg/events?date=2021-11-17')
  }
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  const result = parser({ content, channel }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-08-22T07:10:00.000Z',
      stop: '2022-08-22T07:30:00.000Z',
      title: 'Hemmagympa med Sofia',
      category: ['other'],
      description:
        'Svenskt träningsprogram från 2021. Styrka. Sofia Åhman leder SVT:s hemmagympapass. Denna gång fokuserar vi på styrka.',
      image:
        'https://viasatps.api.comspace.se/PS/channeldate/image/viasat.ps/21/2022-08-22/se.cs.svt1.event.A_41214031600.jpg?size=2560x1440',
      season: 4,
      episode: 1
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json'))
  })
  expect(result).toMatchObject([])
})
