// npx epg-grabber --config=sites/taiwanplus.com/taiwanplus.com.config.js --channels=sites/taiwanplus.com/taiwanplus.com.channels.xml --output=guide.xml --days=3
// npx jest taiwanplus.com.test.js

const { url, parser } = require('./taiwanplus.com.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const date = dayjs.utc('2023-08-20', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: '#', xmltv_id: 'TaiwanPlusTV.tw', lang: 'en', logo: 'https://i.imgur.com/SfcZyqm.png' }

it('can generate valid url', () => {
    expect(url({ channel, date })).toBe('https://www.taiwanplus.com/api/video/live/schedule/0')
})

it('can parse response', () => {
    const content = `{"data":[{"date":"2023/08/20","weekday":"SUN","schedule":[{"programId":30668,"dateTime":"2023/08/20 00:00","time":"00:00","image":"https://prod-img.taiwanplus.com/live-schedule/Single/S30668_20230810104937.webp","title":"Master Class","shortDescription":"From blockchain to Buddha statues, Taiwan’s culture is a kaleidoscope of old and new just waiting to be discovered.","description":"From blockchain to Buddha statues, Taiwan’s culture is a kaleidoscope of old and new just waiting to be discovered.","ageRating":"0+","programWebSiteType":"4","url":"","vodId":null,"categoryId":90000474,"categoryType":2,"categoryName":"TaiwanPlus ✕ Discovery","categoryFullPath":"Originals/TaiwanPlus ✕ Discovery","encodedCategoryFullPath":"originals/taiwanplus-discovery"}]}],"success":true,"code":"0000","message":""}`

    const results = parser({ content, date })

    expect(results).toMatchObject([
        {
            title: 'Master Class',
            start: dayjs.utc('2023/08/20 00:00', 'YYYY/MM/DD HH:mm'),
            stop: dayjs.utc('2023/08/21 00:00', 'YYYY/MM/DD HH:mm'),
            description: `From blockchain to Buddha statues, Taiwan’s culture is a kaleidoscope of old and new just waiting to be discovered.`,
            icon: 'https://prod-img.taiwanplus.com/live-schedule/Single/S30668_20230810104937.webp',
            category: 'TaiwanPlus ✕ Discovery',
            rating: '0+'
        }
    ])
})

it('can handle empty guide', () => {
    const results = parser({ content: '' })

    expect(results).toMatchObject([])
})
