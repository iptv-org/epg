const CRON = process.env.CRON_SCHEDULE || '0 4 * * *'

const regions = [
  { name: 'th', channels: 'channels-th.xml', output: 'th/guide.xml' },
  { name: 'no', channels: 'channels-no.xml', output: 'no/guide.xml' },
  { name: 'uk', channels: 'channels-uk.xml', output: 'uk/guide.xml' },
  { name: 'int', channels: 'channels-int.xml', output: 'int/guide.xml' }
]

const apps = [
  {
    name: 'serve',
    script: 'npx serve -- public',
    instances: 1,
    watch: false,
    autorestart: true
  },
  ...regions.map(({ name, channels, output }) => ({
    name: `grab-${name}`,
    script: `npx chronos -e "npm run grab -- --channels=public/${channels} --output=public/${output}" -p "${CRON}" -l`,
    instances: 1,
    watch: false,
    autorestart: true
  }))
]

if (process.env.RUN_AT_STARTUP === 'true') {
  regions.forEach(({ name, channels, output }) => {
    apps.push({
      name: `grab-at-startup-${name}`,
      script: `npm run grab -- --channels=public/${channels} --output=public/${output}`,
      instances: 1,
      autorestart: false,
      watch: false,
      max_restarts: 1
    })
  })
}

module.exports = { apps }
