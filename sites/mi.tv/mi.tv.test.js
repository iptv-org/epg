// npx epg-grabber --config=sites/mi.tv/mi.tv.config.js --channels=sites/mi.tv/mi.tv_ar.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./mi.tv.config.js')
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
const content = `<div id="listings"> <div class="channel-info"> <img src="https://cdn.mitvstatic.com/channels/ar_24-7-canal-de-noticias_m.png" alt="Programación 24/7 Canal de Noticias" title="24/7 Canal de Noticias" width="75" height="75"/> <h1>Programación 24/7 Canal de Noticias <span>Miércoles 24 de noviembre</span></h1> </div><ul class="broadcasts time24"> <li> <a href="/ar/programas/trasnoche-de-24-7" class="program-link"> <div class="image-parent"> <div class="image" style=" background-image: url('https://cdn.mitvstatic.com/programs/fallback_other_l_m.jpg'); " ></div></div><div class="content"> <span class="time">03:00</span> <h2>Trasnoche de 24/7</h2> <span class="sub-title">Interés general</span> <p class="synopsis">Lo más visto de la semana en nuestra pantalla.</p></div></a> </li><li class="native"> <div id="div-gpt-ad-1586617865827-0"></div></li><li> <a href="/ar/programas/noticiero-central-segunda-edicion" class="program-link"> <div class="image-parent"> <div class="image" style=" background-image: url('https://cdn.mitvstatic.com/programs/fallback_other_l_m.jpg'); " ></div></div><div class="content"> <span class="time">23:00</span> <h2>Noticiero central - Segunda edición</h2> <span class="sub-title">Noticiero</span> <p class="synopsis"> Cerramos el día con un completo resumen de los temas más relevantes con columnistas y análisis especiales para terminar el día. </p></div></a> </li><li> <a href="/ar/programas/plus-energetico" class="program-link"> <div class="image-parent"> <div class="image" style=" background-image: url('https://cdn.mitvstatic.com/programs/fallback_other_l_m.jpg'); " ></div></div><div class="content"> <span class="time">01:00</span> <h2>Plus energético</h2> <span class="sub-title">Cultural</span> <p class="synopsis"> La energía tiene mucho para mostrar. Este programa reúne a las principales empresas y protagonistas de la actividad que esta revolucionando la región. </p></div></a> </li></ul></div>`

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://mi.tv/ar/async/channel/24-7-canal-de-noticias/2021-11-24/0'
  )
})

it('can parse response', () => {
  const result = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2021-11-24T03:00:00.000Z',
      stop: '2021-11-24T23:00:00.000Z',
      title: `Trasnoche de 24/7`,
      category: 'Interés general',
      description: 'Lo más visto de la semana en nuestra pantalla.',
      icon: 'https://cdn.mitvstatic.com/programs/fallback_other_l_m.jpg'
    },
    {
      start: '2021-11-24T23:00:00.000Z',
      stop: '2021-11-25T01:00:00.000Z',
      title: `Noticiero central - Segunda edición`,
      category: 'Noticiero',
      description: `Cerramos el día con un completo resumen de los temas más relevantes con columnistas y análisis especiales para terminar el día.`,
      icon: 'https://cdn.mitvstatic.com/programs/fallback_other_l_m.jpg'
    },
    {
      start: '2021-11-25T01:00:00.000Z',
      stop: '2021-11-25T02:00:00.000Z',
      title: `Plus energético`,
      category: 'Cultural',
      description: `La energía tiene mucho para mostrar. Este programa reúne a las principales empresas y protagonistas de la actividad que esta revolucionando la región.`,
      icon: 'https://cdn.mitvstatic.com/programs/fallback_other_l_m.jpg'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: `<!DOCTYPE html><html><head></head><body></body></html>`
  })
  expect(result).toMatchObject([])
})
