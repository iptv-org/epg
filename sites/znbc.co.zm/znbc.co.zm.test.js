// npx epg-grabber --config=sites/znbc.co.zm/znbc.co.zm.config.js --channels=sites/znbc.co.zm/znbc.co.zm.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./znbc.co.zm.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-25', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'tv1',
  xmltv_id: 'ZNBCTV1.zm'
}
const content = `<!DOCTYPE html><html lang="en-US"> <head></head> <body class=" page-template-default page page-id-3208 pmpro-body-has-access dark-background dark-version sticky-menu-on sticky-sidebar-on disable-floating-video header-vid-tech fullwidth-mode-enable beeteam368 elementor-default elementor-kit-8942 elementor-page elementor-page-3208 " > <div id="site-wrap-parent" class="site-wrap-parent site-wrap-parent-control"> <div id="site-wrap-children" class="site-wrap-children site-wrap-children-control"> <div id="primary-content-wrap" class="primary-content-wrap"> <div class="primary-content-control"> <div class="site__container fullwidth-vidorev-ctrl container-control"> <div class="site__row sidebar-direction"> <main id="main-content" class="site__col main-content"> <div class="single-page-wrapper global-single-wrapper"> <article id="post-3208" class=" single-page-content global-single-content post-3208 page type-page status-publish hentry pmpro-has-access " > <header class="entry-header"> <h1 class="entry-title extra-bold">TV1</h1> </header> <div class="entry-content"> <div data-elementor-type="wp-post" data-elementor-id="3208" class="elementor elementor-3208" data-elementor-settings="[]" > <div class="elementor-inner"> <div class="elementor-section-wrap"> <section class=" elementor-section elementor-top-section elementor-element elementor-element-10b3bf40 elementor-section-stretched elementor-section-full_width elementor-section-height-default elementor-section-height-default " data-id="10b3bf40" data-element_type="section" data-settings='{"stretch_section":"section-stretched"}' > <div class="elementor-container elementor-column-gap-default"> <div class="elementor-row"> <div class=" elementor-column elementor-col-100 elementor-top-column elementor-element elementor-element-50fbf4da " data-id="50fbf4da" data-element_type="column" > <div class="elementor-column-wrap elementor-element-populated" > <div class="elementor-widget-wrap"> <div class=" elementor-element elementor-element-54d50366 elementor-tabs-view-horizontal elementor-widget elementor-widget-tabs " data-id="54d50366" data-element_type="widget" data-widget_type="tabs.default" > <div class="elementor-widget-container"> <div class="elementor-tabs" role="tablist"> <div class="elementor-tabs-content-wrapper"> <div class=" elementor-tab-title elementor-tab-mobile-title " data-tab="4" role="tab" > WEDNESDAY </div><div id="elementor-tab-content-1424" class="elementor-tab-content elementor-clearfix" data-tab="4" role="tabpanel" aria-labelledby="elementor-tab-title-1424" > <table> <tbody> <tr> <td width="638"> <p>23:30   EYE ON SADC</p></td></tr></tbody> </table> </div><div class=" elementor-tab-title elementor-tab-mobile-title " data-tab="5" role="tab" > THURSDAY </div><div id="elementor-tab-content-1425" class="elementor-tab-content elementor-clearfix" data-tab="5" role="tabpanel" aria-labelledby="elementor-tab-title-1425" > <table> <tbody> <tr style="background-color: #f0eded"> <td> <span style="color: #000000" >TIME&nbsp; &nbsp; &nbsp; &nbsp; PROGRAMME<img alt="" width="91" height="32" data-src="https://www.znbc.co.zm/wp-content/uploads/2019/04/TV2-Logo.jpg" class=" wp-image-5259 alignright lazyloaded " src="https://www.znbc.co.zm/wp-content/uploads/2019/04/TV2-Logo.jpg"/></span> </td></tr><tr> <td width="638"> <p>00:00   MAIN NEWS &#8211; RPT</p></td></tr><tr> <td width="638"> <p> 01:00   BORN &amp; BRED – Rebroadcast (Tuesday Edition) </p></td></tr><tr> <td width="638"> <p> <strong>02:00   </strong>DOCUMENTARY &#8211;  DW </p></td></tr></tbody> </table> </div></div></div></div></div></div></div></div></div></div></section> </div></div></div></div></article> </div></main> </div></div></div></div></div></div></body></html>`

it('can generate valid url', () => {
  expect(url({ channel })).toBe('https://www.znbc.co.zm/tv1/')
})

it('can parse response', () => {
  const result = parser({ content, channel, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2021-11-24T22:00:00.000Z',
      stop: '2021-11-24T23:00:00.000Z',
      title: `MAIN NEWS – RPT`
    },
    {
      start: '2021-11-24T23:00:00.000Z',
      stop: '2021-11-25T00:00:00.000Z',
      title: `BORN & BRED – Rebroadcast (Tuesday Edition)`
    },
    {
      start: '2021-11-25T00:00:00.000Z',
      stop: '2021-11-25T00:30:00.000Z',
      title: `DOCUMENTARY – DW`
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
