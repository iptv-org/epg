// npm run channels:parse -- --config=./sites/dstv.com/dstv.com.config.js --output=./sites/dstv.com/dstv.com.channels.xml --set=country:zaf
// npx epg-grabber --config=sites/dstv.com/dstv.com.config.js --channels=sites/dstv.com/dstv.com.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./dstv.com.config.js')
const axios = require('axios')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const API_ENDPOINT = 'https://www.dstv.com/umbraco/api/TvGuide'

const date = dayjs.utc('2022-11-22', 'YYYY-MM-DD').startOf('d')
const channelZA = {
  site_id: 'zaf#201',
  xmltv_id: 'SuperSportGrandstand.za'
}
const channelNG = {
  site_id: 'nga#201',
  xmltv_id: 'SuperSportGrandstand.za'
}

it('can generate valid url for zaf', () => {
  expect(url({ channel: channelZA, date })).toBe(
    `${API_ENDPOINT}/GetProgrammes?d=2022-11-22&country=zaf`
  )
})

it('can generate valid url for nga', () => {
  expect(url({ channel: channelNG, date })).toBe(
    `${API_ENDPOINT}/GetProgrammes?d=2022-11-22&package=DStv%20Premium&country=nga`
  )
})

it('can parse response for ZA', async () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content_zaf.json'))

  axios.get.mockImplementation(url => {
    if (url === `${API_ENDPOINT}/GetProgramme?id=8b237235-aa17-4bb8-9ea6-097e7a813336`) {
      return Promise.resolve({
        data: JSON.parse(fs.readFileSync(path.resolve(__dirname, '__data__/program_zaf.json')))
      })
    } else {
      return Promise.resolve({ data: '' })
    }
  })

  let results = await parser({ content, channel: channelZA })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[1]).toMatchObject({
    start: '2022-11-21T23:00:00.000Z',
    stop: '2022-11-22T00:00:00.000Z',
    title: 'UFC FN HL: Nzechukwu v Cutelaba',
    description:
      "'UFC Fight Night Highlights - Heavyweight Bout: Kennedy Nzechukwu vs Ion Cutelaba'. From The UFC APEX Center - Las Vegas, USA.",
    icon: 'https://03mcdecdnimagerepository.blob.core.windows.net/epguideimage/img/271546_UFC Fight Night.png',
    category: ['All Sport', 'Mixed Martial Arts']
  })
})

it('can parse response for NG', async () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content_nga.json'))

  axios.get.mockImplementation(url => {
    if (url === `${API_ENDPOINT}/GetProgramme?id=6d58931e-2192-486a-a202-14720136d204`) {
      return Promise.resolve({
        data: JSON.parse(fs.readFileSync(path.resolve(__dirname, '__data__/program_nga.json')))
      })
    } else {
      return Promise.resolve({ data: '' })
    }
  })

  let results = await parser({ content, channel: channelNG })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2022-11-21T23:00:00.000Z',
    stop: '2022-11-22T00:00:00.000Z',
    title: 'UFC FN HL: Nzechukwu v Cutelaba',
    description:
      "'UFC Fight Night Highlights - Heavyweight Bout: Kennedy Nzechukwu vs Ion Cutelaba'. From The UFC APEX Center - Las Vegas, USA.",
    icon: 'https://03mcdecdnimagerepository.blob.core.windows.net/epguideimage/img/271546_UFC Fight Night.png',
    category: ['All Sport', 'Mixed Martial Arts']
  })
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
