// npx epg-grabber --config=sites/nhk.or.jp/nhk.or.jp.config.js --channels=sites/nhk.or.jp/nhk.or.jp.channels.xml --output=guide.xml --days=2
// npx jest nhk.or.jp.test.js

const { url, parser } = require('./nhk.or.jp.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const date = dayjs.utc('2023-04-29', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: '0', xmltv_id: 'NHKWorldJapan.jp', lang: 'en', logo: 'https://www3.nhk.or.jp/nhkworld/common/site_images/nw_webapp_1024x1024.png' }

it('can generate valid url', () => {
    expect(url({ channel, date })).toBe('https://nwapi.nhk.jp/nhkworld/epg/v7b/world/s1682726400000-e1682812800000.json')
})

it('can parse response', () => {
    const content = `{"channel":{"item":[{"seriesId":"1007","airingId":"000","title":"NHK NEWSLINE","description":"NHK WORLD-JAPAN's flagship hourly news program delivers the latest world news, business and weather, with a focus on Japan and the rest of Asia.","link":"/nhkworld/en/news/","pubDate":"1682726400000","endDate":"1682727000000","vodReserved":false,"jstrm":"1","wstrm":"1","subtitle":"","content":"","content_clean":"","pgm_gr_id":"","thumbnail":"/nhkworld/upld/thumbnails/en/tv/regular_program/340aed63308aafd1178172abf6325231_large.jpg","thumbnail_s":"/nhkworld/upld/thumbnails/en/tv/regular_program/340aed63308aafd1178172abf6325231_small.jpg","showlist":"0","internal":"0","genre":{"TV":"11","Top":"","LC":""},"vod_id":"","vod_url":"","analytics":"[nhkworld]simul;NHK NEWSLINE;w02,001;1007-000-2023;2023-04-29T09:00:00+09:00"}]}}`
    const results = parser({ content })

    expect(results).toMatchObject([
        {
            title: 'NHK NEWSLINE',
            start: dayjs(1682726400000),
            stop: dayjs(1682727000000),
            description: `NHK WORLD-JAPAN's flagship hourly news program delivers the latest world news, business and weather, with a focus on Japan and the rest of Asia.`,
            icon: 'https://www.nhk.or.jp/nhkworld/upld/thumbnails/en/tv/regular_program/340aed63308aafd1178172abf6325231_large.jpg',
            sub_title: ''
        }
    ])
})

it('can handle empty guide', () => {
    const results = parser({ content: '' })

    expect(results).toMatchObject([])
})
