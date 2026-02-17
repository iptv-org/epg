const { parser, url, request } = require('./web.magentatv.de.config.js')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2022-03-09', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '255',
  xmltv_id: '13thStreet.de'
}

axios.request.mockImplementation(req => {
  const result = {}
  if (req.url === 'https://api.prod.sngtv.magentatv.de/EPG/JSON/Authenticate') {
    Object.assign(result, {
      headers: {
        'set-cookie': [
          'JSESSIONID=2147EBA9C59BCDC33822CFD2764E5C0B; Path=/EPG; HttpOnly; SameSite=None; Secure',
          'JSESSIONID=2147EBA9C59BCDC33822CFD2764E5C0B; Path=/EPG/; HttpOnly; SameSite=None; Secure',
          'CSESSIONID=1CF187ABCA12ED1B01ADF84C691048ED; Path=/EPG/; Secure; HttpOnly; SameSite=None',
          'CSRFSESSION=ea2329ba213271192bffd77c2fa276086a8e828c1a4ee379; Path=/EPG/; SameSite=None; Secure'
        ] 
      },
      data: {
        csrfToken: '6f678415702493d2c28813747c413aa05c87d8f87ecf05fe'
      }
    })
  }

  return Promise.resolve(result)
})

it('can generate valid url', () => {
  expect(url).toBe('https://api.prod.sngtv.magentatv.de/EPG/JSON/PlayBillList')
})

it('can generate valid request method', () => {
  expect(request.method).toBe('POST')
})

it('can generate valid request headers', async () => {
  const headers = await request.headers()

  expect(headers).toHaveProperty('Cookie')
  expect(headers).toHaveProperty('X_CSRFTOKEN')

  expect(headers.Cookie).toMatch(/JSESSIONID=[\dA-F]+;/i)
  expect(headers.Cookie).toMatch(/CSESSIONID=[\dA-F]+;/i)
  expect(headers.Cookie).toMatch(/CSRFSESSION=[\dA-F]+;/i)
  expect(headers.X_CSRFTOKEN).toMatch(/[\dA-F]/i)
})

it('can generate valid request data', () => {
  expect(request.data({ channel, date })).toMatchObject({
    count: -1,
    isFillProgram: 1,
    offset: 0,
    properties: [
      {
        include:
          'endtime,genres,id,name,starttime,channelid,pictures,introduce,subName,seasonNum,subNum,cast,country,producedate,externalIds',
        name: 'playbill'
      }
    ],
    type: 2,
    begintime: '20220309000000',
    channelid: '255',
    endtime: '20220310000000'
  })
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'), 'utf8')
  const result = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2023-10-23T23:58:55.000Z',
      stop: '2023-10-24T00:11:05.000Z',
      title: 'Twenty Foot Plus',
      description:
        'Die besten Big-Wave-Surfer werden bei ihrer Suche nach der nächsten großen Welle begleitet.',
      image:
        'http://ngiss.t-online.de/cm1s/media/gracenote/2/4/p24832950_e_h9_aa_2023-06-22T10_12_01.jpg',
      category: ['Sport']
    },
    {
      start: '2024-11-05T15:37:03.000Z',
      stop: '2024-11-05T16:03:48.000Z',
      title: 'The Big Bang Theory',
      sub_title: 'Tritte unter dem Tisch',
      description:
        'Amy arbeitet für eine Weile in Sheldons Universität, er freut sich darüber, doch sie warnt ihn, dass sie sich jetzt häufiger zu Gesicht bekommen. Als Leonard, Sheldon, Raj und Howard zusammen sitzen, diskutieren sie darüber. Sheldon lässt auf sich einreden und informiert Amy, dass er ein Problem mit ihr auf seiner Arbeit hat. Sie ist enttäuscht, während Bernadette mit Howard darüber spricht, warum er auf Sheldon eingeredet hat.',
      season: '7',
      episode: '5',
      image:
        'http://ngiss.t-online.de/cm1s/media/gracenote/1/0/p10262968_e_h9_ah_2021-10-20T07_16_16.jpg',
      category: ['Sitcom'],
      directors: ['Mark Cendrowski'],
      producers: ['Chuck Lorre', 'Bill Prady', 'Steven Molaro'],
      adapters: [
        'Steven Molaro',
        'Steve Holland',
        'Maria Ferrari',
        'Chuck Lorre',
        'Eric Kaplan',
        'Jim Reynolds'
      ],
      country: 'US',
      date: '2013-01-01',
      urls: [
        {
          system: 'imdb',
          value: 'https://www.imdb.com/title/tt0898266'
        }
      ]
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: '{"counttotal":"0"}'
  })
  expect(result).toMatchObject([])
})
