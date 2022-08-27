// npx epg-grabber --config=sites/mediaklikk.hu/mediaklikk.hu.config.js --channels=sites/mediaklikk.hu/mediaklikk.hu_hu.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./mediaklikk.hu.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-03-10', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '3',
  xmltv_id: 'DuneTV.hu'
}

it('can generate valid url', () => {
  expect(url).toBe(
    'https://mediaklikk.hu/wp-content/plugins/hms-global-widgets/widgets/programGuide/programGuideInterface.php'
  )
})

it('can generate valid request method', () => {
  expect(request.method).toBe('POST')
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    'Content-Type': 'application/x-www-form-urlencoded'
  })
})

it('can generate valid request data', () => {
  const result = request.data({ date, channel })
  expect(result.get('ChannelIds')).toBe('3,')
  expect(result.get('Date')).toBe('2022-03-10')
})

it('can parse response', () => {
  const content = `<div class="mediaklikkOwlWrapper channels_num_1"> <div class="mediaklikkOwlItem" data-channelid="3" data-channelshortcode="" data-buttontype="" data-channelname="" data-date="2022-03-10" data-videoPageUrl="" > <div class="tvguide channel mainsite"> <div data-thisdate="2022-03-10" class="channel_body" data-type="0"> <ul> <li class="program_body " style="" data-from="2022-03-10 00:35:35" data-till="2022-03-10 01:35:54" data-bci="1" data-vpi=" "data-vpslug="" > <div class="time"> <time >00:35</time> <div class="elo " style="display: none"><span class="live_play"></span>Élő</div><button style="display: none" ></button> </div><div class="program_info"> <h1> A tengeralattjáró (2018) </h1> <span class="status disabled "></span><span class="agelimitico tizennyolc" ></span> <p>4. rész, 57 perc, 2018</p></div><div class="program_about" style="display: none;"> <div class="program_photo" style="background-image:url('https://mediaklikk.hu/wp-content/uploads/sites/4/2020/06/00-150x150.jpg')"></div><div class="program_description"> <p> A La Rochelle-ben történt robbanás után a polgármester parancsot kap néhány súlyos intézkedés meghozatalára. Az ellenséges támadás után az U-612 fedélzetén a bajtársiasság terén gondok mutatkoznak. Hoffmann és Tennstedt rivalizálása és a legénység közt tapasztalható feszültség veszélybe sodorja küldetésüket.<br/>(Eredeti hang digitálisan.) </p></div><div class="notifications" style="" > <div class="notice" style="display: none;"> <span></span> <p>Értesítést kérek</p></div><div class="program_site" onclick="location.href='https://mediaklikk.hu/musor/a-tengeralattjaro'"> <span></span> <p>Műsoroldal</p></div></div><button style="display: none" ></button> </div></li></ul> </div></div></div></div>`

  const result = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-03-09T23:35:35.000Z',
      stop: '2022-03-10T00:35:54.000Z',
      title: `A tengeralattjáró (2018)`,
      description:
        'A La Rochelle-ben történt robbanás után a polgármester parancsot kap néhány súlyos intézkedés meghozatalára. Az ellenséges támadás után az U-612 fedélzetén a bajtársiasság terén gondok mutatkoznak. Hoffmann és Tennstedt rivalizálása és a legénység közt tapasztalható feszültség veszélybe sodorja küldetésüket.(Eredeti hang digitálisan.)',
      icon: 'https://mediaklikk.hu/wp-content/uploads/sites/4/2020/06/00-150x150.jpg'
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
