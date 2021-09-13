const jsdom = require('jsdom')
const { JSDOM } = jsdom
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)
dayjs.extend(timezone)
dayjs.extend(utc)

module.exports = {
  lang: 'ar',
  site: 'elcinema.com',
  channels: 'elcinema.com.channels.xml',
  output: '.gh-pages/guides/elcinema.com.guide.xml',
  url({ channel }) {
    return `https://elcinema.com/tvguide/${channel.site_id}/`
  },
  logo({ content }) {
    const dom = new JSDOM(content)
    const img = dom.window.document.querySelector('.intro-box > .row > div.columns.large-2 > img')

    return img.src || null
  },
  parser({ content, date }) {
    const programs = []

    const items = parseItems(content, date)
    items.forEach(item => {
      const title = parseTitle(item)
      const description = parseDescription(item)
      const category = parseCategory(item)
      const icon = parseIcon(item)
      const start = parseStart(item, date)
      const duration = parseDuration(item)
      const stop = start.add(duration, 'm')

      programs.push({
        title,
        description,
        category,
        icon,
        start,
        stop
      })
    })

    return programs
  }
}

function parseIcon(item) {
  const img =
    item.querySelector('.row > div.columns.small-3.large-1 > a > img') ||
    item.querySelector('.row > div.columns.small-5.large-1 > img')

  return img.dataset.src || null
}

function parseCategory(item) {
  const category = (
    item.querySelector('.row > div.columns.small-6.large-3 > ul > li:nth-child(2)') || {
      textContent: ''
    }
  ).textContent

  return category.replace(/\(\d+\)/, '').trim()
}

function parseDuration(item) {
  const duration = (
    item.querySelector('.row > div.columns.small-3.large-2 > ul > li:nth-child(2) > span') ||
    item.querySelector('.row > div.columns.small-7.large-11 > ul > li:nth-child(2) > span') || {
      textContent: ''
    }
  ).textContent

  return duration.replace(/\D/g, '')
}

function parseStart(item, initDate) {
  let time = (
    item.querySelector('.row > div.columns.small-3.large-2 > ul > li:nth-child(1)') ||
    item.querySelector('.row > div.columns.small-7.large-11 > ul > li:nth-child(2)') || {
      textContent: ''
    }
  ).textContent

  time = time
    .replace(/\[.*\]/, '')
    .replace('مساءً', 'PM')
    .replace('صباحًا', 'AM')
    .trim()

  time = `${initDate.format('DD/MM/YYYY')} ${time}`

  return dayjs.tz(time, 'DD/MM/YYYY H:mm A', 'Africa/Algiers')
}

function parseTitle(item) {
  return (
    item.querySelector('.row > div.columns.small-6.large-3 > ul > li:nth-child(1) > a') ||
    item.querySelector('.row > div.columns.small-7.large-11 > ul > li:nth-child(1)') || {
      textContent: ''
    }
  ).textContent
}

function parseDescription(item) {
  const excerpt = (
    item.querySelector('.row > div.columns.small-12.large-6 > ul > li:nth-child(3)') || {
      textContent: ''
    }
  ).textContent
  const desc = (
    item.querySelector('.row > div.columns.small-12.large-6 > ul > li:nth-child(3) > .hide') || {
      textContent: ''
    }
  ).textContent

  return excerpt.replace('...اقرأ المزيد', '') + desc
}

function parseItems(content, date) {
  const dom = new JSDOM(content)
  const diff = date.diff(dayjs().startOf('d'), 'd')
  const listNum = (diff + 1) * 2

  return dom.window.document.querySelectorAll(`.tvgrid > div:nth-child(${listNum}) > .padded-half`)
}
