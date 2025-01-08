const { url, parser } = require('./shahid.mbc.net.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

const date = dayjs.utc('2023-11-11').startOf('d')
const channel = { site_id: '996520', xmltv_id: 'AlAanTV.ae', lang: 'en' }

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    `https://api2.shahid.net/proxy/v2.1/shahid-epg-api/?csvChannelIds=${
      channel.site_id
    }&from=${date.format('YYYY-MM-DD')}T00:00:00.000Z&to=${date.format(
      'YYYY-MM-DD'
    )}T23:59:59.999Z&country=SA&language=${channel.lang}&Accept-Language=${channel.lang}`
  )
})

it('can parse response', () => {
  const content =
    '{"items":[{"channelId":"996520","items":[{"actualFrom":"2023-11-11T00:00:00.000+00:00","actualTo":"2023-11-11T00:30:00.000+00:00","description":"The presenter reviews the most prominent episodes of news programs produced by the channel\'s team on a weekly basis, which include the most important global updates and developments at all levels.","duration":null,"emptySlot":false,"episodeNumber":194,"from":"2023-11-11T00:00:00.000+00:00","genres":["TV Show"],"productId":null,"productionYear":null,"productPoster":"https://imagesmbc.whatsonindia.com/dasimages/landscape/1920x1080/F968D4A39DB25793E9EED1BDAFBAD2EA8A8F9B30Z.jpg","productSubType":null,"productType":null,"replay":false,"restritectContent":null,"seasonId":null,"seasonNumber":"1","showId":null,"streamInfo":null,"title":"Menassaatona Fi Osboo\'","to":"2023-11-11T00:30:00.000+00:00"}]}]}'
  const result = parser({ content, channel, date })

  expect(result).toMatchObject([
    {
      start: '2023-11-10T21:00:00.000Z',
      stop: '2023-11-10T21:30:00.000Z',
      title: "Menassaatona Fi Osboo'",
      description:
        "The presenter reviews the most prominent episodes of news programs produced by the channel's team on a weekly basis, which include the most important global updates and developments at all levels."
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({ content: '' })

  expect(result).toMatchObject([])
})
