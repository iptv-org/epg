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
      script: `npm run grab -- --channels=channels.xml --output=public/guide.xml`,
      cron_restart: process.env.CRON || null,
      instances: 1,
      watch: false,
      autorestart: false
    }
  ]
}
