// npm run channels:parse -- --config=./sites/melita.com/melita.com.config.js --output=./sites/melita.com/melita.com.channels.xml
// npx epg-grabber --config=sites/melita.com/melita.com.config.js --channels=sites/melita.com/melita.com.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./melita.com.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-04-20', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '4d40a9f9-12fd-4f03-8072-61c637ff6995',
  xmltv_id: 'TVM.mt'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://androme.melitacable.com/api/epg/v1/schedule/channel/4d40a9f9-12fd-4f03-8072-61c637ff6995/from/2022-04-20T00:00+00:00/until/2022-04-21T00:00+00:00'
  )
})

it('can parse response', () => {
  const content = `{"schedules":[{"id":"138dabff-131a-42a0-9373-203545933dd0","published":{"start":"2022-04-20T06:25:00Z","end":"2022-04-20T06:45:00Z"},"program":"ae52299a-3c99-4d34-9932-e21d383f9800","live":false,"blackouts":[]}],"programs":[{"id":"ae52299a-3c99-4d34-9932-e21d383f9800","title":"How I Met Your Mother","shortSynopsis":"Symphony of Illumination - Robin gets some bad news and decides to keep it to herself. Marshall decorates the house.","posterImage":"https://androme.melitacable.com/media/images/epg/bc/07/p8953134_e_h10_ad.jpg","episode":12,"episodeTitle":"Symphony of Illumination","season":"fdd6e42c-97f9-4d7a-aaca-78b53378f960","genres":["3.5.7.3"],"tags":["comedy"],"adult":false}],"seasons":[{"id":"fdd6e42c-97f9-4d7a-aaca-78b53378f960","title":"How I Met Your Mother","adult":false,"season":7,"series":"858c535a-abbb-451b-807a-94196997ea2d"}],"series":[{"id":"858c535a-abbb-451b-807a-94196997ea2d","title":"How I Met Your Mother","adult":false}]}`
  const result = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-04-20T06:25:00.000Z',
      stop: '2022-04-20T06:45:00.000Z',
      title: 'How I Met Your Mother',
      description:
        'Symphony of Illumination - Robin gets some bad news and decides to keep it to herself. Marshall decorates the house.',
      season: 7,
      episode: 12,
      icon: 'https://androme.melitacable.com/media/images/epg/bc/07/p8953134_e_h10_ad.jpg?form=epg-card-6',
      category: ['comedy']
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: `{}`
  })
  expect(result).toMatchObject([])
})
