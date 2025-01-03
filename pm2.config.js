const grabArgs = [
  '--channels=channels.xml',
  '--output=public/guide.xml',
  process.env.MAX_CONNECTIONS ? `--maxConnections=${process.env.MAX_CONNECTIONS}` : null,
  process.env.TIMEOUT ? `--timeout=${process.env.TIMEOUT}` : null,
  process.env.DELAY ? `--delay=${process.env.DELAY}` : null,
  process.env.DAYS ? `--days=${process.env.DAYS}` : null,
  process.env.GZIP === 'true' ? '--gzip' : null
]
  .filter(Boolean)
  .join(' ')

module.exports = {
  apps: [
    {
      name: 'serve',
      script: 'npx serve -- public',
      instances: 1,
      watch: false,
      autorestart: true
    },
    {
      name: 'grab',
      script: `npm run grab -- ${grabArgs}`,
      cron_restart: process.env.CRON_SCHEDULE,
      instances: 1,
      watch: false,
      autorestart: false
    }
  ]
}
