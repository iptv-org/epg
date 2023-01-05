// npm run channels:parse -- --config=./sites/magentatv.de/magentatv.de.config.js --output=./sites/magentatv.de/magentatv.de.channels.xml
// npx epg-grabber --config=sites/magentatv.de/magentatv.de.config.js --channels=sites/magentatv.de/magentatv.de.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./magentatv.de.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-03-09', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '255',
  xmltv_id: '13thStreet.de'
}

it('can generate valid url', () => {
  expect(url).toBe('https://api.prod.sngtv.magentatv.de/EPG/JSON/PlayBillList')
})

it('can generate valid request method', () => {
  expect(request.method).toBe('POST')
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    X_CSRFToken: 'e0a032d1c9df6c3fb8c8352399d32c40ddb17ccceb5142fe',
    'Content-Type': 'application/json',
    Cookie:
      'JSESSIONID=93892A98DBCCEBD83EDC4C23EBEB23B6; CSESSIONID=4A36799EF09D80539BBA8E8211FA80D3; CSRFSESSION=e0a032d1c9df6c3fb8c8352399d32c40ddb17ccceb5142fe; JSESSIONID=93892A98DBCCEBD83EDC4C23EBEB23B6'
  })
})

it('can generate valid request data', () => {
  expect(request.data({ channel, date })).toMatchObject({
    count: -1,
    isFillProgram: 1,
    offset: 0,
    properties: [
      {
        include: 'endtime,genres,id,name,starttime,channelid,pictures,introduce',
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
  const content = `{"playbilllist":[{"id":"30021745","name":"FBI: Special Crime Unit","introduce":"Nachdem ein Mann von einem Sprengstoffpaket getötet wurde, das zu ihm nach Hause geschickt wurde, versucht das Team, den Absender zu fassen und sein neuestes tödliches Paket abzufangen. Maggie hat Mühe, ihrer jüngeren Schwester zu vertrauen.","channelid":"255","starttime":"2022-03-09 01:00:00 UTC+01:00","endtime":"2022-03-09 01:45:00 UTC+01:00","genres":"Wissen,Natur und Tiere","pictures":[{"rel":"image","href":"http://ngiss.t-online.de/sweetprogrammanager/media/gracenote/1/9/p19740197_e_h9_af.jpg","description":"Brother's Keeper","imageType":"1","copyrightNotice":"(c) ProSiebenSat.1","mimeType":"image/jpeg","resolution":["1440","1080"]},{"rel":"image","href":"http://ngiss.t-online.de/sweetprogrammanager/media/gracenote/1/5/p15528073_i_h9_ae.jpg","description":"FBI","imageType":"13","copyrightNotice":"(c) ProSiebenSat.1","mimeType":"image/jpeg","resolution":["1440","1080"]},{"rel":"image","href":"http://ngiss.t-online.de/sweetprogrammanager/media/gracenote/1/9/p19740197_e_h8_af.jpg","description":"Brother's Keeper","imageType":"17","copyrightNotice":"(c) ProSiebenSat.1","mimeType":"image/jpeg","resolution":["1920","1080"]},{"rel":"image","href":"http://ngiss.t-online.de/sweetprogrammanager/media/gracenote/1/5/p15528073_i_h10_af.jpg","description":"FBI","imageType":"18","copyrightNotice":"(c) ProSiebenSat.1","mimeType":"image/jpeg","resolution":["1920","1080"]}]}]}`
  const result = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-03-09T00:00:00.000Z',
      stop: '2022-03-09T00:45:00.000Z',
      title: 'FBI: Special Crime Unit',
      description:
        'Nachdem ein Mann von einem Sprengstoffpaket getötet wurde, das zu ihm nach Hause geschickt wurde, versucht das Team, den Absender zu fassen und sein neuestes tödliches Paket abzufangen. Maggie hat Mühe, ihrer jüngeren Schwester zu vertrauen.',
      icon: 'http://ngiss.t-online.de/sweetprogrammanager/media/gracenote/1/9/p19740197_e_h9_af.jpg',
      category: ['Wissen', 'Natur', 'Tiere']
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: `{"counttotal":"0"}`
  })
  expect(result).toMatchObject([])
})
