// npx epg-grabber --config=sites/knr.gl/knr.gl.config.js --channels=sites/knr.gl/knr.gl.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./knr.gl.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-22', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '#',
  xmltv_id: 'KNRTV.gl'
}

it('can generate valid url', () => {
  expect(url({ date })).toBe('https://knr.gl/admin/knr/TV/program/2021-11-22/gl')
})

it('can parse response', () => {
  const content = `{\"program_list\":\"\\u003Cdt class=\\u0022program\\u0022\\u003E\\u003Cstrong\\u003E08:00\\u003C\\\/strong\\u003E Meeqqanut - Toqqorsivimmiit\\u003C\\\/dt\\u003E\\u003Cdt class=\\u0022knr-program-pointer knr-program-togle-program\\u0022 data-program-id=\\u0022588574\\u0022 data-module-path=\\u0022sites\\\/knr\\\/modules\\\/custom\\\/knr_site\\u0022\\u003E\\u003Cimg height=\\u00229\\u0022 width=\\u00229\\u0022 id=\\u0022icon_588574\\u0022 alt=\\u0022View description\\u0022 src=\\u0022\\\/sites\\\/knr\\\/modules\\\/custom\\\/knr_site\\\/assets\\\/img\\\/plus.gif\\u0022\\u003E\\u003Cstrong\\u003E08:30\\u003C\\\/strong\\u003E ICC 2018 Piorsarsimassutikkut pisut (1:3)\\u003C\\\/dt\\u003E\\u003Cdd id=\\u0022program_588574\\u0022 style=\\u0022display: none;\\u0022\\u003E\\u003Cdiv class=\\u0022box\\u0022\\u003E2018 ICC ataatsimersuareernerata kingorna unnukkut piorsarsimassutsikkut pisut takutinneqarput. Aammalu illoqarfik Utqiagvik ilisaritinneqarluni. Ove Heilmann, Aannguaq Nielsen, Aannguaq Reimer-Johansen\\r\\nKNR 09.12.2018\\u003C\\\/div\\u003E\\u003C\\\/dd\\u003E\"}`
  const result = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2021-11-22T11:00:00.000Z',
      stop: '2021-11-22T11:30:00.000Z',
      title: `Meeqqanut - Toqqorsivimmiit`
    },
    {
      start: '2021-11-22T11:30:00.000Z',
      stop: '2021-11-22T12:30:00.000Z',
      title: `ICC 2018 Piorsarsimassutikkut pisut (1:3)`,
      description:
        '2018 ICC ataatsimersuareernerata kingorna unnukkut piorsarsimassutsikkut pisut takutinneqarput. Aammalu illoqarfik Utqiagvik ilisaritinneqarluni. Ove Heilmann, Aannguaq Nielsen, Aannguaq Reimer-Johansen KNR 09.12.2018'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: `{"program_list":""}`
  })
  expect(result).toMatchObject([])
})
