const { parser, url } = require('./rikstv.no.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-01-14', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '47',
  xmltv_id: 'NRK1.no'
}

describe('rikstv.no Module Tests', () => {
  it('can generate valid url', () => {
    expect(url({ date, channel })).toBe(
      `https://play.rikstv.no/api/content-search/1/channel/${channel.site_id}/epg/${date.format(
        'YYYY-MM-DD'
      )}`
    )
  })

  it('can parse response', () => {
    const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
    const result = parser({ content }).map(p => {
      p.start = dayjs(p.start).toISOString()
      p.stop = dayjs(p.stop).toISOString()
      return p
    })

    expect(result).toMatchObject([
      {
        title: 'Vakre og ville Oman',
        sub_title: 'Vakre og ville Oman',
        description:
          'Oman er eit arabisk skattkammer av unike habitat og variert dyreliv. Rev, kvalhai, reptil og skjelpadder er blant skapningane du finn her.',
        season: 1,
        episode: 1,
        category: ['Dokumentar', 'Fakta', 'Natur'],
        actors: ['Gergana Muskalla'],
        directors: 'Stefania Muller',
        icon: 'https://imageservice.rikstv.no/hash/EC206C374F42287C0BDF850A7D3CB4D3.jpg',
        start: '2025-01-13T23:00:00.000Z',
        stop: '2025-01-13T23:55:00.000Z'
      }
    ])
  })

  it('can handle empty guide', () => {
    const result = parser({
      content: '[]'
    })
    expect(result).toMatchObject([])
  })
})
