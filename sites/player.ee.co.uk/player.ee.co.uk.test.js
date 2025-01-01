const { parser, url } = require('./player.ee.co.uk.config.js')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2023-12-13').startOf('d')
const channel = {
  site_id: 'dvb://233a..6d60',
  xmltv_id: 'HGTV.uk'
}

axios.get.mockImplementation(url => {
  if (
    url ===
    'https://api.youview.tv/metadata/linear/v2/schedule/by-servicelocator?serviceLocator=dvb%3A%2F%2F233a..6d60&interval=2023-12-13T12Z/PT12H'
  ) {
    return Promise.resolve({
      data: JSON.parse(fs.readFileSync(path.resolve(__dirname, '__data__/data1.json')))
    })
  }

  return Promise.resolve({ data: '' })
})

it('can generate valid url', () => {
  expect(url({ date, channel })).toBe(
    'https://api.youview.tv/metadata/linear/v2/schedule/by-servicelocator?serviceLocator=dvb%3A%2F%2F233a..6d60&interval=2023-12-13T00Z/PT12H'
  )
})

it('can parse response', async () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/data.json'))
  const result = (await parser({ content, channel, date })).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      title: 'Bargain Mansions',
      description:
        'Tamara and her dad help a recent widow who loves to cook for her family design her dream kitchen, perfect for entertaining and large gatherings. S4/Ep1',
      season: 4,
      episode: 1,
      start: '2023-12-13T13:00:00.000Z',
      stop: '2023-12-13T14:00:00.000Z'
    },
    {
      title: 'Flip Or Flop',
      description:
        'Tarek and Christina are contacted by a cash strapped flipper who needs to unload a project house. S2/Ep2',
      season: 2,
      episode: 2,
      start: '2023-12-13T14:00:00.000Z',
      stop: '2023-12-13T14:30:00.000Z'
    }
  ])
})

it('can handle empty guide', async () => {
  const result = await parser({
    channel,
    date,
    content: ''
  })
  expect(result).toMatchObject([])
})
