const { parser, url, request } = require('./tvplus.com.tr.config.js')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2026-04-22', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: '32' }

axios.post.mockImplementation(url => {
  if (url === 'https://izmaottvsc14.tvplus.com.tr:33207/EPG/JSON/Authenticate') {
    return Promise.resolve({
      headers: {
        'set-cookie': [
          'XSESSIONID=05DIPYMD4BHOKRQCZTHF8F5GHMMBCNJ6; Domain=izmaottvsc14.tvplus.com.tr; Path=/; Secure; HttpOnly',
          'JSESSIONID=05DIPYMD4BHOKRQCZTHF8F5GHMMBCNJ6; Domain=izmaottvsc14.tvplus.com.tr; Path=/; HttpOnly'
        ]
      }
    })
  }
})

it('can generate valid url', () => {
  expect(url).toBe('https://izmaottvsc14.tvplus.com.tr:33207/EPG/JSON/PlayBillList')
})

it('can generate valid request method', () => {
  expect(request.method).toBe('POST')
})

it('can generate valid request headers', async () => {
  const headers = await request.headers()
  expect(headers).toMatchObject({
    cookie:
      'XSESSIONID=05DIPYMD4BHOKRQCZTHF8F5GHMMBCNJ6; Domain=izmaottvsc14.tvplus.com.tr; Path=/; Secure; HttpOnly;JSESSIONID=05DIPYMD4BHOKRQCZTHF8F5GHMMBCNJ6; Domain=izmaottvsc14.tvplus.com.tr; Path=/; HttpOnly'
  })
})

it('can generate valid request data', () => {
  expect(request.data({ channel, date })).toMatchObject({
    type: '2',
    channelid: '32',
    begintime: '20260422000000',
    endtime: '20260423000000',
    isFillProgram: 1
  })
})

it('can parse response', () => {
  const content = fs.readFileSync(path.join(__dirname, '__data__', 'content.json'))
  const results = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(18)
  expect(results[0]).toMatchObject({
    start: '2026-04-21T23:30:00.000Z',
    stop: '2026-04-22T01:15:00.000Z',
    title: 'Bu Ülke',
    description:
      "Türkiye'nin gündemindeki merak edilen ve tartışılan sorular, siyaset, ekonomi, toplumsal meseleler ve kültür-eğitim başlıklarıyla ele alınıyor. Uzman konuklar ve sahadan aktarılan bilgilerle olayların arka planı izleyiciye aktarılıyor.",
    icon: 'https://izmaottvsc14.tvplus.com.tr:33207/CPS/images/universal/film/program/202604/20260414/0/0005330799055eb7f426.jpg',
    image:
      'https://izmaottvsc14.tvplus.com.tr:33207/CPS/images/universal/film/program/202604/20260414/10/0005330799045eb7f426.jpg',
    category: 'Haber'
  })
  expect(results[17]).toMatchObject({
    start: '2026-04-22T23:00:00.000Z',
    stop: '2026-04-23T01:15:00.000Z',
    title: 'Açık Görüş',
    description:
      'Açık Görüş, farklı alanlardan uzman konukları ağırlayarak, güncel politika, ekonomi, kültür ve toplumsal meseleleri kapsamlı bir şekilde ele alan bilgilendirici bir programdır. Tartışmalar, izleyicilere olayları çok yönlü değerlendirme imkânı sunar.',
    icon: 'https://izmaottvsc14.tvplus.com.tr:33207/CPS/images/universal/film/program/202604/20260418/58/0905279525125eb9b42e.jpg',
    image:
      'https://izmaottvsc14.tvplus.com.tr:33207/CPS/images/universal/film/program/202604/20260418/44/0905279525115eb9b42e.jpg',
    category: 'Magazin'
  })
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: ''
  })
  expect(result).toMatchObject([])
})
