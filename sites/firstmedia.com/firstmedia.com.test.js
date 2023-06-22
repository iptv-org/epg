const { url, parser } = require('./firstmedia.com.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const date = dayjs.utc('2023-06-18', 'DD/MM/YYYY').startOf('d')
const channel = { site_id: '251', xmltv_id: 'ABCAustralia.au', lang: 'id' }

it('can generate valid url', () => {
	expect(url({ channel, date })).toBe('https://www.firstmedia.com/ajax/schedule?date=18/06/2023&channel=251&start_time=1&end_time=24&need_channels=0')
})

it('can parse response', () => {
	const content = `{"entries":{"251":[{"logo":"files/images/d/new-logo/channels/11-NEWS/ABC Australia SD-FirstMedia-Chl-251.jpg","name":"ABC Australia","id":"2a800e8a-fdcc-47b3-a4a6-58d1d122b326","channel_id":"a1840c59-6c92-8233-3a02-230246aae0c4","channel_no":251,"programme_id":null,"episode":null,"title":"China Tonight","slug":null,"date":"2023-06-13 00:00:00","start_time":"2023-06-13 10:55:00","end_time":"2023-06-13 11:30:00","length":2100,"description":"China Tonight","long_description":"China is a superpower that dominates global news but it's also home to 1.4 billion stories. Sam Yang is back for a new season, hearing from the people who make this extraordinary nation what it is today.","status":"0","created_by":null,"updated_by":null,"created_at":"2023-06-13 00:20:24","updated_at":"2023-06-13 00:20:24"}]}}`
	const results = parser({ content, channel })

	expect(results).toMatchObject([
		{
			start: '2023-06-13T03:55:00.000Z',
			stop: '2023-06-13T04:30:00.000Z',
			title: 'China Tonight',
			description: 'China is a superpower that dominates global news but it\'s also home to 1.4 billion stories. Sam Yang is back for a new season, hearing from the people who make this extraordinary nation what it is today.'
		}
	])
})

it('can handle empty guide', () => {
	const results = parser({ content: '' })

	expect(results).toMatchObject([])
})