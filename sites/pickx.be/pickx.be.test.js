const { parser, url, request } = require('./pickx.be.config.js')
const axios = require('axios')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

jest.mock('axios')

axios.get.mockImplementation((url, data) => {
  if (url === 'https://www.pickx.be/nl/televisie/tv-gids') {
    return Promise.resolve({
      data: fs.readFileSync(path.resolve(__dirname, '__data__/hash.html'), 'utf8')
    })
  } else if (
    url ===
      'https://www.pickx.be/api/s-375ce5e452cf964b4158545d9ddf26cc97d6411f0998a2fa7ed5922c88d5bdc4' &&
    JSON.stringify(data) ===
      JSON.stringify({
        headers: {
          Origin: 'https://www.pickx.be',
          Referer: 'https://www.pickx.be/'
        }
      })
  ) {
    return Promise.resolve({
      status: 200,
      data: JSON.parse(fs.readFileSync(path.resolve(__dirname, '__data__/version.json')))
    })
  } else {
    return Promise.resolve({
      data: ''
    })
  }
})

const date = dayjs.utc('2023-12-13').startOf('d')
const channel = {
  lang: 'fr',
  site_id: 'UID0118'
}

it('can generate valid url', async () => {
  expect(await url({ channel, date })).toBe(
    'https://px-epg.azureedge.net/airings/21738594888692v.4.2/2023-12-13/channel/UID0118?timezone=Europe%2FBrussels'
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
