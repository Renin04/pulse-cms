module.exports = {
  apps: [{
    name: 'pulse-website',
    cwd: 'C:\\Users\\z0512\\Desktop\\pulse\\apps\\website',
    script: 'node',
    args: 'C:\\Users\\z0512\\Desktop\\pulse\\node_modules\\next\\dist\\bin\\next dev --port 5000',
    env: { NODE_ENV: 'development' },
    restart_delay: 3000,
    max_restarts: 5,
  }]
};
