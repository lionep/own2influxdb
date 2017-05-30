import bunyan from 'bunyan';
import config from '../config';

const streams = [{stream: process.stdout}];

if (config.logs.path) {
  streams.push({
    path: config.logs.path,
    type: 'rotating-file',
    period: '1w',
    count: 7
  });
}

const log = bunyan.createLogger({
  name: config.appName,
  streams
});

export default log;
