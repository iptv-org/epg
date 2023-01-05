// node ./scripts/commands/parse-channels.js --config=./sites/directv.com/directv.com.config.js --output=./sites/directv.com/directv.com.channels.xml --set=zip:10001
// npx epg-grabber --config=sites/directv.com/directv.com.config.js --channels=sites/directv.com/directv.com.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./directv.com.config.js')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2021-10-24', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '15',
  xmltv_id: 'WTAP.us'
}
const content = `{"schedule":[{"secLiveStreaming":"N","chNum":15,"authCode":"NA","chRec":true,"chCall":"WTAP","chId":2073,"secondaryChannelId":0,"chHd":true,"secondary":false,"blackOut":false,"chAdult":false,"chCat":["HDTV Channels","Local Channels"],"chLogoId":875,"detailsLinkUrl":"/Channels/Parkersburg-WV-WTAP-NBC-15-A3-HD-15","schedules":[{"primaryImageUrl":"/db_photos/default/TV/tv.jpg","restartAllowed":false,"subcategoryList":["Series","Reality"],"gridViewPrimaryImageUrl":"/db_photos/default/TV/tv_p.jpg","rating":"TVPG","description":null,"title":"Home Sweet Home","episodeNumber":3,"duration":60,"price":0,"repeat":false,"lookBack":false,"tvAdvisory":["L"],"dimension":"2D","ltd":"","programID":"EP039886740003","blackoutCode":"NA","airTime":"2021-10-30T00:00:00.000+0000","secLiveStreaming":"N","prOrd":0,"episodeTitle":"Art Is My God","authCode":"NA","format":"HD","seasonNumber":1,"listViewPrimaryImageUrl":"/db_photos/default/TV/tv_l.jpg","eventCode":"","mainCategory":"TV","hd":1,"liveStreaming":"N"}],"chKey":"2073_1476352800000","chName":"Parkersburg, WV WTAP NBC 15 A3 HD","chDesc":"NBC television services from WTAPDT-TV, 15, Parkersburg, WV.","liveStreaming":"N","digitalAdInsertableLive":false}],"reporting":{"channelschedules":{"success":false,"reportingData":"reporting for app/json/channelschedules/channelschedules not implemented yet"}},"messagekeys":null,"contingencies":[]}`

it('can generate valid url', () => {
  const result = url({ date, channel })
  expect(result).toBe(
    'https://www.directv.com/json/channelschedule?channels=15&startTime=2021-10-24T00:00:00Z&hours=24'
  )
})

it('can parse response', done => {
  axios.get.mockImplementation(url => {
    if (url === 'https://www.directv.com/json/program/flip/EP039886740003') {
      return Promise.resolve({
        data: JSON.parse(
          `{"programDetail":{"title":"Home Sweet Home","episodeTitle":"Art Is My God","mainCategory":"TV","rating":"PG","runLength":"1 hr","runLengthOriginal":60,"tomatoScore":0,"tomatoImg":"","audienceScore":0,"popcornImg":"","price":0,"formats":["1080p"],"starRating":"","starRatingNum":0,"episodeNumber":3,"episodeSeason":1,"originalAirDate":"2021-10-29","airDate":"Friday, October 29th","progType":"Series","ltd":"","isInPlaylist":false,"historical":false,"detailsLinkUrl":"/tv/Home-Sweet-Home-bUdDOWFNWkFKQWlGby9GckxSaXJvUT09/Art-Is-My-God-QVZSbmFsVUNvK0pLL3JRTjl0OFNYUT09","seriesLinkUrl":"/tv/Home-Sweet-Home-bUdDOWFNWkFKQWlGby9GckxSaXJvUT09","description":"The Baltzers, a surfing Mormon family, and the Silversteins, an artistic Black and Latino family with Jewish heritage, discover that the struggle of living outside their comfort zones sparks rewarding moments.","primaryImageUrl":"/db_photos/default/TV/tv.jpg","isLiveStreaming":false,"tmsProgramID":"EP039886740003","firstRun":false,"seriesID":20584969},"reporting":{"flip":{"success":false,"reportingData":"reporting for app/shared/nodules/json/flip/flip not implemented yet"}},"messagekeys":null,"contingencies":[]}`
        )
      })
    } else {
      return Promise.resolve({ data: '' })
    }
  })

  parser({ date, channel, content })
    .then(result => {
      result = result.map(p => {
        p.start = p.start.toJSON()
        p.stop = p.stop.toJSON()
        return p
      })

      expect(result).toMatchObject([
        {
          start: '2021-10-30T00:00:00.000Z',
          stop: '2021-10-30T01:00:00.000Z',
          title: 'Home Sweet Home',
          description:
            'The Baltzers, a surfing Mormon family, and the Silversteins, an artistic Black and Latino family with Jewish heritage, discover that the struggle of living outside their comfort zones sparks rewarding moments.',
          season: 1,
          episode: 3,
          category: ['Series', 'Reality']
        }
      ])
      done()
    })
    .catch(done)
})

it('can handle missing details', done => {
  axios.get.mockImplementation(url => {
    if (url === 'https://www.directv.com/json/program/flip/EP039886740003') {
      return Promise.resolve({ data: '' })
    }
  })

  parser({ date, channel, content })
    .then(result => {
      expect(result).toMatchObject([
        {
          title: 'Home Sweet Home',
          description: null
        }
      ])
      done()
    })
    .catch(done)
})

it('can handle empty guide', done => {
  parser({
    date,
    channel,
    content: `{"errors":[{"text":"Service failure: see errors or BulkOperationErrors for details","field":"","reason":"INTERNAL_SERVER_ERROR"}],"statusCode":500,"apiResponse":{"messages":"NOTE: see res.contingencies for size-filtered message values"},"reporting":{"channelschedules":{"success":false,"reportingData":"reporting for app/json/channelschedules/channelschedules not implemented yet"}},"messagekeys":null,"contingencies":[{"key":"ent_ep_guide_backend_unavailable_error_message","value":"<!-- message: key=ent_ep_guide_backend_unavailable_error_message, deviceType=web -->Due to technical issues the guide is currently unavailable, please check back to soon.","level":"ERROR"}]}`
  })
    .then(result => {
      expect(result).toMatchObject([])
      done()
    })
    .catch(done)
})
