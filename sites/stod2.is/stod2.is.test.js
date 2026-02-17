const { parser, url } = require('./stod2.is.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(customParseFormat)
dayjs.extend(timezone)

const date = dayjs.utc('2025-01-03', 'YYYY-MM-DD').startOf('day')
const channel = { site_id: 'stod2', xmltv_id: 'Stod2.is' }

it('can generate valid url', () => {
  const generatedUrl = url({ date, channel })
  expect(generatedUrl).toBe('https://api.stod2.is/dagskra/api/stod2/2025-01-03')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  const result = parser({ content }).map(p => {
    p.start = p.start.toISOString()
    p.stop = p.stop.toISOString()
    return p
  })

  expect(result).toMatchObject([
    {
      title: 'Heimsókn',
      sub_title: 'Telma Borgþórsdóttir',
      description:
        'Frábærir þættir með Sindra Sindrasyni sem lítur inn hjá íslenskum fagurkerum. Heimilin eru jafn ólík og þau eru mörg en eiga það þó eitt sameiginlegt að vera sett saman af alúð og smekklegheitum. Sindri hefur líka einstakt lag á að ná fram því besta í viðmælendum sínum.',
      actors: '',
      directors: '',
      start: '2025-01-03T08:00:00.000Z',
      stop: '2025-01-03T08:15:00.000Z'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({ content: '[]' })
  expect(result).toMatchObject([])
})
