/**
 * PM2 process manager config for Hostinger VPS.
 *
 * Usage:
 *   npm run build
 *   pm2 start ecosystem.config.cjs
 *   pm2 save
 *   pm2 startup   (to auto-restart on server reboot)
 */
module.exports = {
  apps: [
    {
      name:    'mumskitchen',
      script:  '.next/standalone/server.js',
      cwd:     __dirname,
      env: {
        NODE_ENV: 'production',
        HOSTNAME:  '0.0.0.0',
        PORT:      3000,
      },
      instances:            1,
      autorestart:          true,
      watch:                false,
      max_memory_restart:   '512M',
      error_file:           './logs/error.log',
      out_file:             './logs/out.log',
      time:                 true,
      shutdown_with_message: true,
    },
  ],
};
