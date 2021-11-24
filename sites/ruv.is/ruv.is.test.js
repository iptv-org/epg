// npx epg-grabber --config=sites/ruv.is/ruv.is.config.js --channels=sites/ruv.is/ruv.is_is.channels.xml --output=.gh-pages/guides/is/ruv.is.epg.xml --days=2

const { parser, url, logo } = require('./ruv.is.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-25', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'ruv',
  xmltv_id: 'RUV.is'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe('https://www.ruv.is/dagskra/ruv/20211125')
})

it('can parse response', () => {
  const content = `<!DOCTYPE html><html lang="is" dir="ltr"> <head></head> <body> <div id="main-container"> <div id="page-wrapper"> <div id="page" class="container page"> <div id="columns" class="columns clearfix"> <main id="content-column" class="content-column" role="main"> <div class="content-inner"> <section id="main-content"> <div id="content" class="region"> <div id="block-system-main"> <div class="two-75-25 at-panel panel-display clearfix"> <div class="region region-two-75-25-first"> <div class="region-inner clearfix"> <div class="panel-pane pane-custom pane-2 no-title block"> <div class="block-inner clearfix"> <div class="block-content"> <div class="fill-white pad2 border"> <div id="ruv_api_calendar"> <ul class="unlist"> <li class=" views-row views-row-0 views-row-odd views-row-first border-bottom pad0y space1 clearfix " > <div class="fr inline"> <i tabindex="0" role="button" aria-expanded="false" aria-label="Sjá nánar Heimaleikfimi" title="Sjá nánar Heimaleikfimi" rel="5215669" class="inline fa fa-plus-circle description pointer" ></i> </div><strong class="field-content">13 : 00</strong> <div class="inline grey-color" title="Upptaka verður aðgengileg í Spilara og Appi" > <i class="icon icon-sarpurinn color-sarpurinn"></i> </div><span class="field-content ruv-color" ><a href="http://www.ruv.is/sjonvarp/spila/heimaleikfimi/30389/91pviq" target="_blank" ><b>Heimaleikfimi</b></a ></span ><em class="field-content color-gray"></em ><span class="field-content color-gray" ><i class="icon icon-vod color-gray" title="Upptaka aðgengileg í VOD-þjónustum" ></i></span ><span class="field-content color-gray" ><i class="icon icon-888 color-gray" title="Dagskrárliður er textaður á síðu 888 í Textavarpinu" ></i></span ><span class="field-content" ><i class="icon icon-endursynt color-gray" title="Endurtekið efni" ></i ></span> <div class="views-field views-field-nothing"> <span class="field-content" ><div class="content hidden mar2t" id="dagskra_item_5215669" > <div class="mar2r col12-mobile fl"> <a href="http://www.ruv.is/sjonvarp/spila/heimaleikfimi/30389/91pviq" target="_blank" ><img class=" image-style-medium col12-mobile fl mar1b " src="https://d38kdhuogyllre.cloudfront.net/fit-in/480x/filters:quality(65)/hd_posters/91pvig-3p3hig.jpg" width="250" height="141" alt="Mynd með færslu" title="Mynd með færslu"/></a> </div><span ><p> Góð ráð og æfingar sem tilvalið er að gera heima. Íris Rut Garðarsdóttir sjúkraþjálfari hefur umsjón með leikfiminni. e. </p></span > </div></span > </div></li><li class="views-row views-row-1 views-row-odd views-row border-bottom pad0y space1 clearfix"><div class="fr inline"><i tabindex="0" role="button" aria-expanded="false" aria-label="Sjá nánar Kastljós" title="Sjá nánar Kastljós" rel="5215993" class="inline fa pointer description_selected fa-minus-circle"></i></div><strong class="field-content">13 : 10</strong><div class="inline grey-color" title="Upptaka verður aðgengileg í Spilara og Appi"><i class="icon icon-sarpurinn "></i></div><span class="field-content ruv-color">Kastljós</span><em class="field-content color-gray"></em><span class="field-content color-gray"><i class="icon icon-vod color-gray" title="Upptaka aðgengileg í VOD-þjónustum"></i></span><span class="field-content color-gray"><i class="icon icon-888 color-gray" title="Dagskrárliður er textaður á síðu 888 í Textavarpinu"></i></span><span class="field-content"><i class="icon icon-endursynt color-gray" title="Endurtekið efni"></i></span><div class="views-field views-field-nothing"><span class="field-content"><div class="content mar2t" id="dagskra_item_5215993"><div class="mar2r col12-mobile fl"><img class="image-style-medium col12-mobile fl mar1b" src="https://d38kdhuogyllre.cloudfront.net/fit-in/480x/filters:quality(65)/hd_posters/95erq0-tmenfg.jpg" width="250" height="141" alt="Mynd með færslu" title="Mynd með færslu"></div><span><p>Ítarleg umfjöllun um það sem er efst á baugi í fréttum og mannlífi. Farið er ofan í kjölinn á stærstu fréttamálum dagsins með viðmælendum um land allt. Umsjónarmenn eru Einar Þorsteinsson og Jóhanna Vigdís Hjaltadóttir. e.</p></span></div></span></div></li><li class="views-row views-row-28 views-row-odd views-row border-bottom pad0y space1 clearfix"><strong class="field-content">00 : 10</strong><span class="field-content ruv-color">Dagskrárlok</span><em class="field-content color-gray"></em><span class="field-content"><i class="icon icon-geoblock color-gray" title="Eingöngu aðgengilegt á Íslandi"></i></span><div class="views-field views-field-nothing"><span class="field-content"><div class="content hidden mar2t" id="dagskra_item_5160443"><div class="mar2r col12-mobile fl"></div></div></span></div></li></ul> </div></div></div></div></div></div></div></div></div></div></section> </div></main> </div></div></div></div></body></html>`
  const result = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2021-11-25T13:00:00.000Z',
      stop: '2021-11-25T13:10:00.000Z',
      title: `Heimaleikfimi`,
      description:
        'Góð ráð og æfingar sem tilvalið er að gera heima. Íris Rut Garðarsdóttir sjúkraþjálfari hefur umsjón með leikfiminni. e.',
      icon: 'https://d38kdhuogyllre.cloudfront.net/fit-in/480x/filters:quality(65)/hd_posters/91pvig-3p3hig.jpg'
    },
    {
      start: '2021-11-25T13:10:00.000Z',
      stop: '2021-11-26T00:10:00.000Z',
      title: `Kastljós`,
      description:
        'Ítarleg umfjöllun um það sem er efst á baugi í fréttum og mannlífi. Farið er ofan í kjölinn á stærstu fréttamálum dagsins með viðmælendum um land allt. Umsjónarmenn eru Einar Þorsteinsson og Jóhanna Vigdís Hjaltadóttir. e.',
      icon: 'https://d38kdhuogyllre.cloudfront.net/fit-in/480x/filters:quality(65)/hd_posters/95erq0-tmenfg.jpg'
    },
    {
      start: '2021-11-26T00:10:00.000Z',
      stop: '2021-11-26T01:10:00.000Z',
      title: `Dagskrárlok`
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
