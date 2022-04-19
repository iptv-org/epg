// npx epg-grabber --config=sites/tvmi.mt/tvmi.mt.config.js --channels=sites/tvmi.mt/tvmi.mt_mt.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./tvmi.mt.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-04-21', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '1',
  xmltv_id: 'TVM.mt'
}

it('can generate valid url', () => {
  expect(url({ date })).toBe('https://www.tvmi.mt/mt/tvmi/skeda/?sd-date=2022-04-21')
})

it('can parse response', () => {
  const content = `<!doctype html><html lang="en-US" xmlns:fb="https://www.facebook.com/2008/fbml" xmlns:addthis="https://www.addthis.com/help/api-spec" > <head></head> <body class="page-template page-template-page-templates page-template-new-schedule page-template-page-templatesnew-schedule-php page page-id-457931 page-child parent-pageid-554693 blog-1 tvmi-page"> <div id="page" class="site relative "> <div id="content" class="site-content relative"> <div class="schedule"> <div class="content"> <div class="schedule-bottom"> <div class="schedules"> <div class="channel-schedule"> <div class="programmes"> <a href="#sorelle8211ittieletstaun" class="programme-wrapper" style="left: 300px; min-width: 300px; max-width: 300px;"> <div class="programme " style="min-width: 294px; max-width: 294px;"> <div class="programme-info"> <p class="title">Sorelle &#8211; It-Tielet Staġun </p><p class="times">06:30 - 07:00</p></div></div></a> <div class="remodal" data-remodal-id="sorelle8211ittieletstaun" data-remodal-options="modifier: skeda-programme-popup"> <button data-remodal-action="close" class="remodal-close"></button> <img class="image" src="https://www.tvmi.mt/mt/wp-content/uploads/sites/1/2019/09/pink-leather-11-for-Airing.png" alt=""> <div class="bottom-modal"> <div class="modal-top"> <div class="title-time"> <p class="programme-title">Sorelle &#8211; It-Tielet Staġun</p><p class="times">06:30 - 07:00</p></div><img class="logo" src="https://www.tvmi.mt/mt/wp-content/themes/tvm/dist/images/tvm-logo-2021.png" alt=""> </div><p class="description">Fit-tielet staġun ta’ <em>Sorelle</em> se naraw lill-aħwa, flimkien ma’ dawk kollha li sofrew taħt idejn Leo, inklużi martu Bella u bintu Janice, ikomplu jagħmlu minn kollox biex jeħilsu darba għal dejjem minnu. Il-fatti se juruna li dan mhu se jkun faċli xejn għax Leo għandu għeruq fil-fond u għalhekk għad baqagħlu ħafna sorpriżi għalihom ilkoll. Dan waqt li flimkien ikomplu jaraw kif jesponu lil dawk li b’xi mod jew ieħor ikun qed jirnexxilhom jaħarbu mill-awtoritajiet.</p><div class="flex" style="margin-left: -10px; margin-right: -10px;"> <a class="more-button" href="https://www.tvmi.mt/mt/tvmi/programmes/sorelle-it-tielet-stagun/"> ARA IKTAR </a> </div></div></div><a href="#ta8217filgodu" class="programme-wrapper" style="left: 600px; min-width: 1200px; max-width: 1200px;"> <div class="programme " style="min-width: 1194px; max-width: 1194px;"> <div class="programme-info"> <p class="title">Ta’ Filgħodu </p><p class="times">07:00 - 09:00</p></div></div></a> <div class="remodal" data-remodal-id="ta8217filgodu" data-remodal-options="modifier: skeda-programme-popup"> <button data-remodal-action="close" class="remodal-close"></button> <img class="image" src="https://www.tvmi.mt/mt/wp-content/uploads/sites/1/2021/09/ta-Filghodu-02.jpeg" alt=""> <div class="bottom-modal"> <div class="modal-top"> <div class="title-time"> <p class="programme-title">Ta’ Filgħodu</p><p class="times">07:00 - 09:00</p></div><img class="logo" src="https://www.tvmi.mt/mt/wp-content/themes/tvm/dist/images/tvm-logo-2021.png" alt=""> </div><p class="description"><strong><em>Ta' Filgħodu</em></strong>&nbsp;se jkun qed jibda jum ġdid fuq nota pożittiva; b'informazzjoni u aġġornamenti regolari dwar it-traffiku, it-temp u l-ewwel faċċati tal-gazzetti mal-ewwel tazza cafè. Dan iwassalna biex flimkien ma’ Ray Attard niltaqgħu mal-protagonisti li minn wara l-kwinti jkunu qed jagħmlu l-ġurnata ta’ kulħadd waħda isbaħ fl-oqsma rispettivi tagħhom.&nbsp;<em>Ta' Filgħodu</em>&nbsp;se jkun kurrenti imma din id-darba minn angoli oħra ta’ interess, li bis-sewwa se jkunu qed jgħarrfu lit-telespettaturi b'dak kollu li jkun qed jiġri madwarna.&nbsp;Preżentazzjoni ta’ Ray Attard.</p><div class="flex" style="margin-left: -10px; margin-right: -10px;"> <a class="more-button" href="https://www.tvmi.mt/mt/tvmi/programmes/ta-filghodu/"> ARA IKTAR </a> </div></div></div></div></div><div class="channel-schedule"> <div class="programmes"> <a href="#euronews" class="programme-wrapper" style="left: -3600px; min-width: 150px; max-width: 150px;"> <div class="programme " style="min-width: 144px; max-width: 144px;"> <div class="programme-info"> <p class="title">EuroNews </p><p class="times">00:00 - 00:15</p></div></div></a> </div></div></div></div></div></div></div></div></body></html>`
  const result = parser({ content, channel, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-04-21T04:30:00.000Z',
      stop: '2022-04-21T05:00:00.000Z',
      title: 'Sorelle – It-Tielet Staġun',
      description:
        'Fit-tielet staġun ta’ Sorelle se naraw lill-aħwa, flimkien ma’ dawk kollha li sofrew taħt idejn Leo, inklużi martu Bella u bintu Janice, ikomplu jagħmlu minn kollox biex jeħilsu darba għal dejjem minnu. Il-fatti se juruna li dan mhu se jkun faċli xejn għax Leo għandu għeruq fil-fond u għalhekk għad baqagħlu ħafna sorpriżi għalihom ilkoll. Dan waqt li flimkien ikomplu jaraw kif jesponu lil dawk li b’xi mod jew ieħor ikun qed jirnexxilhom jaħarbu mill-awtoritajiet.',
      icon: 'https://www.tvmi.mt/mt/wp-content/uploads/sites/1/2019/09/pink-leather-11-for-Airing.png'
    },
    {
      start: '2022-04-21T05:00:00.000Z',
      stop: '2022-04-21T07:00:00.000Z',
      title: 'Ta’ Filgħodu',
      description:
        "Ta' Filgħodu se jkun qed jibda jum ġdid fuq nota pożittiva; b'informazzjoni u aġġornamenti regolari dwar it-traffiku, it-temp u l-ewwel faċċati tal-gazzetti mal-ewwel tazza cafè. Dan iwassalna biex flimkien ma’ Ray Attard niltaqgħu mal-protagonisti li minn wara l-kwinti jkunu qed jagħmlu l-ġurnata ta’ kulħadd waħda isbaħ fl-oqsma rispettivi tagħhom. Ta' Filgħodu se jkun kurrenti imma din id-darba minn angoli oħra ta’ interess, li bis-sewwa se jkunu qed jgħarrfu lit-telespettaturi b'dak kollu li jkun qed jiġri madwarna. Preżentazzjoni ta’ Ray Attard.",
      icon: 'https://www.tvmi.mt/mt/wp-content/uploads/sites/1/2021/09/ta-Filghodu-02.jpeg'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: `<!doctype html><html><head></head><body></body></html>`,
    channel
  })
  expect(result).toMatchObject([])
})
