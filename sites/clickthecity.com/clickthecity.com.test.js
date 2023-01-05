// npm run channels:parse -- --config=./sites/clickthecity.com/clickthecity.com.config.js --output=./sites/clickthecity.com/clickthecity.com.channels.xml
// npx epg-grabber --config=sites/clickthecity.com/clickthecity.com.config.js --channels=sites/clickthecity.com/clickthecity.com.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./clickthecity.com.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-03-05', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'tv5',
  xmltv_id: 'TV5.ph'
}

it('can generate valid url', () => {
  expect(url({ channel })).toBe('https://www.clickthecity.com/tv/network/tv5')
})

it('can generate valid request method', () => {
  expect(request.method).toBe('POST')
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    'content-type': 'application/x-www-form-urlencoded'
  })
})

it('can generate valid request data', () => {
  const result = request.data({ date })
  expect(result.get('optDate')).toBe('2022-03-05')
  expect(result.get('optTime')).toBe('00:00:00')
})

it('can parse response', () => {
  const content = `<!doctypehtml><html class=html lang=en-US prefix="og: https://ogp.me/ns#"><body class="aa-prefix-click- content-right-sidebar default-breakpoint dropdown-mobile elementor-default elementor-kit-114471 elementor-page-62235 elementor-template-full-width has-breadcrumbs has-sidebar network-template-default oceanwp-theme page-header-disabled postid-62183 single single-network wp-custom-logo wp-embed-responsive"itemscope=itemscope itemtype=https://schema.org/WebPage><div class="clr site"id=outer-wrap><a class="screen-reader-text skip-link"href=#main>Skip to content</a><div class=clr id=wrap><main class="clr site-main"id=main role=main><div class="category-tv elementor elementor-62235 elementor-location-single entry has-media has-post-thumbnail hentry network post-62183 status-publish type-network"data-elementor-id=62235 data-elementor-settings=[] data-elementor-type=single><div class=elementor-section-wrap><section class="elementor-element elementor-section-height-default elementor-section-height-default elementor-element-9dc0219 elementor-section elementor-section-boxed elementor-top-section"data-element_type=section data-id=9dc0219><div class="elementor-column-gap-default elementor-container"><div class=elementor-row><div class="elementor-element elementor-col-50 elementor-column elementor-element-b6192ca elementor-top-column"data-element_type=column data-id=b6192ca data-settings='{"background_background":"classic"}'><div class="elementor-column-wrap elementor-element-populated"><div class=elementor-widget-wrap><div class="elementor-element elementor-element-c4989ed elementor-widget elementor-widget-shortcode"data-element_type=widget data-id=c4989ed data-widget_type=shortcode.default><div class=elementor-widget-container><div class=elementor-shortcode><form class=form-inline id=frmTV method=POST name=frmTV role=form><div class=w-100><table class="card d-table overflow-hidden rounded shadow table table-bordered table-striped"id=tvlistings><tr class="bg-dark text-light"><th colspan=2>Tomorrow, March 05<tr><td class=cTme width=100>12:00 am<td class="cPrg showlnkcon"><a class="font-weight-bold text-dark"href="/tv/tvshow.php?id=109793&amp;starttime=12%3A00+AM&amp;endtime=1%3A00+AM"name=0>CCF Worship Service</a><tr><td class=cTme width=100>06:30 am<td class="cPrg showlnkcon"><a class="font-weight-bold text-dark"href="/tv/tvshow.php?id=94697&amp;starttime=6%3A30+AM&amp;endtime=7%3A30+AM"name=1>Word Of God</a><tr class="bg-dark text-light"><th colspan="2">Tonight, March 05</th></tr><tr> <td class="cTme">08:00 pm</td><td class="cPrg showlnkcon"> <a class="font-weight-bold text-dark" name="10" href="/tv/tvshow.php?id=113538&amp;starttime=8%3A00+PM&amp;endtime=9%3A00+PM">Rated Korina S2 </a> </td></tr><tr class="bg-dark text-light"><th colspan=2>Sunday, March 06<tr><td class=cTme>12:00 am<td class="cPrg showlnkcon"><a class="font-weight-bold text-dark"href="/tv/tvshow.php?id=114754&amp;starttime=12%3A00+AM&amp;endtime=3%3A30+AM"name=13>2021 PBA Governor's Cup</a></table></div></form></div></div></div></div></div></div></div></div></section></div></div></main></div></div>`

  const result = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-03-04T16:00:00.000Z',
      stop: '2022-03-04T17:00:00.000Z',
      title: `CCF Worship Service`
    },
    {
      start: '2022-03-04T22:30:00.000Z',
      stop: '2022-03-04T23:30:00.000Z',
      title: `Word Of God`
    },
    {
      start: '2022-03-05T12:00:00.000Z',
      stop: '2022-03-05T13:00:00.000Z',
      title: `Rated Korina S2`
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: `<!DOCTYPE html><html class="html" lang="en-US" prefix="og: https://ogp.me/ns#"><head></head><body></body></html>`
  })
  expect(result).toMatchObject([])
})
