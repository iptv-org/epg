const { parser, url, request } = require('./meo.pt.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const axios = require('axios')

jest.mock('axios')

const date = dayjs.utc('2022-12-02', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'RTPM',
  xmltv_id: 'RTPMadeira.pt'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://meogouser.apps.meo.pt/Services/GridTv/GridTv.svc/GetLiveChannelProgramsByDate?callLetter=RTPM&date=2022-12-02&userAgent=IPTV_OFR_GTV'
  )
})

it('can generate valid request method', () => {
  expect(request.method).toBe('GET')
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    'origin': 'https://www.meo.pt',
    'user-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36'
  })
})

it('can parse response', async () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'), 'utf-8')

  axios.get.mockResolvedValue({ data: {} })

  let results = await parser({ content, channel })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2026-01-22T23:40:00.000Z',
    stop: '2026-01-23T00:04:00.000Z',
    title: 'Barman - Ep. 4',
    description: "'Barman' é uma série de comédia dramática sobre um jovem comediante que começa a trabalhar como Barman porque precisa de arranjar dinheiro depressa, pelo caminho é obrigado a lidar com a vida noturna e conciliar duas realidades diferentes.",
    icon: {
      src: 'https://proxycache.online.meo.pt/eemstb/ImageHandler.ashx?evTitle=Barman%20-%20Ep.%204&chCallLetter=RTPM&profile=16_9&width=600'
    }
  })
})

it('can handle empty guide', async () => {
  const result = await parser({ content: '', channel, date })
  expect(result).toMatchObject([])
})
