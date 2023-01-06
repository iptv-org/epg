// npx epg-grabber --config=sites/comteco.com.bo/comteco.com.bo.config.js --channels=sites/comteco.com.bo/comteco.com.bo.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./comteco.com.bo.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-25', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'ABYA YALA',
  xmltv_id: 'AbyaYalaTV.bo'
}
const content = `<!DOCTYPE html><html dir="ltr" lang="es"> <head></head> <body class=""> <div id="wrapper" class="clearfix"> <div class="main-content"> <section class="rubroguias"> <div class="container pt-70 pb-40"> <div class="section-content"> <form method="post" accept-charset="utf-8" class="reservation-form mb-0" role="form" id="myform" action="/pages/canales-y-programacion-tv/paquete-oro/ABYA%20YALA" > <div style="display: none"><input type="hidden" name="_method" value="POST"/></div><div class="row"> <div class="col-sm-5"> <div class="col-xs-5 col-sm-7"> <img src="/img/upload/canales/abya-yala.png" alt="" class="img-responsive"/> </div><div class="col-xs-7 col-sm-5 mt-sm-50 mt-lg-50 mt-md-50 mt-xs-20"> <p><strong>Canal Analógico:</strong> 48</p></div></div></div></form> <div class="row"> <div class="col-sm-12"> <div class="row mt-0"> <div class="single-service"> <h3 class=" text-theme-colored line-bottom text-theme-colored mt-0 text-uppercase " > ABYA YALA </h3> <div id="datosasociados"> <div class="list-group"> <div href="#" class="list-group-item bg-white-f1"> <div class="row"> <div class="col-xs-11"> <p class="mb-0"> <span class="text-red mr-15">00:00:00</span> <strong>Abya Yala noticias - 3ra edición</strong> </p></div></div></div><div href="#" class="list-group-item bg-white-f1"> <div class="row"> <div class="col-xs-11"> <p class="mb-0"> <span class="text-red mr-15">01:00:00</span> <strong>Cierre de emisión</strong> </p></div></div></div><div href="#" class="list-group-item bg-white-f1"> <div class="row"> <div class="col-xs-11"> <p class="mb-0"> <span class="text-red mr-15">23:00:00</span> <strong>Referentes</strong> </p></div></div></div><p class="mt-20"> <a href="/pages/canales-y-programacion-tv" class="btn btn-border btn-gray btn-transparent btn-circled" >Regresar a canales</a > </p></div></div></div></div></div></div></div></div></section> </div></div></body></html>`

it('can generate valid url', () => {
  expect(url({ channel })).toBe(
    'https://comteco.com.bo/pages/canales-y-programacion-tv/paquete-oro/ABYA YALA'
  )
})

it('can generate valid request method', () => {
  expect(request.method).toBe('POST')
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    'Content-Type': 'application/x-www-form-urlencoded'
  })
})

it('can generate valid request data', () => {
  const result = request.data({ date })
  expect(result.get('_method')).toBe('POST')
  expect(result.get('fechaini')).toBe('25/11/2021')
  expect(result.get('fechafin')).toBe('25/11/2021')
})

it('can parse response', () => {
  const result = parser({ content, channel, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2021-11-25T04:00:00.000Z',
      stop: '2021-11-25T05:00:00.000Z',
      title: `Abya Yala noticias - 3ra edición`
    },
    {
      start: '2021-11-25T05:00:00.000Z',
      stop: '2021-11-26T03:00:00.000Z',
      title: `Cierre de emisión`
    },
    {
      start: '2021-11-26T03:00:00.000Z',
      stop: '2021-11-26T03:30:00.000Z',
      title: `Referentes`
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
