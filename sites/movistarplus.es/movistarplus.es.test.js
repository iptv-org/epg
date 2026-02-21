const { parser, url } = require('./movistarplus.es.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)
const axios = require('axios')
jest.mock('axios')

const date = dayjs.utc('2026-02-09', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'sexta',
  xmltv_id: 'LaSexta.es'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://ottcache.dof6.com/movistarplus/webplayer/OTT/epg?from=2026-02-09T00:00:00&span=1&channel=sexta&version=8&mdrm=true&tlsstream=true&demarcation=18'
  )
})

it('can parse response', async () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'), 'utf8')

  // Ficha for both results
  axios.get.mockImplementation(url => {
    if (
      url ===
      'https://ottcache.dof6.com/movistarplus/webplayer/contents/63188242/details?mediaType=FOTOV&profile=OTT&mode=U7D2&channels=SEXTA&version=8&tlsStream=true&mdrm=true&catalog=catchup&showNonRated=true'
    ) {
      return Promise.resolve({
        data: JSON.parse(fs.readFileSync(path.resolve(__dirname, '__data__/ficha.json'), 'utf8'))
      })
    } else if (
      url === 'https://ottcache.dof6.com/movistarplus/webplayer/contents/63182873/details?mediaType=FOTOV&profile=OTT&mode=VODREJILLA&channels=SEXTA&version=8&tlsStream=true&mdrm=true&catalog=events&showNonRated=true'
    ) {
      return Promise.resolve({
        data: JSON.parse(fs.readFileSync(path.resolve(__dirname, '__data__/ficha2.json'), 'utf8'))
      })
    }
  })
  

  let results = await parser({ content, date })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(21)
  expect(results[0]).toMatchObject({
    start: '2026-02-08T21:45:00.000Z',
    stop: '2026-02-09T00:30:00.000Z',
    title: 'Especial ARV elecciones Aragón',
	  description: 'Antonio García Ferreras y Ana Pastor analizan y debaten sobre el recuento y los resultados que arrojen las urnas con analistas como Lluís Orriols, Antonio Maestre, Ignacio Escolar, Pilar Velasco, Santiago Martínez Vares y Pablo Montesinos.'
  })
  expect(results[19]).toMatchObject({
    start: '2026-02-09T20:30:00.000Z',
    stop: '2026-02-09T22:00:00.000Z',
    title: 'El intermedio',
	  description: 'El Gran Wyoming, con la ayuda de sus colaboradores, analiza en clave de humor las noticias más importantes del día. El sello inconfundible del cómico sirve para completar la información desde un punto de vista más distendido e irónico.'
  })
})


it('can handle empty guide', async () => {
  const results = await parser({
    date,
	channel,
    content: '[]'
  })

  expect(results).toMatchObject([])
})
