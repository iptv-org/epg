// npx epg-grabber --config=sites/vidio.com/vidio.com.config.js --channels=sites/vidio.com/vidio.com.channels.xml --output=guide.xml

const { parser, url } = require('./vidio.com.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-24', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '7464',
  xmltv_id: 'AjwaTV.id'
}

it('can generate valid url', () => {
  expect(url({ channel })).toBe('https://www.vidio.com/live/7464/schedules')
})

it('can parse response', () => {
  const content = `<div class="b-livestreaming-daily-schedule__section b-livestreaming-daily-schedule__contents"> <div class="b-livestreaming-daily-schedule__content" id="schedule-content-20211124"> <div class="js-ahoy b-livestreaming-schedule__ahoy-impression" data-ahoy-component="Ahoy::Builder" data-ahoy-impression="true" data-ahoy-title="LIVESTREAMING" data-use-bounding-client-rect="true" ></div><div class="b-livestreaming-daily-schedule__scroll-container"> <a class="" href="/watch/2361692-30-hari-30-juz-24-november-2021" ><div class="b-livestreaming-daily-schedule__item js-ahoy" data-ahoy-click="true" data-ahoy-component="Ahoy::Builder" data-ahoy-props='{"section":"schedule","stream_type":"TvStream","livestreaming_id":7464,"schedule_day":-1,"schedule_id":1471806,"schedule_title":"30 Hari 30 Juz","action":"click"}' data-ahoy-title="LIVESTREAMING" id="schedule-item-1471806" > <div class="b-livestreaming-daily-schedule__item-icon"> <div class="b-livestreaming-daily-schedule__item-icon-play"></div></div><div class="b-livestreaming-daily-schedule__item-content"> <div class="b-livestreaming-daily-schedule__item-content-caption"> 00:30 - 01:30 WIB </div><div class="b-livestreaming-daily-schedule__item-content-title">30 Hari 30 Juz</div></div></div></a ><a class="" href="/watch/2361785-makkah-live-24-november-2021" ><div class="b-livestreaming-daily-schedule__item js-ahoy" data-ahoy-click="true" data-ahoy-component="Ahoy::Builder" data-ahoy-props='{"section":"schedule","stream_type":"TvStream","livestreaming_id":7464,"schedule_day":-1,"schedule_id":1471807,"schedule_title":"Makkah Live","action":"click"}' data-ahoy-title="LIVESTREAMING" id="schedule-item-1471807" > <div class="b-livestreaming-daily-schedule__item-icon"> <div class="b-livestreaming-daily-schedule__item-icon-play"></div></div><div class="b-livestreaming-daily-schedule__item-content"> <div class="b-livestreaming-daily-schedule__item-content-caption"> 01:30 - 04:00 WIB </div><div class="b-livestreaming-daily-schedule__item-content-title">Makkah Live</div></div></div></a ><a class="" href="/watch/2362889-ftv-islami-24-november-2021" ><div class="b-livestreaming-daily-schedule__item js-ahoy" data-ahoy-click="true" data-ahoy-component="Ahoy::Builder" data-ahoy-props='{"section":"schedule","stream_type":"TvStream","livestreaming_id":7464,"schedule_day":-1,"schedule_id":1473829,"schedule_title":"FTV Islami","action":"click"}' data-ahoy-title="LIVESTREAMING" id="schedule-item-1473829" > <div class="b-livestreaming-daily-schedule__item-icon"> <div class="b-livestreaming-daily-schedule__item-icon-play"></div></div><div class="b-livestreaming-daily-schedule__item-content"> <div class="b-livestreaming-daily-schedule__item-content-caption"> 22:30 - 00:30 WIB </div><div class="b-livestreaming-daily-schedule__item-content-title">FTV Islami</div></div></div></a > </div></div><div class="b-livestreaming-daily-schedule__content tab-active" id="schedule-content-20211125"> <div class="js-ahoy b-livestreaming-schedule__ahoy-impression" data-ahoy-component="Ahoy::Builder" data-ahoy-impression="true" data-ahoy-title="LIVESTREAMING" data-use-bounding-client-rect="true" ></div><div class="b-livestreaming-daily-schedule__scroll-container"> <a class="" href="/watch/2362921-30-hari-30-juz-25-november-2021" ><div class="b-livestreaming-daily-schedule__item js-ahoy" data-ahoy-click="true" data-ahoy-component="Ahoy::Builder" data-ahoy-props='{"section":"schedule","stream_type":"TvStream","livestreaming_id":7464,"schedule_day":0,"schedule_id":1473830,"schedule_title":"30 Hari 30 Juz","action":"click"}' data-ahoy-title="LIVESTREAMING" id="schedule-item-1473830" > <div class="b-livestreaming-daily-schedule__item-icon"> <div class="b-livestreaming-daily-schedule__item-icon-play"></div></div><div class="b-livestreaming-daily-schedule__item-content"> <div class="b-livestreaming-daily-schedule__item-content-caption"> 00:30 - 01:30 WIB </div><div class="b-livestreaming-daily-schedule__item-content-title">30 Hari 30 Juz</div></div></div></a > </div></div></div>`
  const result = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2021-11-23T17:30:00.000Z',
      stop: '2021-11-23T18:30:00.000Z',
      title: `30 Hari 30 Juz`
    },
    {
      start: '2021-11-23T18:30:00.000Z',
      stop: '2021-11-23T21:00:00.000Z',
      title: `Makkah Live`
    },
    {
      start: '2021-11-24T15:30:00.000Z',
      stop: '2021-11-24T17:30:00.000Z',
      title: `FTV Islami`
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: `<!DOCTYPE html><html><head></head><body></body></html>`
  })
  expect(result).toMatchObject([])
})
