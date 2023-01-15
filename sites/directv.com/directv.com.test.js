// node ./scripts/commands/parse-channels.js --config=./sites/directv.com/directv.com.config.js --output=./sites/directv.com/directv.com.channels.xml --set=zip:10001
// npx epg-grabber --config=sites/directv.com/directv.com.config.js --channels=sites/directv.com/directv.com.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./directv.com.config.js')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2023-01-15', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '249#249',
  xmltv_id: 'ComedyCentralEast.us'
}

it('can generate valid url', () => {
  const result = url({ date, channel })
  expect(result).toBe(
    'https://www.directv.com/json/channelschedule?channels=249&startTime=2023-01-15T00:00:00Z&hours=24&chId=249'
  )
})

it('can parse response', done => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))

  axios.get.mockImplementation(url => {
    if (url === 'https://www.directv.com/json/program/flip/MV001173520000') {
      return Promise.resolve({
        data: JSON.parse(fs.readFileSync(path.resolve(__dirname, '__data__/program1.json')))
      })
    } else if (url === 'https://www.directv.com/json/program/flip/EP002298270445') {
      return Promise.resolve({
        data: JSON.parse(fs.readFileSync(path.resolve(__dirname, '__data__/program2.json')))
      })
    } else {
      return Promise.resolve({ data: '' })
    }
  })

  parser({ content, channel })
    .then(result => {
      result = result.map(p => {
        p.start = p.start.toJSON()
        p.stop = p.stop.toJSON()
        return p
      })

      expect(result).toMatchObject([
        {
          start: '2023-01-14T23:00:00.000Z',
          stop: '2023-01-15T01:00:00.000Z',
          title: 'Men in Black II',
          description:
            'Kay (Tommy Lee Jones) and Jay (Will Smith) reunite to provide our best line of defense against a seductress who levels the toughest challenge yet to the MIBs mission statement: protecting the earth from the scum of the universe. While investigating a routine crime, Jay uncovers a plot masterminded by Serleena (Boyle), a Kylothian monster who disguises herself as a lingerie model. When Serleena takes the MIB building hostage, there is only one person Jay can turn to -- his former MIB partner.',
          date: '2002',
          icon: 'https://www.directv.com/db_photos/movies/AllPhotosAPGI/29160/29160_aa.jpg',
          category: ['Comedy', 'Movies Anywhere', 'Action/Adventure', 'Science Fiction'],
          rating: {
            system: 'MPA',
            value: 'TV14'
          }
        },
        {
          start: '2023-01-15T06:00:00.000Z',
          stop: '2023-01-15T06:30:00.000Z',
          title: 'South Park',
          sub_title: 'Goth Kids 3: Dawn of the Posers',
          description: 'The goth kids are sent to a camp for troubled children.',
          icon: 'https://www.directv.com/db_photos/showcards/v5/AllPhotos/184338/p184338_b_v5_aa.jpg',
          category: ['Series', 'Animation', 'Comedy'],
          season: 17,
          episode: 4,
          rating: {
            system: 'MPA',
            value: 'TVMA'
          }
        }
      ])
      done()
    })
    .catch(done)
})

it('can handle empty guide', done => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/no-content.json'))
  parser({ content, channel })
    .then(result => {
      expect(result).toMatchObject([])
      done()
    })
    .catch(done)
})
