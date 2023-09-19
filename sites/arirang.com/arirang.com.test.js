// npx epg-grabber --config=sites/arirang.com/arirang.com.config.js --channels=sites/arirang.com/arirang.com.channels.xml --output=guide.xml --days=2
// npx jest arirang.com.test.js

const { url, parser } = require('./arirang.com.config.js')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const { program } = require('commander')
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.tz('2023-08-25', 'Asia/Seoul').startOf('d')
const channel = { xmltv_id: 'ArirangWorld.kr', site_id: 'CH_W', name: 'Arirang World', lang: 'en', logo: 'https://i.imgur.com/5Aoithj.png' }
const content = fs.readFileSync(path.resolve(__dirname, '__data__/schedule.json'), 'utf8')
const programDetail = fs.readFileSync(path.resolve(__dirname, '__data__/detail.json'), 'utf8')
const context = { 'channel': channel, 'content': content, 'date': date }

it('can generate valid url', () => {
    expect(url).toBe('https://www.arirang.com/v1.0/open/external/proxy')
})

it('can handle empty guide', async () => {
    const results = await parser({ 'channel': channel, 'content': '', 'date': date })
    expect(results).toMatchObject([])
})

it('can parse response', async () => {
    axios.post.mockImplementation((url, data) => {
        if (url === 'https://www.arirang.com/v1.0/open/external/proxy' && JSON.stringify(data) === JSON.stringify({ "address": "https://script.arirang.com/api/v1/bis/listScheduleV3.do", "method": "POST", "headers": {}, "body": { "data": { "dmParam": { "chanId": "CH_W", "broadYmd": "20230825", "planNo": "1" } } } })) {
            return Promise.resolve({
                data: JSON.parse(content)
            })
        } else if (url === 'https://www.arirang.com/v1.0/open/program/detail' && JSON.stringify(data) === JSON.stringify({ "bis_program_code": "2023004T" })) {
            return Promise.resolve({
                data: JSON.parse(programDetail)
            })
        } else {
            return Promise.resolve({
                data: ''
            })
        }
    })

    const results = await parser(context)

    expect(results[0]).toMatchObject(
        {
            title: "WITHIN THE FRAME [R]",
            start: dayjs.tz(date, 'Asia/Seoul'),
            stop: dayjs.tz(date, 'Asia/Seoul').add(30, 'minute'),
            icon: "https://img.arirang.com/v1/AUTH_d52449c16d3b4bbca17d4fffd9fc44af/public/images/202308/2080840096998752900.png",
            description: "NEWS",
            category: "Current Affairs"
        }
    )
})