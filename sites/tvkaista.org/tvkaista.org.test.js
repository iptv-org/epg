const { parser, url } = require('./tvkaista.org.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

let date = dayjs.utc('2025-03-01', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: 'yle-tv1' }

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe('https://www.tvkaista.org/yle-tv1/2025-03-01')
})

it('can parse response for today', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content_1.html'))

  let results = parser({ content, date })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()

    return p
  })

  expect(results.length).toBe(45)
  expect(results[0]).toMatchObject({
    title: 'Alice & Jack',
    description:
      'Kausi 1, 2/6. Säröjä. Jack on onnellisesti naimisissa, ja on pienen tyttären isä. Yllättävä puhelu Alicelta suistaa Jackin elämän kuitenkin pois raiteiltaan. Tunteiden myllerryksessä Jack suostuu tapaamaan Alicen salassa vaimoltaa',
    season: 1,
    episode: 2,
    rating: {
      system: 'VET',
      value: '12'
    },
    categories: ['Sarja'],
    start: '2025-02-28T21:20:00.000Z',
    stop: '2025-02-28T22:04:00.000Z'
  })
})

it('can parse response for next day', () => {
  date = dayjs.utc('2025-03-03', 'YYYY-MM-DD').startOf('d')
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content_2.html'))

  let results = parser({ content, date })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()

    return p
  })

  expect(results.length).toBe(39)
  expect(results[0]).toMatchObject({
    title: 'Sodan silpoma elämä',
    description:
      'Oleh Stahanov haavoittui vakavasti Itä-Ukrainan rintamalla. Miten elämä rakennetaan uudelleen, kun toipuminen vaatii selviytymistä niin fyysisistä vammoista kuin henkisestä taakastakin? Ohjaus: Viivi Berghem (Suomi 2024)',
    start: '2025-03-02T21:05:00.000Z',
    stop: '2025-03-02T22:02:00.000Z'
  })
  expect(results[5]).toMatchObject({
    title: 'La Promesa - Salaisuuksien kartano',
    description:
      'Kausi 1, 3/122. Päätöksen vaikeus. Jimena pääsee lennolle Manuelin kanssa tämän tunnustettua ensin lentokilpailuun osallistumisensa. Johtaako lento näiden kahden lähentymiseen? Onko mysteerikokin henkilöllisy',
    season: 1,
    episode: 3,
    categories: ['Sarja'],
    rating: {
      system: 'VET',
      value: '12'
    },
    start: '2025-03-03T08:00:00.000Z',
    stop: '2025-03-03T08:52:00.000Z'
  })
  expect(results[38]).toMatchObject({
    title: 'Unelma työstä',
    description:
      'Noin miljoona suomalaista on joko työttömänä tai työskentelee osa- tai määräaikaisessa työsuhteessa. Dokumentissa tarinansa kertoo entinen työministeri, loppuun palanut oikeustieteen tohtori, akateeminen pätkätyöläinen ja nuori teatte',
    start: '2025-03-03T21:15:00.000Z',
    stop: '2025-03-03T22:11:00.000Z'
  })
})

it('can handle empty guide', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/no_content.html'))
  const results = parser({ content, date })

  expect(results).toMatchObject([])
})
