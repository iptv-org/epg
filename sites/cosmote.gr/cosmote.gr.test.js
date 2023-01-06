// npx epg-grabber --config=sites/cosmote.gr/cosmote.gr.config.js --channels=sites/cosmote.gr/cosmote.gr.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./cosmote.gr.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

const date = dayjs.utc('2021-11-25', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '4e',
  xmltv_id: '4E.gr'
}
const content = `<!DOCTYPE html><html class="aui ltr" dir="ltr" lang="el-GR"> <head></head> <body> <div id="page-wrap"> <section id="main-content" class="container-fluid homepage-layout" role="main"> <div class="row-fluid no-space"> <div class="portlet-column portlet-column-only col-xs-12" id="column-5"> <div class="portlet-dropzone portlet-column-content portlet-column-content-only" id="layout-column_column-5" > <div class=" portlet-boundary portlet-boundary_channelprogram_WAR_OTETVportlet_ portlet-static portlet-static-end channel-program-portlet " id="p_p_id_channelprogram_WAR_OTETVportlet_" > <section class="portlet" id="portlet_channelprogram_WAR_OTETVportlet"> <div class="portlet-content"> <div class="portlet-content-container"> <div class="portlet-body"> <section class="channel_program"> <div class="tabbable"> <div class="tab-content limiter"> <div class="tab-pane fade active in" id="broadband"> <div class="row"> <div class="col-sm-2"> <img class="channel_program-banner" alt="4Ε" title="4Ε" src="/portal/image/journal/article?img_id=56014332&t=1544180299920"/> </div><div class="col-sm-10"> <table class="channel_program-table table"> <tbody id="_channelprogram_WAR_OTETVportlet_programs"> <tr class="hidden-xs"> <td class="channel_program-table--program"> <a href="https://www.cosmote.gr/cosmotetv/residential/program/epg/closeupepg?p_p_id=epgcloseup_WAR_OTETVportlet&p_p_lifecycle=0&p_p_col_id=column-5&p_p_col_count=1&_epgcloseup_WAR_OTETVportlet_articleId=119045589&_epgcloseup_WAR_OTETVportlet_redirect=https%253A%252F%252Fwww.cosmote.gr%252Fportal%252Fresidential%252Fprogram%252Fepg%252Fprogramchannel" >Μαθαίνω να Είμαι Γονιός</a >&nbsp; </td><td class=" channel_program-table--time channel_program-table--program_type " > <span class="start-time">01:15</span> - <span class="end-time">01:50</span> (<span class="duration" >35'</span >) | Ντοκιμαντέρ </td></tr><tr class="visible-xs"> <td class=" channel_program-table--program channel_program-table--time channel_program-table--program_type " colspan="2" > <span class="start-time">01:15</span> - <span class="end-time">01:50</span> (<span class="duration" >35'</span >) | Ντοκιμαντέρ<br/> <a href="https://www.cosmote.gr/cosmotetv/residential/program/epg/closeupepg?p_p_id=epgcloseup_WAR_OTETVportlet&p_p_lifecycle=0&p_p_col_id=column-5&p_p_col_count=1&_epgcloseup_WAR_OTETVportlet_articleId=119045589&_epgcloseup_WAR_OTETVportlet_redirect=https%253A%252F%252Fwww.cosmote.gr%252Fportal%252Fresidential%252Fprogram%252Fepg%252Fprogramchannel" >Μαθαίνω να Είμαι Γονιός</a >&nbsp; </td></tr><tr class="hidden"></tr><tr class="hidden-xs"> <td class="channel_program-table--program"> <a href="https://www.cosmote.gr/cosmotetv/residential/program/epg/closeupepg?p_p_id=epgcloseup_WAR_OTETVportlet&p_p_lifecycle=0&p_p_col_id=column-5&p_p_col_count=1&_epgcloseup_WAR_OTETVportlet_articleId=119045942&_epgcloseup_WAR_OTETVportlet_redirect=https%253A%252F%252Fwww.cosmote.gr%252Fportal%252Fresidential%252Fprogram%252Fepg%252Fprogramchannel" >Μικρό Απόδειπνο</a >&nbsp; </td><td class=" channel_program-table--time channel_program-table--program_type " > <span class="start-time">23:00</span> - <span class="end-time">23:45</span> (<span class="duration" >45'</span >) | Special </td></tr><tr class="visible-xs"> <td class=" channel_program-table--program channel_program-table--time channel_program-table--program_type " colspan="2" > <span class="start-time">23:00</span> - <span class="end-time">23:45</span> (<span class="duration" >45'</span >) | Special<br/> <a href="https://www.cosmote.gr/cosmotetv/residential/program/epg/closeupepg?p_p_id=epgcloseup_WAR_OTETVportlet&p_p_lifecycle=0&p_p_col_id=column-5&p_p_col_count=1&_epgcloseup_WAR_OTETVportlet_articleId=119045942&_epgcloseup_WAR_OTETVportlet_redirect=https%253A%252F%252Fwww.cosmote.gr%252Fportal%252Fresidential%252Fprogram%252Fepg%252Fprogramchannel" >Μικρό Απόδειπνο</a >&nbsp; </td></tr><tr class="hidden"></tr><tr class="hidden-xs"> <td class="channel_program-table--program"> <a href="https://www.cosmote.gr/cosmotetv/residential/program/epg/closeupepg?p_p_id=epgcloseup_WAR_OTETVportlet&p_p_lifecycle=0&p_p_col_id=column-5&p_p_col_count=1&_epgcloseup_WAR_OTETVportlet_articleId=119045955&_epgcloseup_WAR_OTETVportlet_redirect=https%253A%252F%252Fwww.cosmote.gr%252Fportal%252Fresidential%252Fprogram%252Fepg%252Fprogramchannel" >Πανηγυρική Αρχιερατική Θεία Λειτουργία</a >&nbsp; </td><td class=" channel_program-table--time channel_program-table--program_type " > <span class="start-time">23:45</span> - <span class="end-time">03:00</span> (<span class="duration" >195'</span >) | Special </td></tr><tr class="visible-xs"> <td class=" channel_program-table--program channel_program-table--time channel_program-table--program_type " colspan="2" > <span class="start-time">23:45</span> - <span class="end-time">03:00</span> (<span class="duration" >195'</span >) | Special<br/> <a href="https://www.cosmote.gr/cosmotetv/residential/program/epg/closeupepg?p_p_id=epgcloseup_WAR_OTETVportlet&p_p_lifecycle=0&p_p_col_id=column-5&p_p_col_count=1&_epgcloseup_WAR_OTETVportlet_articleId=119045955&_epgcloseup_WAR_OTETVportlet_redirect=https%253A%252F%252Fwww.cosmote.gr%252Fportal%252Fresidential%252Fprogram%252Fepg%252Fprogramchannel" >Πανηγυρική Αρχιερατική Θεία Λειτουργία</a >&nbsp; </td></tr><tr class="hidden"></tr></tbody> </table> </div></div></div></div></div></section> </div></div></div></section> </div></div></div></div></section> </div></body></html>`

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://www.cosmote.gr/cosmotetv/residential/program/epg/programchannel?p_p_id=channelprogram_WAR_OTETVportlet&p_p_lifecycle=0&_channelprogram_WAR_OTETVportlet_platform=IPTV&_channelprogram_WAR_OTETVportlet_date=25-11-2021&_channelprogram_WAR_OTETVportlet_articleTitleUrl=4e'
  )
})

it('can parse response', () => {
  const result = parser({ content, channel, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2021-11-24T23:15:00.000Z',
      stop: '2021-11-24T23:50:00.000Z',
      title: `Μαθαίνω να Είμαι Γονιός`,
      category: 'Ντοκιμαντέρ'
    },
    {
      start: '2021-11-25T21:00:00.000Z',
      stop: '2021-11-25T21:45:00.000Z',
      title: `Μικρό Απόδειπνο`,
      category: 'Special'
    },
    {
      start: '2021-11-25T21:45:00.000Z',
      stop: '2021-11-26T01:00:00.000Z',
      title: `Πανηγυρική Αρχιερατική Θεία Λειτουργία`,
      category: 'Special'
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
