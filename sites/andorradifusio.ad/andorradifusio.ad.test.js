// npx epg-grabber --config=sites/andorradifusio.ad/andorradifusio.ad.config.js --channels=sites/andorradifusio.ad/andorradifusio.ad.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./andorradifusio.ad.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-24', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'atv',
  xmltv_id: 'AndorraTV.ad'
}

it('can generate valid url', () => {
  expect(url({ channel })).toBe('https://www.andorradifusio.ad/programacio/atv')
})

it('can parse response', () => {
  const content = `<!DOCTYPE html><html lang="ca"> <head></head> <body id="rtvabody"> <div class="container"> <div class="row"> <div class="col-sm-12"> <div class="programacio-dia"> <h3>dimecres <span class="dia">24 nov.</span></h3> <h4>07:00</h4> <p>Club Piolet</p><h4>23:30</h4> <p>Informatiu vespre</p><h4>01:00</h4> <p>&#192;rea Andorra Difusi&#243;</p></div><div class="programacio-dia"> <h3>dijous <span class="dia">25 nov.</span></h3> <h4>07:00</h4> <p>Club Piolet</p></div></div></div></div></body></html>`
  const result = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2021-11-24T06:00:00.000Z',
      stop: '2021-11-24T22:30:00.000Z',
      title: `Club Piolet`
    },
    {
      start: '2021-11-24T22:30:00.000Z',
      stop: '2021-11-25T00:00:00.000Z',
      title: `Informatiu vespre`
    },
    {
      start: '2021-11-25T00:00:00.000Z',
      stop: '2021-11-25T01:00:00.000Z',
      title: `Àrea Andorra Difusió`
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
