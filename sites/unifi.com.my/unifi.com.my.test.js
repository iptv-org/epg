// npx epg-grabber --config=sites/unifi.com.my/unifi.com.my.config.js --channels=sites/unifi.com.my/unifi.com.my.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./unifi.com.my.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2023-01-09', 'YYYY-MM-DD').startOf('d')
const channel = {
    site_id: '51882833',
    xmltv_id: 'AXNMalaysia.my'
}

it('can generate valid url', () => {
    expect(url).toBe(`https://unifi.com.my/tv/api/tv`)
})

it('can generate valid request method', () => {
    expect(request.method).toBe('POST')
})

it('can generate valid request headers', () => {
    expect(request.headers).toMatchObject({
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    })
})

it('can parse response', () => {
    const content = `[{"id":"51882833","name":"AXN","logo":"https://playtv.unifi.com.my:7047/CPS/images/universal/film/logo/202109/20210927/2021092701574706798y.png","items":[{"name":"Blue Bloods (Season 11)","interval":"one","minute":55,"start_time":"4:20am","end_time":"5:15am"}]}]`

    const result = parser({ content, channel, date }).map(p => {
      p.start = p.start.toJSON()
      p.stop = p.stop.toJSON()
      return p
    })

    expect(result).toMatchObject([
      {
        title: 'Blue Bloods (Season 11)',
        start: '2023-01-08T20:20:00.000Z',
        stop: '2023-01-08T21:15:00.000Z'
      }
    ])
  })

  it('can handle empty guide', () => {
    const content = `[{"id":"51882833","name":"AXN","logo":"https://playtv.unifi.com.my:7047/CPS/images/universal/film/logo/202109/20210927/2021092701574706798y.png","items":[]}]`
    const result = parser({ content, channel })
    expect(result).toMatchObject([])
  })