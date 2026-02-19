const { parser, url } = require('./france.tv.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2026-02-19', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'france2',
  xmltv_id: 'France2.fr@HD'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe('https://www.france.tv/api/epg/videos/?date=2026-02-19&channel=france2')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  const results = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(18)
  expect(results[0]).toMatchObject({
    title: 'Le 6h info - Émission du jeudi 19 février 2026',
    description: "Un rendez-vous réveil-matin, avec un point sur l'actualité assorti de différentes rubriques qui permettent d'en explorer certains aspects plus en profondeur.",
    image: 'https://medias.france.tv/S9p5NdAs4OR2UbyC1NIQWsYV-K4/240x0/filters:quality(85):format(webp)/b/f/3/e85c2e8fed4a4955965dfff63c3843fb.jpg',
    start: '2026-02-19T06:00:00.000Z',
    stop: '2026-02-19T06:30:00.000Z'
  })
  expect(results[17]).toMatchObject({
    title: 'JO Club - Émission du jeudi 19 février 2026',
    description: "Tous les soirs, tout au long de ces Jeux olympiques d'hiver de Milan-Cortina, Laurent Luyat revient, avec les journalistes et consultants de France Télévisions, sur les épreuves de la journée. Il accueille les athlètes et les médaillés du jour. La journée a été marquée par du combiné nordique, avec l'épreuve par équipes messieurs, les demi-final...",
    image: 'https://medias.france.tv/xuxaBPNFyhMiVB5eeYrZV_1nPj4/240x0/filters:quality(85):format(webp)/v/p/h/phpmhbhpv.jpg',
    start: '2026-02-19T23:00:00.000Z',
    stop: '2026-02-20T00:00:00.000Z'
  })
})

it('can handle empty guide', () => {
  const results = parser({ content: [], date })

  expect(results).toMatchObject([])
})
