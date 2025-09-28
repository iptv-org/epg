const { parser, url } = require('./musor.tv.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-11-19', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'HATOS_CSATORNA',
  xmltv_id: 'Hatoscsatorna.hu'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe('https://musor.tv/napi/tvmusor/HATOS_CSATORNA/2022.11.19')
})

it('can generate valid url for today', () => {
  const today = dayjs.utc().startOf('d')

  expect(url({ channel, date: today })).toBe('https://musor.tv/mai/tvmusor/HATOS_CSATORNA')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))
  const results = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2022-11-19T23:00:00.000Z',
    stop: '2022-11-19T23:30:00.000Z',
    title: 'Egészségtér',
    description:
      'Egészségtér címmel új természetgyógyászattal foglalkozó magazinműsor indult hetente fél órás időtartamban a hatoscsatornán. A műsor derűs, objektív hangvételével és szakmailag magas színvonalú ismeretterjesztő jellegével az e'
  })

  expect(results[1]).toMatchObject({
    start: '2022-11-19T23:30:00.000Z',
    stop: '2022-11-20T00:00:00.000Z',
    title: 'Tradíció Klipek',
    description: 'Tradíció Klipek Birinyi József néprajzi, vallási, népzenei, népszokás filmjeiből.'
  })
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    content: '<!DOCTYPE html><html><head></head><body></body></html>'
  })
  expect(result).toMatchObject([])
})
