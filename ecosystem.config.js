// PM2 process configuration.
//   pm2 start ecosystem.config.js
//
// Single instance for now: the app uses an in-memory session store, so running
// multiple processes would split sessions and break logins. Switch to a shared
// store (SQL Server/Redis) before raising `instances` or using cluster mode.
module.exports = {
  apps: [
    {
      name: 'nodewmove',
      script: 'src/server.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '500M',
      env: { NODE_ENV: 'development' },
      env_production: { NODE_ENV: 'production' },
    },
  ],
};
