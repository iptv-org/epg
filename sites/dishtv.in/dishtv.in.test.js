const { parser, url, request } = require('./dishtv.in.config.js')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

axios.post.mockImplementation((url, data, params) => {
  if (
    url === 'https://www.dishtv.in/services/epg/signin' &&
    data === null &&
    JSON.stringify(params) ===
      JSON.stringify({
        headers: {
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
          'x-requested-with': 'XMLHttpRequest',
          Referer: 'https://www.dishtv.in/channel-guide.html'
        }
      })
  ) {
    const content = fs.readFileSync(path.resolve(__dirname, '__data__/session.json'))

    return Promise.resolve({
      data: JSON.parse(content)
    })
  } else {
    return Promise.resolve({
      data: ''
    })
  }
})

const date = dayjs.utc('2025-01-26', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: '142639', xmltv_id: 'AndpriveHD.in' }

it('can generate valid url', () => {
  expect(url).toBe('https://epg.mysmartstick.com/dishtv/api/v1/epg/entities/programs')
})

it('can generate valid request method', () => {
  expect(request.method).toBe('POST')
})

it('can generate valid request headers', async () => {
  expect(await request.headers()).toMatchObject({
    Authorization:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnRpZCI6ImRpc2h0di13ZWJzaXRlIiwicGxhdGZvcm0iOiJkaXNodHYiLCJpYXQiOjE3Mzc2ODIxNjEsImV4cCI6MTczNzc2ODU2MX0.sPrYfodVTbf1kJ-wGICDlnH-Yt3J0-mB-M2YROU8v2Q'
  })
})

it('can generate valid request data', () => {
  expect(request.data({ channel, date })).toMatchObject({
    allowPastEvents: true,
    channelid: '142639',
    date: '26/01/2025'
  })
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  let results = parser({ content })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(16)
  expect(results[0]).toMatchObject({
    start: '2025-01-26T00:30:00.000Z',
    stop: '2025-01-26T02:05:00.000Z',
    title: [
      { lang: 'en', value: 'Train to Busan 2: Peninsula' },
      { lang: 'hi', value: 'ट्रेन टू बुसान 2: पेनीनसुला' },
      { lang: 'ta', value: 'ட்ரெயின் டு பூசன் ப்ரெசென்ட்ஸ்: பெனின்சுலா' },
      { lang: 'te', value: 'ట్రేన్ టు బూసాన్ ప్రజెంట్స్: పెనిన్సులా' }
    ],
    description: [
      {
        lang: 'en',
        value:
          'Jung Seok, a former soldier, along with his teammates, sets out on a mission to battle hordes of post-apocalyptic zombies in the Korean peninsula wastelands.'
      },
      {
        lang: 'hi',
        value:
          'एक भूतपूर्व सैनिक जंग सोक अपने साथियों के साथ कोरियाई प्रायद्वीप के बंजर इलाकों में सर्वनाश के बाद की जोंबी से लड़ने के मिशन पर निकलता है।'
      },
      {
        lang: 'ta',
        value:
          'கொரிய தீபகற்பத்தின் தரிசு நிலங்களில் அபோகாலிப்டிக் ஜாம்பிக்களின் கூட்டத்தை எதிர்த்து தன் குழுவுடன் போரிடும் ஜங் சியோக்.'
      },
      {
        lang: 'te',
        value:
          'మాజీ సైనికుడు జంగ్ సియోక్ తన సహచరులతో కలిసి కొరియా ద్వీపకల్పంలో పోస్ట్-అపోకలిప్టిక్ జాంబీలతో యుద్దానికి సిద్దమవుతాడు.'
      }
    ],
    category: [
      { lang: 'en', value: 'Film' },
      { lang: 'hi', value: 'फ़िल्म' },
      { lang: 'ta', value: '??????????' },
      { lang: 'te', value: 'సినిమా' },
      { lang: 'mr', value: 'चित्रपट' }
    ],
    actors: [
      'Gang Dong-won',
      'Lee Jung-hyun',
      'Lee Re',
      'Kwon Hae-hyo',
      'John D. Michaels',
      'Kim Min-jae',
      'Kim Doyun',
      'Lee Ye-won',
      'Daniel Joey Albright',
      'Pierce Conran',
      'Geoffrey Giuliano',
      'Milan-Devi LaBrey'
    ],
    producers: [],
    directors: ['Yeon Sang-ho'],
    icon: 'https://dtil.tmsimg.com/assets/p17850257_v_h9_al.jpg?lock=880x660',
    image: 'https://dtil.tmsimg.com/assets/p17850257_v_h8_am.jpg?lock=1280x720',
    date: '2020'
  })
})

it('can handle empty guide', () => {
  const results = parser({ content: '[]' })

  expect(results).toMatchObject([])
})
