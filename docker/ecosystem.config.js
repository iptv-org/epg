// Docker startup configuration

let apps = []

// if we run in cron-mode then start serve and cron
if (process.env.CRON) {
    apps = [{
        name: "serve",
        script: "npm run serve",
    },{
        // run an initial grab at startup
        name: "grab-startup",
        script: "npm run grab",
        autorestart: false,
        filter_env: ["CRON"],
    },{
        // run a grab according to the cron schedule and let pm2 restart if it fails
        name: "grab-cron",
        script: "npm run grab",
    }]
} else {
    // one time run only
    apps = [{
        name: "grab",
        script: "npm run grab",
        autorestart: false,
    }]
}

module.exports = { apps }
