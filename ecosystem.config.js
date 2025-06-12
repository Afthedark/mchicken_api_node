module.exports = {
  apps: [{
    name: "mchicken-api",
    script: "./server.js",
    watch: false,
    env: {
      "NODE_ENV": "development",
      "PORT": 3000
    },
    env_production: {
      "NODE_ENV": "production",
      "PORT": 3000
    },
    instances: 1,
    exec_mode: "fork",
    autorestart: true,
    max_memory_restart: "1G",
    log_date_format: "YYYY-MM-DD HH:mm:ss",
    out_file: "./logs/app.log",
    error_file: "./logs/error.log",
    ignore_watch: ["node_modules", "logs"],
    max_restarts: 10,
    restart_delay: 4000
  }]
}
