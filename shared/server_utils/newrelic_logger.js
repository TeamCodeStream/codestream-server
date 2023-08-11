'use strict';

require('newrelic');
const nrPino = require('@newrelic/pino-enricher')
const pino = require('pino')

class NewRelicLogger {
	constructor(){
		this.logger = pino(nrPino())
	}

	async log(text, requestId, severity, customLogProperties, json) {
		switch(severity){
			case 'CRITICAL':
				this.logger.fatal({...customLogProperties, requestId, json}, text);
				break;
			case 'ERROR':
				this.logger.error({...customLogProperties, requestId, json}, text);
				break;
			case 'WARN':
				this.logger.warn({...customLogProperties, requestId, json}, text);
				break;
			case 'DEBUG':
				this.logger.debug({...customLogProperties, requestId, json}, text);
				break;
			case 'TRACE':
				this.logger.trace({...customLogProperties, requestId, json}, text);
				break;
			case 'INFO':
			default:
				this.logger.info({...customLogProperties, requestId, json}, text);
				break;
		}

		console.log(text);
	}

	critical(text, requestId, customLogProperties) {
		this.log(text, requestId, 'CRITICAL', customLogProperties);
	}

	error(text, requestId, customLogProperties) {
		this.log(text, requestId, 'ERROR', customLogProperties);
	}

	warn(text, requestId, customLogProperties) {
		this.log(text, requestId, 'WARN', customLogProperties);
	}

	debug(text, requestId, customLogProperties) {
		if (this.debugOk) {
			this.log(text, requestId, 'DEBUG', customLogProperties);
		}
	}

	info(text, requestId, customLogProperties) {
		this.log(text, requestId, 'INFO', customLogProperties);
	}

	trace(text, requestId, customLogProperties) {
		this.log(text, requestId, 'TRACE', customLogProperties);
	}
}

module.exports = NewRelicLogger;