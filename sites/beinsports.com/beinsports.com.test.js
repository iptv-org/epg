// npx epg-grabber --config=sites/beinsports.com/beinsports.com.config.js --channels=sites/beinsports.com/beinsports.com_qa.channels.xml --days=2 --output=.gh-pages/guides/qa/beinsports.com.epg.xml

const { parser, url, logo } = require('./beinsports.com.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-10-24', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: '1', xmltv_id: 'BeInSports.qa' }
const content = `<script>
currenthour="10";
</script>
<div class=containertop>
<div class='row no-gutter'>
<div class='col-xs-12 col-sm-12 col-md-12 col-lg-12'>
</div></div><div class='row no-gutter'>
<div class='col-xs-12 col-sm-12 col-md-12 col-lg-12'>
</div>
</div><div class='row no-gutter'>
<div class='col-xs-12 col-sm-12 col-md-12 col-lg-12'>
<div style='background-color:#d1d0de;margin:0px auto;text-align:center;display:flex;width:100%'><div id=left style=width:25px;background-color:red;height:50px;padding-top:13px;background-color:#d1d0de;><img src=ico/left.png onclick=ptime()></div><div id='slider_timer' class='slider_time'>
<ul id='timer'></ul></div><div id=left style=width:25px;background-color:red;height:50px;padding-top:13px;background-color:#d1d0de><img src=ico/right.png onclick=ntime()></div></div>
</div>
</div><div class='row no-gutter' style='height:15px'></div>
<div class='row no-gutter'>
<div class='col-xs-7 col-xs-offset-5 col-sm-4 col-sm-offset-8 col-md-2 col-md-offset-10 col-lg-2 col-lg-offset-10'>
<div class="onoffswitch" style=float:left><input onchange=showhides() type="checkbox" name="onoffswitch" class="onoffswitch-checkbox" id="myonoffswitch" tabindex="0"><label class="onoffswitch-label" for="myonoffswitch"><span class="onoffswitch-inner"></span><span class="onoffswitch-switch"></span></label></div><div style='position:relative;float:left;font-size:18px;margin-top:5px;left:30px'>Live Events</div></div></div><div class='row no-gutter' style='height:10px'></div>
<div class='row no-gutter'>
<div class='col-xs-12 col-sm-12 col-md-12 col-lg-12'>
<div id='loader_inner' style='display:none;margin:0 auto;width:100%;margin-top:5px;margin-bottom:5px;text-align:center'>
<div style='text-align:center;margin:auto 0'><img align=center src='images/ajax-loader.gif'></div>
</div>
</div>
</div>
</div><div class='container'><div class='row no-gutter' id=channels_1>
<div class='col-xs-3 col-sm-2 col-md-2 col-lg-1'>
  <div style='width:100%;text-align:center;'>
  <div class=channel>
  <div class=centered>
  <img  style=width:70%;height:auto onclick=getconnect('channel_19_global') align=center    src='https://assets.bein.com/mena/sites/3/2015/06/bein_SPORTS_FTA_DIGITAL_Mono.png'>
  </div>
  </div>
  </div>
</div>
<div class='col-xs-8 col-sm-9 col-md-9 col-lg-10'>
  <div id='slider_1' class=slider><ul id='ul_slider_1'><li live='0' id='slider_1_item1' data-id='slider_1_item1' data-index='1' data-start='0' data-start-m='0' data-end='00' data-end-m='40' data-img='mena_sports/https://assets.bein.com/mena/sites/3/2015/06/bein_SPORTS_FTA_DIGITAL_Mono.png' data-desc='' parent='slider_1' category='MotorSports'>
    <div class=onecontent>
    <p class=title>Red Bull Car Park Drift 2021</p>
    <p class=format>MotorSports</p>
    </div>
<div class=timer><p class=time>21:45&nbsp;-&nbsp;00:40</p>
<div class='progress'><div id=teas class='progress-bar progress-bar-custom' role='progressbar' aria-valuenow='0' aria-valuemin='0' aria-valuemax='100'> <span class='sr-only'>70% Complete</span></div></div></div> </li>

<div><ul><li class=item_normal></li><li class=item_normal></li></ul>  </ul></div>
</div>
<div class='col-xs-1 nextarrow col-sm-1 nextarrow col-md-1 nextarrow col-lg-1 nextarrow'>
  <div class='centered'>
  <img align=center width=15 height=15 src=images/nextarrow_en.svg style=cursor:pointer onclick=action('slider_22')>
</div>
</div>
</div>
<div class='row no-gutter' style='height:15px' id='ruler_channels_22'></div>
<div class='row no-gutter' id='cta_row'><div id='cta' class='col-xs-12 col-sm-12 col-md-12 col-lg-12'><img style=cursor:pointer onclick=gobein('entertainment','a')   class='img-responsive' src=images/entertain_cta_ar.png></div><div></div></div>
<div id="immobile" style="display:'none'"></div><div id="imtablet" style="display:'none'"></div><div id="imdesktop" style="display:'none'"></div>
`

it('can generate valid url', () => {
  const result = url({ date })
  expect(result).toBe(
    'https://epg.beinsports.com/utctime.php?mins=00&serviceidentity=beinsports.com&cdate=2021-10-24'
  )
})

it('can get logo url', () => {
  const result = logo({ content, channel })
  expect(result).toBe(
    'https://assets.bein.com/mena/sites/3/2015/06/bein_SPORTS_FTA_DIGITAL_Mono.png'
  )
})

it('can parse response', () => {
  const result = parser({ date, channel, content })
  expect(result).toMatchObject([
    {
      start: 'Sat, 23 Oct 2021 21:45:00 GMT',
      stop: 'Sun, 24 Oct 2021 00:40:00 GMT',
      title: 'Red Bull Car Park Drift 2021',
      category: 'MotorSports'
    }
  ])
})
