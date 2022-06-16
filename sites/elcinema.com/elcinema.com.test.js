// npx epg-grabber --config=sites/elcinema.com/elcinema.com.config.js --channels=sites/elcinema.com/elcinema.com_eg-en.channels.xml --output=.gh-pages/guides/eg-en/elcinema.com.epg.xml --days=2
// npx epg-grabber --config=sites/elcinema.com/elcinema.com.config.js --channels=sites/elcinema.com/elcinema.com_eg-ar.channels.xml --output=.gh-pages/guides/eg-ar/elcinema.com.epg.xml --days=2

const { parser, url, request } = require('./elcinema.com.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-11', 'YYYY-MM-DD').startOf('d')
const channelAR = {
  lang: 'ar',
  site_id: '1127',
  xmltv_id: 'MBC.ae'
}
const channelEN = {
  lang: 'en',
  site_id: '1127',
  xmltv_id: 'MBC.ae'
}
const contentAR = `<!DOCTYPE html><html lang="ar" dir="rtl"> <head></head> <body> <div class="row"> <div class="columns small-12 min-body"> <div class="intro-box"> <div class="row"> <div class="columns large-2"> <img src="https://media.elcinema.com/tvguide/1127_1.png" alt=""/> </div></div></div><div class="row tvgrid"> <div class="columns small-12"> <div class="dates">الخميس  11  نوفمبر</div></div><div class="columns small-12"> <div class="boxed-category-3 padded-half"> <div class="row"> <div class="columns small-3 large-2"> <ul class="unstyled text-center"> <li>12:30 مساءً</li><li><span class="subheader">[30 دقيقة]</span></li></ul> </div><div class="columns small-3 large-1"> <a href="/work/2009394/" ><img class="lazy-loaded" data-src="https://media.elcinema.com/uploads/_150x200_2f74473c92a69d7bfd25bd7fca8576168e8a58da4dd5cb8222eb1297caa13915.jpg" src=""/></a> </div><div class="columns small-6 large-3"> <ul class="unstyled no-margin"> <li><a href="/work/2009394/">أحلى ما طاش</a></li><li>مسلسل (2020)</li><li> <a href="#" data-key="favourite.work.2009394" class="button minimize small action-button-off" title="أضف إلى مفضلاتك" ><i class="fa fa-heart fa-1x"></i><span>مفضل</span></a > <a href="#" data-key="reminder.tvguide.6555590" class="button minimize small action-button-off" title="ذكرني" ><i class="fa fa-bell fa-1x"></i><span>ذكرني</span></a > </li></ul> </div><div class="columns small-12 large-6"> <ul class="unstyled no-margin"> <li></li><li> <ul class="list-separator"> <li><a href="/person/1104390/">عبدالله السدحان</a></li><li><a href="/person/1104389/">ناصر القصبي</a></li><li><a href="/person/1103184/">عبير عيسى</a></li><li><a href="/person/1103278/">زينب العسكري</a></li></ul> </li><li> يعيد برنامج (أحلى ما طاش) عرضا لمجموعة من أفضل الحلقات التي<a href="#" id="read-more" >...اقرأ المزيد</a ><span class="hide"> تم تقديمها من خلال المسلسل الكوميدي السعودي (طاش ما طاش)، والذي استمر عرضه على التليفزيون السعودي لمدة 18 موسمًا متواصلًا، والتي ناقش من خلالها (ناصر القصبي) و(عبدالله السدحان) مجموعة من القضايا الاجتماعية التي تشغل بال المجتمع السعودي بطريقة ساخرة.</span > </li></ul> </div></div></div></div><div class="columns small-12"> <div class="dates">الجمعة 12 نوفمبر</div></div><div class="columns small-12"> <div class="boxed-category-0 padded-half"> <div class="row"> <div class="columns small-5 large-1"> <img class="lazy-loaded" data-src="https://media.elcinema.com/blank_photos/150x200.jpg" src=""/> </div><div class="columns small-7 large-11"> <ul class="unstyled no-margin"> <li>يوميات موسم الرياض 2021</li><li> 12:00 صباحًا <span class="subheader">[15 دقيقة]</span> </li></ul> </div></div></div></div></div></div></div></body></html>`
const contentEN = `<!DOCTYPE html><html lang="en" dir="ltr"> <head></head> <body> <div class="intro-box"> <div class="row"> <div class="columns large-2"> <img src="https://media.elcinema.com/tvguide/1127_1.png" alt=""/> </div></div></div><div class="row tvgrid"> <div class="columns small-12"> <div class="dates">Thursday  11 November</div></div><div class="columns small-12"> <div class="boxed-category-16 padded-half"> <div class="row"> <div class="columns small-3 large-2"> <ul class="unstyled text-center"> <li>10:00 AM</li><li><span class="subheader">[120 minutes]</span></li></ul> </div><div class="columns small-3 large-1"> <a href="/en/work/2009399/" ><img class="lazy-loaded" data-src="https://media.elcinema.com/uploads/_150x200_5659fb4f174c49b54cc14cb53e70a5467abef429b5bb9d1a1cf2a40aa37562b2.jpg" src=""/></a> </div><div class="columns small-6 large-3"> <ul class="unstyled no-margin"> <li><a href="/en/work/2009399/">Good Morning Arab</a></li><li>Program (2006)</li><li> <a href="#" data-key="favourite.work.2009399" class="button minimize small action-button-off" title="Add to your favourites!" ><i class="fa fa-heart fa-1x"></i><span>Favourite</span></a > <a href="#" data-key="reminder.tvguide.6555650" class="button minimize small action-button-off" title="Remind me!" ><i class="fa fa-bell fa-1x"></i><span>Reminder</span></a > </li></ul> </div><div class="columns small-12 large-6"> <ul class="unstyled no-margin"> <li></li><li> <ul class="list-separator"> <li><a href="/en/person/1102191/">Hend Mohamed</a></li><li><a href="/en/person/1104553/">Abdel Aziz El Skirien</a></li><li><a href="/en/person/1102656/">Muhammad Al Hajji</a></li><li><a href="/en/person/2075739/">Turki Kreidis</a></li></ul> </li><li>As Abdel Mohsen passes away and his will is read to the<a href="#" id="read-more">...Read more</a><span class="hide"> family members, the true essence of each of them emerges, resulting in unthinkable discord. </span></li></ul> </div></div></div></div></div></body></html>`

