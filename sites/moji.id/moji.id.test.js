// npx epg-grabber --config=sites/moji.id/moji.id.config.js --channels=sites/moji.id/moji.id.channels.xml --output=guide.xml --days=2
// npx jest moji.id.test.js

const { url, parser } = require('./moji.id.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const date = dayjs.utc('2023-04-29', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: '0', xmltv_id: 'moji.id', lang: 'en', logo: 'https://moji.id/site/uploads/logo/62f9387ce00a2-224-x-71.png' }

it('can generate valid url', () => {
    expect(url({ channel, date })).toBe('https://moji.id/schedule')
})