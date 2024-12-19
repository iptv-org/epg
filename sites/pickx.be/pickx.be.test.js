jest.mock('./pickx.be.config.js', () => {
  const originalModule = jest.requireActual('./pickx.be.config.js')
  return {
    ...originalModule,
    fetchApiVersion: jest.fn(() => Promise.resolve())
  }
})

const {
  parser,
  url,
  request,
  fetchApiVersion,
  setApiVersion,
  getApiVersion
} = require('./pickx.be.config.js')

const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

const date = dayjs.utc('2023-12-13').startOf('d')
const channel = {
  lang: 'fr',
  site_id: 'UID0118',
  xmltv_id: 'Vedia.be'
}

beforeEach(() => {
  setApiVersion('mockedApiVersion')
})

it('can generate valid url', async () => {
  const generatedUrl = await url({ channel, date })
  expect(generatedUrl).toBe(
    `https://px-epg.azureedge.net/airings/mockedApiVersion/2023-12-13/channel/UID0118?timezone=Europe%2FBrussels`
  )
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    Origin: 'https://www.pickx.be',
    Referer: 'https://www.pickx.be/'
  })
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/data.json'))
  const result = parser({ content, channel, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result[0]).toMatchObject({
    start: '2023-12-12T23:55:00.000Z',
    stop: '2023-12-13T00:15:00.000Z',
    title: 'Le 22h30',
    description: 'Le journal de vivre ici.',
    category: 'Info',
    image:
      'https://experience-cache.proximustv.be/posterserver/poster/EPG/w-166_h-110/250_250_4B990CC58066A7B2A660AFA0BDDE5C41.jpg'
  })
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: ''
  })
  expect(result).toMatchObject([])
})
