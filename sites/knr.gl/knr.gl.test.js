const { parser, url, request } = require('./knr.gl.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-22', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '#',
  xmltv_id: 'KNR.gl'
}

it('can generate valid url', () => {
  expect(url).toBe('https://knr.gl/kl/tv/aallakaatitassat?ajax_form=1')
})

it('can generate valid request method', () => {
  expect(request.method).toBe('POST')
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({})
})

it('can generate valid request data', () => {
  const params = request.data({ date })

  expect(params.get('list_date')).toBe('2021-11-22')
  expect(params.get('form_id')).toBe('knr_radio_tv_program_overview_form')
  expect(params.get('_triggering_element_name')).toBe('list_date')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  const results = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2021-11-22T11:00:00.000Z',
    stop: '2021-11-22T11:30:00.000Z',
    title: 'Issittormiuaqqat'
  })

  expect(results[4]).toMatchObject({
    start: '2021-11-22T13:00:00.000Z',
    stop: '2021-11-22T13:30:00.000Z',
    title: 'KNR2: Tusagassiortunik katersortitsineq - Erik Jensen',
    description:
      'Naalakkersuisoq Erik Jensen tusagassiortunut 21.november nal. 10.00-11.00 katersortitsissaaq attassisinnaanermut siuariartornermullu pilersaarut pillugu (holdbarheds- og vækstplan).'
  })
})

it('can handle empty guide', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json'))
  const result = parser({
    date,
    channel,
    content
  })
  expect(result).toMatchObject([])
})
