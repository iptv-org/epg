// npx epg-grabber --config=sites/bt.com/bt.com.config.js --channels=sites/bt.com/bt.com.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./bt.com.config.js')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-03-20', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'hsxv',
  xmltv_id: 'BBCOneHD.uk'
}

it('can generate valid url', () => {
  expect(url({ date, channel })).toBe(
    'https://voila.metabroadcast.com/4/schedules/hsxv.json?key=b4d2edb68da14dfb9e47b5465e99b1b1&from=2022-03-20T00:00:00Z&to=2022-03-21T00:00:00Z&source=api.youview.tv&annotations=content.description'
  )
})

it('can parse response', () => {
  const content = `{"schedule":{"channel":{"title":"BBC One HD","id":"hsxv","uri":"http://api.youview.tv/channels/dvb://233a..4484","images":[{"uri":"https://images.metabroadcast.com?source=http%3A%2F%2Fimages-live.youview.tv%2Fimages%2Fentity%2F8c4c0357-d7ee-5d8a-8bc4-b177b6875128%2Fident%2F1_1024x532.png%3Fdefaultimg%3D0&ETag=r5vyecG6of%2BhCbHeEClx0Q%3D%3D","mime_type":"image/png","type":null,"color":"monochrome","theme":"light_monochrome","aspect_ratio":null,"availability_start":null,"availability_end":null,"width":1024,"height":532,"hasTitleArt":null,"source":null}],"available_from":[{"key":"api.youview.tv","name":"YouView JSON","country":"GB"}],"source":{"key":"api.youview.tv","name":"YouView JSON","country":"GB"},"same_as":[],"media_type":"video","broadcaster":null,"aliases":[{"namespace":"youview:serviceLocator","value":"dvb://233a..4484"},{"namespace":"youview:channel:id","value":"8c4c0357-d7ee-5d8a-8bc4-b177b6875128"}],"genres":[],"high_definition":true,"timeshifted":null,"regional":null,"related_links":[],"start_date":null,"advertised_from":null,"advertised_to":null,"short_description":null,"medium_description":null,"long_description":null,"region":null,"target_regions":[],"channel_type":"CHANNEL","interactive":false,"transmission_types":["DTT"],"quality":"HD","hdr":false},"source":"api.youview.tv","entries":[{"broadcast":{"aliases":[{"namespace":"api.youview.tv:slot","value":"dvb://233a..4484;76bc"},{"namespace":"dvb:event-locator","value":"dvb://233a..4484;76bc"},{"namespace":"dvb:pcrid","value":"crid://fp.bbc.co.uk/b/3Q30S2"},{"namespace":"youview:schedule_event:id","value":"79d318f3-b41a-582d-b089-7b0172538b42"}],"transmission_time":"2022-03-19T23:30:00.000Z","transmission_end_time":"2022-03-20T01:20:00.000Z","broadcast_duration":6600,"broadcast_on":"hsxv","schedule_date":null,"repeat":null,"subtitled":true,"signed":null,"audio_described":false,"high_definition":null,"widescreen":null,"surround":null,"live":null,"premiere":null,"continuation":null,"new_series":null,"new_episode":null,"new_one_off":null,"revised_repeat":null,"blackout_restriction":{"all":false}},"item":{"id":"n72nsw","type":"item","display_title":{"title":"The Finest Hours (2016)","subtitle":null},"year":null,"media_type":"video","specialization":"tv","source":{"key":"api.youview.tv","name":"YouView JSON","country":"GB"},"title":"The Finest Hours (2016)","description":"Drama based on a true story, recounting one of history's most daring coastguard rescue attempts. Stranded on a sinking oil tanker along with 30 other sailors, engineer Ray Sybert battles to buy his crew more time as Captain Bernie Webber and three of his colleagues tackle gigantic waves and gale-force winds in their astonishing bid to save the seamen.","image":"https://images.metabroadcast.com?source=http%3A%2F%2Fimages-live.youview.tv%2Fimages%2Fentity%2F52172983%2Fprimary%2F1_1024x576.jpg%3Fdefaultimg%3D0&ETag=z7ucT5kdAq7HuNQf%2FGTEJg%3D%3D","thumbnail":null,"duration":null,"container":null}}]},"terms_and_conditions":{"text":"Specific terms and conditions in your agreement with MetaBroadcast, and with any data provider, apply to your use of this data, and associated systems."},"results":1,"request":{"path":"/4/schedules/hsxv.json","parameters":{"annotations":"content.description","from":"2022-03-20T00:00:00Z","to":"2022-03-21T00:00:00Z","source":"api.youview.tv","key":"b4d2edb68da14dfb9e47b5465e99b1b1"}}}`

  const result = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      title: 'The Finest Hours (2016)',
      description: `Drama based on a true story, recounting one of history's most daring coastguard rescue attempts. Stranded on a sinking oil tanker along with 30 other sailors, engineer Ray Sybert battles to buy his crew more time as Captain Bernie Webber and three of his colleagues tackle gigantic waves and gale-force winds in their astonishing bid to save the seamen.`,
      icon: 'https://images.metabroadcast.com?source=http%3A%2F%2Fimages-live.youview.tv%2Fimages%2Fentity%2F52172983%2Fprimary%2F1_1024x576.jpg%3Fdefaultimg%3D0&ETag=z7ucT5kdAq7HuNQf%2FGTEJg%3D%3D',
      season: null,
      episode: null,
      start: '2022-03-19T23:30:00.000Z',
      stop: '2022-03-20T01:20:00.000Z'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: `{"schedule":{"channel":{"title":"BBC One HD","id":"hsxv","uri":"http://api.youview.tv/channels/dvb://233a..4484","images":[{"uri":"https://images.metabroadcast.com?source=http%3A%2F%2Fimages-live.youview.tv%2Fimages%2Fentity%2F8c4c0357-d7ee-5d8a-8bc4-b177b6875128%2Fident%2F1_1024x532.png%3Fdefaultimg%3D0&ETag=r5vyecG6of%2BhCbHeEClx0Q%3D%3D","mime_type":"image/png","type":null,"color":"monochrome","theme":"light_monochrome","aspect_ratio":null,"availability_start":null,"availability_end":null,"width":1024,"height":532,"hasTitleArt":null,"source":null}],"available_from":[{"key":"api.youview.tv","name":"YouView JSON","country":"GB"}],"source":{"key":"api.youview.tv","name":"YouView JSON","country":"GB"},"same_as":[],"media_type":"video","broadcaster":null,"aliases":[{"namespace":"youview:serviceLocator","value":"dvb://233a..4484"},{"namespace":"youview:channel:id","value":"8c4c0357-d7ee-5d8a-8bc4-b177b6875128"}],"genres":[],"high_definition":true,"timeshifted":null,"regional":null,"related_links":[],"start_date":null,"advertised_from":null,"advertised_to":null,"short_description":null,"medium_description":null,"long_description":null,"region":null,"target_regions":[],"channel_type":"CHANNEL","interactive":false,"transmission_types":["DTT"],"quality":"HD","hdr":false},"source":"api.youview.tv","entries":[]},"terms_and_conditions":{"text":"Specific terms and conditions in your agreement with MetaBroadcast, and with any data provider, apply to your use of this data, and associated systems."},"results":1,"request":{"path":"/4/schedules/hsxv.json","parameters":{"annotations":"content.description","from":"2022-03-20T00:00:00Z","to":"2022-03-21T00:00:00Z","source":"api.youview.tv","key":"b4d2edb68da14dfb9e47b5465e99b1b1"}}}`
  })
  expect(result).toMatchObject([])
})
