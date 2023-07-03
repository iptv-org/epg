// npm run channels:parse -- --config=./sites/dishtv.in/dishtv.in.config.js --output=./sites/dishtv.in/dishtv.in.channels.xml
// npx epg-grabber --config=sites/dishtv.in/dishtv.in.config.js --channels=sites/dishtv.in/dishtv.in.channels.xml --output=guide.xml

const { parser, url, request } = require('./dishtv.in.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-05', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: '10000000075992337', xmltv_id: 'WomensActive.in' }
const content = `{"d":"\\u003cdiv class=\\"pgrid\\"\\u003e\\u003cdiv class=\\"img sm-30 grid\\"\\u003e\\u003cimg class=\\"chnl-logo\\" src=\\"http://imagesdishtvd2h.whatsonindia.com/dasimages/channel/landscape/360x270/hiyj8ndf.png\\" onclick=\\"ShowChannelGuid(\\u0027womens-active\\u0027,\\u002710000000075992337\\u0027);\\" /\\u003e\\u003cdiv class=\\"cnl-fav\\"\\u003e\\u003ca href=\\"javascript:;\\"\\u003e\\u003cem\\u003ech. no\\u003c/em\\u003e\\u003cspan\\u003e117\\u003c/span\\u003e\\u003c/a\\u003e\\u003c/div\\u003e\\u003ci class=\\"fa fa-heart Set_Favourite_Channel\\" aria-hidden=\\"true\\" title=\\"Set womens active channel as your favourite channel\\" onclick=\\"SetFavouriteChannel();\\"\\u003e\\u003c/i\\u003e\\u003c/div\\u003e\\u003cdiv class=\\"grid-wrap\\"\\u003e\\u003cdiv class=\\"sm-30 grid datatime\\" data-time=\\"24\\" data-starttime=\\"12:00 AM\\" data-endttime=\\"12:24 AM\\"  data-reamintime=\\"0\\"\\u003e\\u003ca title=\\"Event Name: Cynthia Williams - Diwali Look Part 01\\r\\nStart Time: 12:00 AM\\r\\nDuration: 24min\\r\\nSynopsis: Learn diwali look by cynthia williams p1\\r\\n\\" href=\\"javascript:;\\" onclick=\\"ShowCurrentTime(\\u002730000000550913679\\u0027,\\u002710000000075992337\\u0027,\\u0027202111051200\\u0027)\\"\\u003eCynthia Williams - Diwali Look Part 01\\u003c/a\\u003e\\u003cdiv class=\\"cnlSerialIcon\\"\\u003e\\u003ci class=\\"fa fa-heart\\" aria-hidden=\\"true\\" title=\\"Set Favourite Serial\\" onclick=\\"SetFavouriteShow();\\"\\u003e\\u003c/i\\u003e\\u003ci class=\\"fa fa-clock-o\\" aria-hidden=\\"true\\" title=\\"Reminder Serial\\" onclick=\\"ReminderEnteryOpen(\\u002730000000550913679\\u0027,\\u002710000000075992337\\u0027,\\u0027202111050000\\u0027,\\u0027117\\u0027)\\"\\u003e\\u003c/i\\u003e\\u003ci class=\\"fa fa-circle\\" aria-hidden=\\"true\\" title=\\"Record Serial\\" onclick=\\"RecordingEnteryOpen(\\u002730000000550913679\\u0027,\\u002710000000075992337\\u0027,\\u0027202111050000\\u0027,\\u0027117\\u0027,30000000550913679)\\"\\u003e\\u003c/i\\u003e\\u003c/div\\u003e\\u003c/div\\u003e\\u003c/div\\u003e\\u003c/div\\u003e"}`

it('can generate valid url', () => {
  expect(url).toBe(
    'https://www.dishtv.in/WhatsonIndiaWebService.asmx/LoadPagginResultDataForProgram'
  )
})

it('can generate valid request data', () => {
  const result = request.data({ channel, date })
  expect(result).toMatchObject({
    Channelarr: '10000000075992337',
    fromdate: '202111050000',
    todate: '202111060000'
  })
})

it('can parse response', () => {
  const result = parser({ date, channel, content })
  expect(result).toMatchObject([
    {
      start: 'Thu, 04 Nov 2021 18:30:00 GMT',
      stop: 'Thu, 04 Nov 2021 18:54:00 GMT',
      title: 'Cynthia Williams - Diwali Look Part 01'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({ date, channel, content: `{"d":""}` })
  expect(result).toMatchObject([])
})
