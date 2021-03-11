#! /usr/bin/env node

const fs = require('fs')
const path = require('path')
const axios = require('axios')
const axiosDelayAdapter = require('axios-delay').default
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
const sites = utils.loadSites(options.sites)

const client = axios.create({
  adapter: axiosDelayAdapter(axios.defaults.adapter),
  headers: { 'User-Agent': config.userAgent }
})

async function main() {
  const d = dayjs.utc()
  const dates = Array.from({ length: config.days }, (_, i) => d.add(i, 'd'))
  const channels = config.channels
  const requests = []
  channels.forEach(channel => {
    const site = sites[channel.site]
    dates.forEach(date => {
      requests.push({
        url: site.url({ date, channel }),
        date,
        channel
      })
    })
  })

  let programs = []
  for (let request of requests) {
    const progs = await client
      .get(request.url)
      .then(response => {
        const channel = request.channel
        const site = sites[channel.site]
        console.log(`${channel.site} - ${channel.xmltv_id}`)

        return site.parser({
          channel,
          content: response.data,
          date: request.date
        })
      })
      .then(utils.sleep(3000))
      .catch(console.log)

    programs = programs.concat(progs)
  }

  const xml = utils.convertToXMLTV({ channels, programs })
  fs.writeFileSync(path.resolve(__dirname, config.filename), xml)
}

main()
