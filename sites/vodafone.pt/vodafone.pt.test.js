import { parser, url, request } from './vodafone.pt.config.js'
const axios = require('axios')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-09-24', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '3028',
  xmltv_id: 'RTP1.pt'
}

const headers = {
    Origin: 'https://www.vodafone.pt',
    Referer: 'https://www.vodafone.pt/',
    'User-Agent': 'Mozilla/5.0 (compatible; tv_grab_pt_vodafone)',
    Accept: 'application/json, text/javascript, */*; q=0.01',
    'Accept-Language': 'pt-PT,pt;q=0.9,en;q=0.8'
}

jest.mock('axios')

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://cdn.pt.vtv.vodafone.com/epg/3028/2025/09/24/00-06'
  )
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject(headers)
})

it('can parse response', async () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content_0006.json'), 'utf8')

  axios.get.mockImplementation((url, config) => {
    if (
      url ===
        'https://cdn.pt.vtv.vodafone.com/epg/3028/2025/09/24/06-12' &&
      JSON.stringify(config.headers) === JSON.stringify(headers)
    ) {
      return Promise.resolve({
        data: fs.readFileSync(path.resolve(__dirname, '__data__/content_0612.json'), 'utf8')
      })
    } else if (
      url ===
        'https://cdn.pt.vtv.vodafone.com/epg/3028/2025/09/24/12-18' &&
      JSON.stringify(config.headers) === JSON.stringify(headers)
    ) {
      return Promise.resolve({
        data: fs.readFileSync(path.resolve(__dirname, '__data__/content_1218.json'), 'utf8')
      })
    } else if (
      url ===
        'https://cdn.pt.vtv.vodafone.com/epg/3028/2025/09/24/18-00' &&
      JSON.stringify(config.headers) === JSON.stringify(headers)
    ) {
      return Promise.resolve({
        data: fs.readFileSync(path.resolve(__dirname, '__data__/content_1824.json'), 'utf8')
      })
    } else {
      return Promise.resolve({ data: '' })
    } 
  })

  let results = await parser({ content, channel, date })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  // first set has 15 programs, check first and last
  expect(results).toHaveLength(15)

  expect(results[0]).toMatchObject({
    start: '2025-09-24T00:19:18.000Z',
    stop: '2025-09-24T01:15:01.000Z',
    title: 'Balacobaco',
    description:
      'Taís decide contar à avó a verdade sobre a morte de Teresa. Catarina aumenta a chantagem com Arthur e pede-lhe um apartamento em Nova Iorque para continuar a encontrar-se com ele. Arthur aceita a proposta. Lígia conta a Eduardo que a conta bancária de Arthur tem levantamentos astronómicos.[S]',
  })

  expect(results[14]).toMatchObject({
    start: '2025-09-24T23:28:00.000Z',
    stop: '2025-09-25T00:11:00.000Z',
    title: 'Janela Indiscreta',
    description: 'O Janela Indiscreta é o seu programa de cinema! Apresenta, em primeira mão, estreias cinematográficas e entrevistas exclusivas aos protagonistas das produções nacionais e internacionais, dando a conhecer curiosidades e histórias de bastidores.[S]',
  })
})

it('can handle empty guide', done => {
  parser({content:'{}', channel, date})
    .then(result => {
      expect(result).toMatchObject([])
      done()
    })
    .catch(done)
})
