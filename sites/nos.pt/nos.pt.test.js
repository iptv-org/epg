// npm run channels:parse -- --config=./sites/nos.pt/nos.pt.config.js --output=./sites/nos.pt/nos.pt.channels.xml
// npx epg-grabber --config=sites/nos.pt/nos.pt.config.js --channels=sites/nos.pt/nos.pt.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./nos.pt.config.js')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2023-01-28', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '5',
  xmltv_id: 'RTP1.pt'
}

it('can generate valid url', () => {
  expect(url({ channel })).toBe(
    'https://www.nos.pt/particulares/televisao/guia-tv/Pages/channel.aspx?channel=5'
  )
})

it('can parse response', async () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'), 'utf8')

  axios.post.mockImplementation((url, data) => {
    if (
      url ===
        'https://www.nos.pt/_layouts/15/Armstrong/ApplicationPages/EPGGetProgramsAndDetails.aspx/GetProgramDetails' &&
      JSON.stringify(data) ===
        JSON.stringify({
          programId: '81361',
          channelAcronym: 'RTP1',
          hour: 'undefined',
          startHour: 'undefined',
          endHour: 'undefined'
        })
    ) {
      return Promise.resolve({
        data: JSON.parse(fs.readFileSync(path.resolve(__dirname, '__data__/program_0.json')))
      })
    } else if (
      url ===
        'https://www.nos.pt/_layouts/15/Armstrong/ApplicationPages/EPGGetProgramsAndDetails.aspx/GetProgramDetails' &&
      JSON.stringify(data) ===
        JSON.stringify({
          programId: '81382',
          channelAcronym: 'RTP1',
          hour: 'undefined',
          startHour: 'undefined',
          endHour: 'undefined'
        })
    ) {
      return Promise.resolve({
        data: JSON.parse(fs.readFileSync(path.resolve(__dirname, '__data__/program_21.json')))
      })
    } else {
      return Promise.resolve({ data: '' })
    }
  })

  let results = await parser({ content, date })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2023-01-27T23:50:00.000Z',
    stop: '2023-01-28T00:36:00.000Z',
    title: `Anatomia de Grey T.17 Ep.3`,
    description:
      'Os médicos do Grey Sloan continuam a enfrentar a nova realidade do COVID-19 e lidam com um paciente conhecido e teimoso. Koracick fica encarregue dos internos e Link opera um terapeuta sexual.',
    icon: 'https://images.nos.pt/b6fd27f4bd0b404abd4c3fc4faa79024_resized_352x198.jpg'
  })

  expect(results[21]).toMatchObject({
    start: '2023-01-28T21:38:00.000Z',
    stop: '2023-01-29T00:05:00.000Z',
    title: `MasterChef Portugal T.1 Ep.10`,
    description:
      'A maior competição de cozinha do mundo arranca ao comando de três dos mais conceituados chefs portugueses: Pedro Pena Bastos, Noélia Jerónimo e Ricardo Costa, que nos vão transmitir os seus conhecimentos e a sua paixão pela cozinha.',
    icon: 'https://images.nos.pt/8aa511d697f0401a88a0cb1ec2718cc3_resized_352x198.jpg'
  })
})

it('can handle empty guide', async () => {
  const results = await parser({
    date,
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.html'), 'utf8')
  })

  expect(results).toMatchObject([])
})
