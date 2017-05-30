import config from './config';
import log from './utils/log';
import Scanner from './scan/scanner';

log.info('Started');

const scanner = new Scanner(config);
scanner.start();
