import net from 'net';
import {chain} from 'lodash';

export default class TempScanner {
  static ACK = '*#*1##';
  static NACK = '*#*0##';

  static MSG_SEP = '##';

  constructor({host, port = 20000, ownId, name}) {
    this.host = host;
    this.port = port;
    this.ownId = ownId;
    this.name = name;
  }

  static readResponse(res) {
    if (res === TempScanner.ACK) {
      return {ack: true};
    } else if (res === TempScanner.NACK) {
      return {ack: false};
    }
    return {msg: res};
  }

  call(callback) {
    const socket = new net.Socket();
    const reTemp = /^\*#4\*([0-9]+)\*0\*([0-9]+)##$/i;
    let responses = [];

    socket.connect({
      port: this.port,
      host: this.host
    }, () => {
      // socket.write();
      socket.end(`*#4*${this.ownId}*0##`);
    });

    socket.on('end', () => {
      let hasError = false;
      const returnedResponses = [];
      responses.forEach((response, index) => {
        const res = TempScanner.readResponse(response);
        if (index === 0 && res.ack) return;
        if (res.ack === false) {
          hasError = true;
          return;
        }
        if (res.msg) {
          returnedResponses.push(res.msg);
        }
      });

      let result = null;

      if (returnedResponses.length > 0) {
        if (reTemp.test(returnedResponses[0])) {
          result = parseInt(returnedResponses[0].match(reTemp)[2], 10) / 10;
        }
      }

      callback(hasError ? new Error('NACK') : null, result);
    });

    socket.on('data', (buf) => {
      responses = responses.concat(chain(buf.toString().split(TempScanner.MSG_SEP))
        .filter((res) => res !== '')
        .map((res) =>
          `${res}${TempScanner.MSG_SEP}`
        ).value());
    });
  }
}
