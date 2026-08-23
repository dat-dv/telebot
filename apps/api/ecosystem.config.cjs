module.exports = {
  apps: [
    {
      name: 'nestjs-telegram-assistant',
      script: 'dist/main.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
