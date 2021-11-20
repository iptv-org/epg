// npx epg-grabber --config=sites/kvf.fo/kvf.fo.config.js --channels=sites/kvf.fo/kvf.fo_fo.channels.xml --output=.gh-pages/guides/fo/kvf.fo.epg.xml --days=2

const { parser, url, logo } = require('./kvf.fo.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-21', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '#',
  xmltv_id: 'KVFSjonvarp.fo',
  logo: 'https://kvf.fo/sites/all/themes/bootstrap_subtheme/logo.png'
}

it('can generate valid url', () => {
  expect(url({ date })).toBe('https://kvf.fo/nskra/uv?date=2021-11-21')
})

it('can get logo url', () => {
  expect(logo({ channel })).toBe('https://kvf.fo/sites/all/themes/bootstrap_subtheme/logo.png')
})

it('can parse response', () => {
  const content = `<!DOCTYPE html><html> <head></head> <body class="html not-front not-logged-in no-sidebars page-nskra page-nskra-uv"> <body> <div class="main-container container"> <div class="row"> <section class="col-sm-12"> <a id="main-content"></a> <div class="region region-content"> <section id="block-system-main" class="block block-system clearfix"> <div class="panel-flexible panels-flexible-339 clearfix"> <div class="panel-flexible-inside panels-flexible-339-inside"> <div class=" panels-flexible-row panels-flexible-row-339-main-row panels-flexible-row-last clearfix " > <div class=" inside panels-flexible-row-inside panels-flexible-row-339-main-row-inside panels-flexible-row-inside-last clearfix " > <div class=" panels-flexible-region panels-flexible-region-339-center panels-flexible-region-first " > <div class=" inside panels-flexible-region-inside panels-flexible-region-339-center-inside panels-flexible-region-inside-first " > <div class="panel-pane pane-views pane-ws-skr-ir"> <div class="pane-content"> <div class=" view view-ws-skr-ir view-id-ws_skr_ir view-display-id-page_uv s-pane view-dom-id-3dc4c119f4c633d65e7ed8b3c167d7a2 " > <div class="view-content"> <div class="views-row views-row-1"> <div class="s-normal"> <div class="s-time1"> <div class="s-time">00:00 - 02:00</div></div><div class="s-player"></div><div class="s-heiti">Plátubarrin</div><div class="s-option"> <div class="s-expand"> <img src="/sites/all/themes/bootstrap_subtheme/images/skra/plus.png"/> </div></div><div class="s-timer-notimer"></div></div><div class="s-sub" style="display: none"> <table class="s-insider"> <tr> <td class="c1"> <div class="s-imgsending"> <img typeof="foaf:Image" class="img-responsive" src="https://kvf.fo/sites/default/files/styles/nvf-very-small/public/platubarrin_1.jpg?itok=5kwClG66" width="116" height="65" alt=""/> </div></td><td class="c2"> <div class="s-subtitle"> Beinleiðis leygarkvøldssending við temaplátu og lurtaraynskjum. </div><div class="s-text"></div><div class="s-producer"> Jákup Magnussen er vertur. </div><div> <div class="s-sending"> <a href="/node/18941">Far til sendingasíðu</a> </div></div></td></tr></table> </div></div><div class="views-row views-row-26"> <div class="s-normal"> <div class="s-time1"> <div class="s-time">23:00 - 00:00</div></div><div class="s-player"></div><div class="s-heiti">Tónleikur</div><div class="s-option"> <div class="s-expand"> <img src="/sites/all/themes/bootstrap_subtheme/images/skra/plus.png"/> </div></div><div class="s-timer-notimer"></div></div><div class="s-sub" style="display: none"> <table class="s-insider"> <tbody> <tr> <td class="c1"></td><td class="c2"> <div class="s-subtitle"></div><div class="s-text"></div><div class="s-producer"></div><div></div></td></tr></tbody> </table> </div></div><div class="views-row views-row-26"> <div class="s-normal"> <div class="s-time1"> <div class="s-time">00:00 - 01:00</div></div><div class="s-player"></div><div class="s-heiti">Náttarrásin</div><div class="s-option"> <div class="s-expand"> <img src="/sites/all/themes/bootstrap_subtheme/images/skra/plus.png"/> </div></div><div class="s-timer-notimer"></div></div><div class="s-sub" style="display: none"> <table class="s-insider"> <tbody> <tr> <td class="c1"></td><td class="c2"> <div class="s-subtitle"></div><div class="s-text"></div><div class="s-producer"></div><div></div></td></tr></tbody> </table> </div></div></div></div></div></div></div></div></div></div></div></div></section> </div></section> </div></div></body> </body></html>`
  const result = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2021-11-21T00:00:00.000Z',
      stop: '2021-11-21T02:00:00.000Z',
      title: `Plátubarrin`
    },
    {
      start: '2021-11-21T23:00:00.000Z',
      stop: '2021-11-22T00:00:00.000Z',
      title: `Tónleikur`
    },
    {
      start: '2021-11-22T00:00:00.000Z',
      stop: '2021-11-22T01:00:00.000Z',
      title: `Náttarrásin`
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: `<!DOCTYPE html><html> <head></head> <body></body></html>`
  })
  expect(result).toMatchObject([])
})
