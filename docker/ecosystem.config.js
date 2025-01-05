// Docker startup configuration

// first add the server app
let apps = [{
        name: "serve",
        script: "npm run serve",
    }
]

// if we run in cron-mode then add 2 jobs
if (process.env.CRON) {
    // run an initial grab at startup
    apps.push({
        name: "grab-startup",
        script: "npm run grab",
        autorestart: false,
        filter_env: ["CRON"],
    })
    // run a grab according to the cron schedule and let pm2 restart if it fails
    apps.push({
        name: "grab-cron",
        script: "npm run grab",
    })
} else {
    // one time run only
    apps.push({
        name: "grab",
        script: "npm run grab",
        autorestart: false,
    })
}

module.exports = { apps }
