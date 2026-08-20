// Example pm2 process definition. Adjust cwd/interpreter/uid/gid for your environment.
module.exports = {
  apps: [{
    name: 'psitransfer',
    script: 'app.js',
    cwd: __dirname,
    env: {
      PSITRANSFER_PORT: '3000',
      PSITRANSFER_IFACE: '127.0.0.1'
    }
  }]
};