it('can generate valid url', () => {
  expect(url({ channel: channelEN })).toBe('https://elcinema.com/en/tvguide/1127/')
})

it('can parse response (en)', () => {
  expect(parser({ date, channel: channelEN, content: contentEN })).toMatchObject([
    {
      start: '2021-11-11T07:00:00.000Z',
      stop: '2021-11-11T09:00:00.000Z',
      title: 'Good Morning Arab',
      icon: 'https://media.elcinema.com/uploads/_150x200_5659fb4f174c49b54cc14cb53e70a5467abef429b5bb9d1a1cf2a40aa37562b2.jpg',
      description: `As Abdel Mohsen passes away and his will is read to the family members, the true essence of each of them emerges, resulting in unthinkable discord. `,
      category: 'Program'
    }
  ])
})

it('can parse response (ar)', () => {
  expect(parser({ date, channel: channelAR, content: contentAR })).toMatchObject([
    {
      start: '2021-11-11T09:30:00.000Z',
      stop: '2021-11-11T10:00:00.000Z',
      title: 'أحلى ما طاش',
      icon: 'https://media.elcinema.com/uploads/_150x200_2f74473c92a69d7bfd25bd7fca8576168e8a58da4dd5cb8222eb1297caa13915.jpg',
      description: ` يعيد برنامج (أحلى ما طاش) عرضا لمجموعة من أفضل الحلقات التي تم تقديمها من خلال المسلسل الكوميدي السعودي (طاش ما طاش)، والذي استمر عرضه على التليفزيون السعودي لمدة 18 موسمًا متواصلًا، والتي ناقش من خلالها (ناصر القصبي) و(عبدالله السدحان) مجموعة من القضايا الاجتماعية التي تشغل بال المجتمع السعودي بطريقة ساخرة. `,
      category: 'مسلسل'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel: channelEN,
    content: `<!DOCTYPE html><html lang="ar" dir="rtl"><head></head><body></body></html>`
  })
  expect(result).toMatchObject([])
})
