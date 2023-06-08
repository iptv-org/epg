// npx epg-grabber --config=sites/movistarplus.es/movistarplus.es.config.js --channels=sites/movistarplus.es/movistarplus.es.channels.xml --output=guide.xml

const { parser, url, request } = require('./movistarplus.es.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-03-11', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'TVE',
  xmltv_id: 'SomeChannel.es'
}

it('can generate valid url', () => {
  expect(url({ date })).toBe('https://www.movistarplus.es/programacion-tv/2022-03-11?v=json')
})

it('can parse response', () => {
  const content = `{"success":"true","msg":"","data":{"TVE-CODE":{"DATOS_CADENA":{"CODIGO":"TVE","MARCA":"TVE","NOMBRE":"LA 1","URL":"https://www.movistarplus.es/canal?nombre=LA%2B1&id=TVE","DIAL_PRINCIPAL":["01"],"DIALES":[1],"UID":null,"CASID":null,"SERVICEUID":null,"SERVICEUID2":null,"SERVICEID":null,"ESVIRTUAL":null,"ESSATELITE":null,"UPSELLING":null,"puntoReproduccion":null},"PROGRAMAS":[{"DIRECTO":false,"TEMPORADA":"","TITULO":"Telediario Matinal","GENERO":"Información","CODIGO_GENERO":"IF","DURACION":150,"DURACION_VISUAL":150,"HORA_INICIO":"06:00","HORA_FIN":"08:30","ELEMENTO":"1709045","EVENTO":"99422566","ShowId":null,"x1":0,"x2":0,"Disponible":null,"URL":"https://www.movistarplus.es/ficha/telediario-matinal?tipo=R&id=99422566"},{"DIRECTO":false,"TEMPORADA":"","TITULO":"Las Claves del Siglo XXI: Episodio 8","GENERO":"Información","CODIGO_GENERO":"IF","DURACION":135,"DURACION_VISUAL":135,"HORA_INICIO":"22:15","HORA_FIN":"00:30","ELEMENTO":"2051356","EVENTO":"99422634","ShowId":null,"x1":0,"x2":0,"Disponible":null,"URL":"https://www.movistarplus.es/ficha/las-claves-del-siglo-xxi-t1/episodio-8?tipo=R&id=99422634"},{"DIRECTO":false,"TEMPORADA":"","TITULO":"Noticias 24H","GENERO":"Información","CODIGO_GENERO":"IF","DURACION":170,"DURACION_VISUAL":170,"HORA_INICIO":"03:10","HORA_FIN":"06:00","ELEMENTO":"518403","EVENTO":"99422646","ShowId":null,"x1":0,"x2":0,"Disponible":null,"URL":"https://www.movistarplus.es/ficha/noticias-24h?tipo=R&id=99422646"}]}}}`
  const result = parser({ content, channel, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })
  expect(result).toMatchObject([
    {
      start: '2022-03-11T05:00:00.000Z',
      stop: '2022-03-11T07:30:00.000Z',
      category: 'Información',
      title: `Telediario Matinal`
    },
    {
      start: '2022-03-11T21:15:00.000Z',
      stop: '2022-03-11T23:30:00.000Z',
      category: 'Información',
      title: `Las Claves del Siglo XXI: Episodio 8`
    },
    {
      start: '2022-03-12T02:10:00.000Z',
      stop: '2022-03-12T05:00:00.000Z',
      category: 'Información',
      title: `Noticias 24H`
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: `{"success":"true","msg":"","data":{}}`
  })
  expect(result).toMatchObject([])
})
