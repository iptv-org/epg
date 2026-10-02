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

// Mock token fetching
axios.post.mockImplementation((url) => {
  if (url === 'https://api.cld.dtvce.com/authn-tokengo/v3/v2/tokens?client_id=DTVE_DFW_WEB_Chrome_G') {
    return Promise.resolve({ data: '/S2dAVfUtUdnt6adfOBn+QrLZ2GymKSfxIGgfI/tRrOCf22bhs7aLmwmeKTUp0br3aHU2M/Rtv5Y43Kl9unTtNau8w48K3dNjVVH2gyrgvGvUxfVa8rXXuv9RBesXSric6ltlS4yDIjRtuOpmiU5Imt8O1zHWjA9K3/8M84oRQywb0HpE4tkTT3RBG5Cmz+wX5If6Hbb3ndFacEhUjpvCI0mAqPlI2r7x7/73quuoByp0+updUmyjWF+5SVkUBx5.ycdisTLMPpwxjYERYDmA7zm7Pq2ukk5KJk8duRW8lMg=' })
  }
})

const date = dayjs.utc('2026-06-04', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '5070bc2e-dd69-4dee-98b4-a4c5e3b1fd7b',
  xmltv_id: 'ComedyCentralEast.us'
}

it('can generate valid url', () => {
  const result = url({ date, channel })
  expect(result).toBe(
    `https://api.cld.dtvce.com/discovery/edge/schedule/v1/service/schedule?startTime=${date.valueOf()}&endTime=${date.add(24, 'hour').valueOf()}&channelIds=5070bc2e-dd69-4dee-98b4-a4c5e3b1fd7b&include4K=false&is4Kcompatible=false&includeTVOD=true`
  )
})

it('can parse response', done => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))

  parser({ content, channel })
    .then(result => {
      result = result.map(p => {
        p.start = p.start.toJSON()
        p.stop = p.stop.toJSON()
        return p
      })

      expect(result).toHaveLength(47)

      expect(result[0]).toMatchObject({
        start: '2026-04-06T00:00:00.000Z',
        stop: '2026-04-06T00:30:00.000Z',
        title: 'Seinfeld',
        sub_title: 'The Nap',
          description: 'George finds the ideal napping spot at work; Jerry has his kitchen rebuilt; Elaine meets a new beau (Vince Grant).',
          date: '1997-04-10',
          season: 8,
          episode: 18,
          category: ['Sitcom'],
          rating: {
            system: 'MPA',
            value: 'TVPG'
          }
      })

      expect(result[46]).toMatchObject({
        start: '2026-04-06T23:35:00.000Z',
        stop: '2026-04-07T00:10:00.000Z',
        title: 'The Office',
        sub_title: 'The Convention',
          description: 'Michael organizes a party in his hotel room when he, Dwight and Jan attend the Northeastern Mid-Market Office Supply Convention in Philadelphia.',
          category: ['Comedy', 'Sitcom'],
          season: 3,
          episode: 2,
          rating: {
            system: 'MPA',
            value: 'TV14'
          }
      })
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
