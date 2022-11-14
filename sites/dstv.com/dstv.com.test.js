// npm run channels:parse -- --config=./sites/dstv.com/dstv.com.config.js --output=./sites/dstv.com/dstv.com_za.channels.xml --set=country:zaf
// npm run channels:parse -- --config=./sites/dstv.com/dstv.com.config.js --output=./sites/dstv.com/dstv.com_ng.channels.xml --set=country:nga
// npx epg-grabber --config=sites/dstv.com/dstv.com.config.js --channels=sites/dstv.com/dstv.com_za.channels.xml --output=guide.xml --days=2
// npx epg-grabber --config=sites/dstv.com/dstv.com.config.js --channels=sites/dstv.com/dstv.com_ng.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./dstv.com.config.js')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2022-03-11', 'YYYY-MM-DD').startOf('d')
const channelZA = {
  site_id: 'zaf#101',
  xmltv_id: 'MNetWest.za'
}
const channelNG = {
  site_id: 'nga#101',
  xmltv_id: 'MNetWest.za'
}

it('can generate valid url for zaf', () => {
  expect(url({ channel: channelZA, date })).toBe(
    'https://www.dstv.com/umbraco/api/TvGuide/GetProgrammes?d=2022-03-11&package=&country=zaf'
  )
})

it('can generate valid url for nga', () => {
  expect(url({ channel: channelNG, date })).toBe(
    'https://www.dstv.com/umbraco/api/TvGuide/GetProgrammes?d=2022-03-11&package=DStv%20Premium&country=nga'
  )
})

it('can parse response', done => {
  const content = `{"Total":4483,"Channels":[{"Number":"214","Tag":"S34","Name":"TENNIS","Programmes":[{"Id":"5c5a56e8-9959-4305-ae2f-7cc32ec39f5f","StartTime":"2022-03-11T09:00:00","EndTime":"2022-03-11T09:15:00","Title":"WTA 1000 HL '22: Indian Wells D2 M1"}]},{"Number":"101","Tag":"HDT","Name":"M-Net HD","Programmes":[{"Id":"a6ada4cd-93df-4eaf-bab4-041e2537ed23","StartTime":"2022-03-11T00:10:00","EndTime":"2022-03-11T00:50:00","Title":"Curb Your Enthusiasm"}]}]}`

  axios.get.mockImplementation(url => {
    if (
      url ===
      'https://www.dstv.com/umbraco/api/TvGuide/GetProgramme?id=a6ada4cd-93df-4eaf-bab4-041e2537ed23'
    ) {
      return Promise.resolve({
        data: JSON.parse(
          `{"Id":"a6ada4cd-93df-4eaf-bab4-041e2537ed23","ChannelTag":"HDT","Channel":"M-Net Domestic HD","EventID":"HDT0000109067787","StartTime":"2022-03-11T00:10:00","EndTime":"2022-03-11T00:50:00","Duration":"00:40:00","Language":"eng","Title":"Curb Your Enthusiasm","Synopsis":"'S11/E6 of 10 - Man Fights Tiny Woman'. A general entertainment channel showcasing the best international content, focusing on scripted drama, comedy and talk.","Rating":"16","MainGenres":["Series"],"SubGenres":["Sitcom","Comedy"],"Items":[{"Key":"Year","Value":"2020"},{"Key":"Source Key ID","Value":"100338770"}],"ThumbnailUri":"https://03mcdecdnimagerepository.blob.core.windows.net/epguideimage/img/21893_curb_your_enthusiam169.jpg"}`
        )
      })
    } else {
      return Promise.resolve({ data: '' })
    }
  })

  parser({ content, channel: channelZA })
    .then(result => {
      result = result.map(p => {
        p.start = p.start.toJSON()
        p.stop = p.stop.toJSON()
        return p
      })

      expect(result).toMatchObject([
        {
          start: '2022-03-11T00:10:00.000Z',
          stop: '2022-03-11T00:50:00.000Z',
          title: 'Curb Your Enthusiasm'
          // description:
          //   "'S11/E6 of 10 - Man Fights Tiny Woman'. A general entertainment channel showcasing the best international content, focusing on scripted drama, comedy and talk.",
          // icon: 'https://03mcdecdnimagerepository.blob.core.windows.net/epguideimage/img/21893_curb_your_enthusiam169.jpg',
          // category: ['Sitcom', 'Comedy']
        }
      ])
      done()
    })
    .catch(done)
})

it('can handle empty guide', done => {
  parser({
    content: `{"Total":0,"Channels":[]}`,
    channel: channelZA
  })
    .then(result => {
      expect(result).toMatchObject([])
      done()
    })
    .catch(done)
})
