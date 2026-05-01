module.exports = {
  apps: [{
    name: 'pulse-website',
    script: 'C:\\Users\\z0512\\Desktop\\pulse\\node_modules\\next\\dist\\bin\\next',
    args: 'dev',
    cwd: 'C:\\Users\\z0512\\Desktop\\pulse\\apps\\website',
    exec_mode: 'fork',
    instances: 1,
    watch: false,
    autorestart: true,
    max_restarts: 5,
    min_uptime: '10s',
    env: {
      NODE_ENV: 'development'
    }
  }]
};
