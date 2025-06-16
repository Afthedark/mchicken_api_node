module.exports = {
  apps: [{
    name: "mchicken-api",
    script: "./server.js",
    watch: true,
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
    out_file: "./logs/app-1.log",
    error_file: "./logs/error-1.log",
    merge_logs: true,
    watch: [
      "server.js",
      "controllers",
      "routes",
      "public"
    ],
    ignore_watch: [
      "node_modules",
      "logs",
      ".git",
      "*.log"
    ],
    watch_options: {
      "followSymlinks": false,
      "usePolling": true
    },
    max_restarts: 10,
    restart_delay: 4000
  }]
}
