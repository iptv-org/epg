const { parser, url } = require('./mi.tv.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-24', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'ar#24-7-canal-de-noticias',
  xmltv_id: '247CanaldeNoticias.ar'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://mi.tv/ar/async/channel/24-7-canal-de-noticias/2021-11-24/0'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'), 'utf8')
  const result = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2021-11-24T03:00:00.000Z',
      stop: '2021-11-24T23:00:00.000Z',
      title: 'Trasnoche de 24/7',
      category: 'Interés general',
      description: 'Lo más visto de la semana en nuestra pantalla.',
      image: 'https://cdn.mitvstatic.com/programs/fallback_other_l_m.jpg'
    },
    {
      start: '2021-11-24T23:00:00.000Z',
      stop: '2021-11-25T01:00:00.000Z',
      title: 'Noticiero central - Segunda edición',
      category: 'Noticiero',
      description:
        'Cerramos el día con un completo resumen de los temas más relevantes con columnistas y análisis especiales para terminar el día.',
      image: 'https://cdn.mitvstatic.com/programs/fallback_other_l_m.jpg'
    },
    {
      start: '2021-11-25T01:00:00.000Z',
      stop: '2021-11-25T02:00:00.000Z',
      title: 'Plus energético',
      category: 'Cultural',
      description:
        'La energía tiene mucho para mostrar. Este programa reúne a las principales empresas y protagonistas de la actividad que esta revolucionando la región.',
      image: 'https://cdn.mitvstatic.com/programs/fallback_other_l_m.jpg'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: ''
  })
  expect(result).toMatchObject([])
})
