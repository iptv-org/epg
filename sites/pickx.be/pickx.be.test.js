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
    `https://px-epg.azureedge.net/minified-airings/mockedApiVersion/2023-12-13/channel/UID0118?timezone=Europe%2FBrussels`
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
    start: '2024-12-11T23:55:00.000Z',
    stop: '2024-12-12T00:15:00.000Z',
    title: 'Le 22H30',
    description: 'Condensé de l\'actualité quotidienne des 12 médias de proximité de la fédération Wallonie-Bruxelles (15\')',
    category: 'Info',
    image:
      'https://experience-cache.proximustv.be/posterserver/poster/EPG/w-166_h-110/250_250_B28E198691F3F640FE989D6524EA42AA.jpg'
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
