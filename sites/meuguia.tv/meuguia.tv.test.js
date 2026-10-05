const { parser, url } = require('./meuguia.tv.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

const date = dayjs.utc('2023-11-21').startOf('d')
const channel = {
  site_id: 'AXN',
  xmltv_id: 'AXN.id'
}
it('can generate valid url', () => {
  expect(url({ channel })).toBe('https://meuguia.tv/programacao/canal/AXN')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))
  const result = parser({ content, channel, date }).map(p => {
    p.start = p.start.toJSON()
    if (p.stop) {
      p.stop = p.stop.toJSON()
    }
    return p
  })

  expect(result).toMatchObject([
    {
      title: 'Hawaii Five-0 : T10 EP4 - Tiny Is the Flower, Yet It Scents the Grasses Around It',
      start: '2023-11-21T21:20:00.000Z',
      stop: '2023-11-21T22:15:00.000Z',
      season: 10,
      episode: 4
    },
    {
      title:
        "Hawaii Five-0 : T10 EP5 - Don't Blame Ghosts and Spirits for One's Troubles; A Human Is Responsible",
      start: '2023-11-21T22:15:00.000Z',
      stop: '2023-11-21T23:10:00.000Z',
      season: 10,
      episode: 5
    },
    {
      title: 'NCIS : T5 EP15 - In the Zone',
      start: '2023-11-21T23:10:00.000Z',
      season: 5,
      episode: 15
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: '<!DOCTYPE html><html><head></head><body></body></html>'
  })
  expect(result).toMatchObject([])
})
