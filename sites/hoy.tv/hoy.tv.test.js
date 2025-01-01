const { parser, url } = require('./hoy.tv.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2024-09-13', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '76',
  xmltv_id: 'HOYIBC.hk',
  lang: 'zh'
}
const content = `<?xml version="1.0" encoding="UTF-8" ?>
<ProgramGuide>
 <Channel id="76">
  <EpgItem>
   <EpgStartDateTime>2024-09-13 11:30:00</EpgStartDateTime>
   <EpgEndDateTime>2024-09-13 12:30:00</EpgEndDateTime>
   <EpgOtherInfo>[PG]</EpgOtherInfo>
   <DisableLive>false</DisableLive>
   <DisableVod>false</DisableVod>
    <VODLicPeriod>2024-09-27 11:30:00</VODLicPeriod>
   <ProgramInfo>
    <ProgramId>0</ProgramId>
    <ProgramTitle></ProgramTitle>
    <ProgramPos>0</ProgramPos>
    <FirstRunDateTime></FirstRunDateTime>
    <ProgramThumbnailUrl>http://tv.fantv.hk/images/thumbnail_1920_1080_fantv.jpg</ProgramThumbnailUrl>
   </ProgramInfo>
   <EpisodeInfo>
    <EpisodeId>EQ00135</EpisodeId>
    <EpisodeIndex>46</EpisodeIndex>
    <EpisodeShortDescription>點講都係一家人</EpisodeShortDescription>
    <EpisodeLongDescription></EpisodeLongDescription>
    <EpisodeThumbnailUrl>http://tv.fantv.hk/images/nosuchthumbnail.jpg</EpisodeThumbnailUrl>
   </EpisodeInfo>
   <ComScore>
    <ns_st_stc></ns_st_stc>
    <ns_st_pr>點講都係一家人</ns_st_pr>
    <ns_st_tpr>0</ns_st_tpr>
    <ns_st_tep>EQ00135</ns_st_tep>
    <ns_st_ep>點講都係一家人 Episode 46</ns_st_ep>
    <ns_st_li>1</ns_st_li>
    <ns_st_tdt>20240913</ns_st_tdt>
    <ns_st_tm>1130</ns_st_tm>
    <ns_st_ty>0001</ns_st_ty>
    <ns_st_cl>3704000</ns_st_cl>
   </ComScore>
  </EpgItem>
  <EpgItem>
   <EpgStartDateTime>2024-09-13 12:30:00</EpgStartDateTime>
   <EpgEndDateTime>2024-09-13 13:30:00</EpgEndDateTime>
   <EpgOtherInfo></EpgOtherInfo>
   <DisableLive>false</DisableLive>
   <DisableVod>false</DisableVod>
    <VODLicPeriod>2024-09-27 12:30:00</VODLicPeriod>
   <ProgramInfo>
    <ProgramId>0</ProgramId>
    <ProgramTitle></ProgramTitle>
    <ProgramPos>0</ProgramPos>
    <FirstRunDateTime></FirstRunDateTime>
    <ProgramThumbnailUrl>http://tv.fantv.hk/images/thumbnail_1920_1080_fantv.jpg</ProgramThumbnailUrl>
   </ProgramInfo>
   <EpisodeInfo>
    <EpisodeId>ED00311</EpisodeId>
    <EpisodeIndex>0</EpisodeIndex>
    <EpisodeShortDescription>麝香之路</EpisodeShortDescription>
    <EpisodeLongDescription>Ep. 2 .The Secret of disappeared kingdom.shows the mysterious disappearance of the ancient Tibetan kingdom which gained world</EpisodeLongDescription>
    <EpisodeThumbnailUrl>http://tv.fantv.hk/images/nosuchthumbnail.jpg</EpisodeThumbnailUrl>
   </EpisodeInfo>
   <ComScore>
    <ns_st_stc></ns_st_stc>
    <ns_st_pr>麝香之路</ns_st_pr>
    <ns_st_tpr>0</ns_st_tpr>
    <ns_st_tep>ED00311</ns_st_tep>
    <ns_st_ep>麝香之路 2024-09-13</ns_st_ep>
    <ns_st_li>1</ns_st_li>
    <ns_st_tdt>20240913</ns_st_tdt>
    <ns_st_tm>1230</ns_st_tm>
    <ns_st_ty>0001</ns_st_ty>
    <ns_st_cl>3704000</ns_st_cl>
   </ComScore>
  </EpgItem>
 </Channel>
</ProgramGuide>`

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe('https://epg-file.hoy.tv/hoy/OTT7620240913.xml')
})

it('can parse response', () => {
  const result = parser({ content, channel, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2024-09-13T03:30:00.000Z',
      stop: '2024-09-13T04:30:00.000Z',
      title: '點講都係一家人[PG]',
      sub_title: '第46集'
    },
    {
      start: '2024-09-13T04:30:00.000Z',
      stop: '2024-09-13T05:30:00.000Z',
      title: '麝香之路',
      description:
        'Ep. 2 .The Secret of disappeared kingdom.shows the mysterious disappearance of the ancient Tibetan kingdom which gained world'
    }
  ])
})
