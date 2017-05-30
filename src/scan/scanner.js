import {FieldType, InfluxDB} from 'influx';
import Promise from 'bluebird';
import log from '../utils/log';
import tempScanner from './temp';

export default class Scanner {
  static scanners = {
    temp: tempScanner
  };

  constructor(config) {
    this.config = config;
    this.init();
  }

  init() {
    this.sensors = [];
    this.config.sensors.forEach((sensor) => {
      if (Scanner.scanners[sensor.type]) {
        const Sensor = Scanner.scanners[sensor.type];
        this.sensors.push(new Sensor({
          host: this.config.ownServer.host,
          port: this.config.ownServer.port,
          ownId: sensor.id,
          name: sensor.name
        }));
      } else {
        log.error('Unknow sensor type %s', sensor.type);
      }
    });
    this.influx = new InfluxDB({
      username: this.config.influxdb.username,
      password: this.config.influxdb.password,
      host: this.config.influxdb.host,
      port: 80,
      database: this.config.influxdb.database,
      schema: [
        {
          measurement: 'ownTemp',
          fields: {
            value: FieldType.FLOAT
          },
          tags: Object.keys(this.config.influxdb.tags).concat(['room'])
        }
      ]
    });
  }

  start() {
    this.scan();
    this.interval = setInterval(() => {
      this.scan();
    }, this.config.scanFrequency);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.interval = null;
  }

  scan() {
    log.info('One scan');
    Promise.map(this.sensors, sensor =>
      new Promise((resolve, reject) => {
        sensor.call((err, res) => {
          if (err) return reject(err);
          return resolve({name: sensor.name, value: res});
        });
      })
    )
    .map((item) => ({
      measurement: 'ownTemp',
      tags: {...this.config.influxdb.tags, room: item.name},
      fields: {
        value: item.value
      }
    }))
    .then(measurements =>
      this.influx.writePoints(measurements)
        .then(() => {
          log.info('%d points written', measurements.length);
        })
    )
    .catch((err) => {
      log.error(err);
    });
    // this.sensors.forEach((sensor) => {
    //   sensor.call((err, res) => {
    //
    //   });
    // });
  }
}
