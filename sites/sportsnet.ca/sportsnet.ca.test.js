// npx epg-grabber --config=sites/sportsnet.ca/sportsnet.ca.config.js --channels=sites/sportsnet.ca/sportsnet.ca.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./sportsnet.ca.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-03-14', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '24533',
  xmltv_id: 'SportsNetOntario.ca'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://production-cdn.sportsnet.ca/api/schedules?channels=24533&date=2022-03-14&duration=24&hour=0'
  )
})

it('can parse response', () => {
  const content = `[{"channelId":"24533","startDate":"2022-03-14T00:00:00.000Z","endDate":"2022-03-15T00:00:00.000Z","schedules":[{"channelId":"24533","customFields":{"ContentId":"EP029977175139","Checksum":"2DA90E7E66B9C311F98B186B89C50FAD"},"endDate":"2022-03-14T02:30:00Z","id":"826cb731-9de4-4cf3-bcca-d548d8a33d16","startDate":"2022-03-14T00:00:00Z","item":{"id":"34a028b0-eacf-40f3-9bf9-62ee3330df1b","type":"program","title":"Calgary Flames at Colorado Avalanche","shortDescription":"Johnny Gaudreau and the Flames pay a visit to the Avalanche. Calgary won 4-3 in overtime March 5.","path":"/channel/24533","duration":9000,"images":{"tile":"https://production-static.sportsnet-static.com/shain/v1/dataservice/ResizeImage/$value?Format='jpg'&Quality=85&ImageId='785305'&EntityType='LinearSchedule'&EntityId='826cb731-9de4-4cf3-bcca-d548d8a33d16'&Width=3840&Height=2160","wallpaper":"https://production-static.sportsnet-static.com/shain/v1/dataservice/ResizeImage/$value?Format='jpg'&Quality=85&ImageId='785311'&EntityType='LinearSchedule'&EntityId='826cb731-9de4-4cf3-bcca-d548d8a33d16'&Width=3840&Height=2160"}}}]}]`
  const result = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-03-14T00:00:00.000Z',
      stop: '2022-03-14T02:30:00.000Z',
      title: 'Calgary Flames at Colorado Avalanche',
      description:
        'Johnny Gaudreau and the Flames pay a visit to the Avalanche. Calgary won 4-3 in overtime March 5.',
      icon: "https://production-static.sportsnet-static.com/shain/v1/dataservice/ResizeImage/$value?Format='jpg'&Quality=85&ImageId='785305'&EntityType='LinearSchedule'&EntityId='826cb731-9de4-4cf3-bcca-d548d8a33d16'&Width=3840&Height=2160"
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: `[{"channelId":"245321","startDate":"2022-03-14T00:00:00.000Z","endDate":"2022-03-15T00:00:00.000Z","schedules":[]}]`
  })
  expect(result).toMatchObject([])
})
