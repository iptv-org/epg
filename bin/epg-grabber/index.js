#! /usr/bin/env node

const fs = require('fs')
const path = require('path')
const axios = require('axios')
const axiosCookieJarSupport = require('axios-cookiejar-support').default
const tough = require('tough-cookie')
const utils = require('./utils')
const { Command } = require('commander')
const program = new Command()
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.tz.setDefault('UTC')

axiosCookieJarSupport(axios)

const cookieJar = new tough.CookieJar()

program
  .version('0.1.0', '-v, --version')
  .name('epg-grabber')
  .description('EPG grabber')
  .usage('[options] [file-or-url]')
  .option('-c, --config <config>', 'Path to [site].config.xml file', './')
  .option('-s, --sites <sites>', 'Path to sites folder', './sites')
  .parse(process.argv)

const options = program.opts()

const config = utils.parseConfig(options.config)
const sites = utils.loadSites(options.sites)

const client = axios.create({
  headers: { 'User-Agent': config.userAgent, Cookie: config.cookie },
  withCredentials: true,
  jar: cookieJar
})

async function main() {
  console.log('\r\nStarting...')
  console.log(`Loading '${options.config}'...`)
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

  console.log('Parsing:')
  let programs = []
  for (let request of requests) {
    const progs = await client
      .get(request.url)
      .then(response => {
        const channel = request.channel
        const site = sites[channel.site]
        const date = request.date

        const programs = site
          .parser({
            channel,
            content: response.data,
            date
          })
          .filter(p => p)

        console.log(
          `  ${channel.site} - ${channel.xmltv_id} - ${date.format('MMM D, YYYY')} (${
            programs.length
          } programs)`
        )

        return programs
      })
      .then(utils.sleep(3000))
      .catch(console.log)

    programs = programs.concat(progs)
  }

  const xml = utils.convertToXMLTV({ config, channels, programs })
  utils.createDir(path.dirname(config.filename))
  utils.writeToFile(config.filename, xml)
  console.log(`File '${config.filename}' successfully updated`)
  console.log('Finish\r\n')
}

main()
