#! /usr/bin/env node

const fs = require('fs')
const path = require('path')
const axios = require('axios')
const utils = require('./utils')
const { Command } = require('commander')
const program = new Command()
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

program
  .version('0.1.0', '-v, --version')
  .name('epg-grabber')
  .description('EPG grabber')
  .usage('[options] [file-or-url]')
  .option('-c, --config <config>', 'Path to config.xml file', './config.xml')
  .option('-s, --sites <sites>', 'Path to /sites folder', './sites')
  .parse(process.argv)

const options = program.opts()

const config = utils.parseConfig(options.config)

return console.log(config)

const sites = {
  'tv.yandex.ru': {
    url: function ({ date, channel }) {
      return `https://tv.yandex.ru/channel/${channel.site_id}?date=${date.format('YYYY-MM-DD')}`
    },
    parser: function ({ channel, content }) {
      const initialState = content.match(/window.__INITIAL_STATE__ = (.*);/i)[1]
      const data = JSON.parse(initialState, null, 2)
      const programs = data.channel.schedule.events.map(i => {
        return {
          title: i.title,
          description: i.program.description,
          start: i.start,
          stop: i.finish,
          lang: 'ru',
          channel: channel['xmltv_id']
        }
      })

      return programs
    }
  }
}

function main() {
  const d = dayjs.utc()
  const dates = Array.from({ length: config.days }, (_, i) => d.add(i, 'd'))
  const channels = config.channels
  const promises = []
  channels.forEach(channel => {
    const site = sites[channel.site]
    dates.forEach(date => {
      const url = site.url({ date, channel })
      const promise = axios.get(url).then(response => {
        return site.parser({ channel, content: response.data })
      })

      promises.push(promise)
    })
  })

  Promise.allSettled(promises).then(results => {
    let programs = []
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        programs = programs.concat(result.value)
      }
    })

    const xml = utils.convertToXMLTV({ channels, programs })
    fs.writeFileSync(path.resolve(__dirname, config.filename), xml)
  })
}

main()
