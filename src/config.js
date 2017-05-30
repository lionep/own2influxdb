import path from 'path';
import fs from 'fs';

const {env} = process;

let configFile;
try {
  const configFileBuf = fs.readFileSync(path.resolve(__dirname, '..', 'config.json'));
  configFile = JSON.parse(configFileBuf);
} catch (e) {
  configFile = {};
}

const config = {
  scanFrequency: 30000,
  appName: 'own2influxdb',
  logs: {
    path: env.NODE_LOGFILE ? path.resolve(__dirname, '..', 'logs', 'server.log') : null
  },
  ...configFile
};

export default config;
