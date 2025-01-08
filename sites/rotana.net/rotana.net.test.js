const { parser, url, request } = require('./rotana.net.config.js')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2024-11-26').startOf('d')
const channel = {
  lang: 'en',
  site_id: '439',
  xmltv_id: 'RotanaCinemaMasr.sa'
}
const channelAr = Object.assign({}, channel, { lang: 'ar' })

axios.get.mockImplementation(url => {
  if (url === 'https://rotana.net/en/streams?channel=439&itemId=736970') {
    return Promise.resolve({
      data: fs.readFileSync(path.resolve(__dirname, '__data__/program_en.html'))
    })
  }
  if (url === 'https://rotana.net/ar/streams?channel=439&itemId=736970') {
    return Promise.resolve({
      data: fs.readFileSync(path.resolve(__dirname, '__data__/program_ar.html'))
    })
  }

  return Promise.resolve({ data: '' })
})

it('can use defined user agent', () => {
  const result = request.headers['User-Agent']
  expect(result).toBe(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36 OPR/104.0.0.0'
  )
})

it('can generate valid english url', () => {
  const result = url({ channel, date })
  expect(result).toBe('https://rotana.net/en/streams?channel=439&tz=')
})

it('can generate valid arabic url', () => {
  const result = url({ channel: channelAr, date })
  expect(result).toBe('https://rotana.net/ar/streams?channel=439&tz=')
})

it('can parse english response', async () => {
  const result = (
    await parser({
      channel,
      date,
      content: fs.readFileSync(path.join(__dirname, '/__data__/content_en.html'))
    })
  ).map(a => {
    a.start = a.start.toJSON()
    a.stop = a.stop.toJSON()
    return a
  })

  expect(result.length).toBe(12)
  expect(result[11]).toMatchObject({
    start: '2024-11-26T20:00:00.000Z',
    stop: '2024-11-26T22:00:00.000Z',
    title: 'Khiyana Mashroua',
    description:
      'Hisham knows that his father has given all his wealth to his elder brother. This leads him to plan to kill his brother to make it look like a defense of honor, which he does by killing his wife along...',
    image:
      'https://s3.eu-central-1.amazonaws.com/rotana.website/spider_storage/1398X1000/1687084565',
    category: 'Movie'
  })
})

it('can parse arabic response', async () => {
  const result = (
    await parser({
      channel: channelAr,
      date,
      content: fs.readFileSync(path.join(__dirname, '/__data__/content_ar.html'))
    })
  ).map(a => {
    a.start = a.start.toJSON()
    a.stop = a.stop.toJSON()
    return a
  })

  expect(result.length).toBe(12)
  expect(result[11]).toMatchObject({
    start: '2024-11-26T20:00:00.000Z',
    stop: '2024-11-26T22:00:00.000Z',
    title: 'خيانة مشروعة',
    description:
      'يعلم هشام البحيري أن والده قد حرمه من الميراث، ووهب كل ثروته لشقيقه اﻷكبر، وهو ما يدفعه لتدبير جريمة قتل شقيقه لتبدو وكأنها دفاع عن الشرف، وذلك حين يقتل هشام زوجته مع شقيقه.',
    image:
      'https://s3.eu-central-1.amazonaws.com/rotana.website/spider_storage/1398X1000/1687084565',
    category: 'فيلم'
  })
})

it('can handle empty guide', async () => {
  const result = await parser({
    content: '<!DOCTYPE html><html><head></head><body></body></html>',
    date,
    channel
  })
  expect(result).toMatchObject([])
})
