
'use strict';

const StructuredConfigFile = require('./structured_config_file');
const StructuredConfigMongo = require('./structured_config_mongo');

class StructuredConfigFactory {
	create(options={}) {
		if (options.configFile) {
			return new StructuredConfigFile(options);
		}
		else if(options.mongoUrl) {
			if (options.mongoUrl.startsWith('mongodb://')) {
				return new StructuredConfigMongo(options);
			}
			else if (options.mongoUrl.startsWith('file://')) {
				return new StructuredConfigFile(options);
			}
			else {
				console.error(`Unknown config type for ${options.mongoUrl}. Should start with mongodb:// or file://`);
			}
		}
		else {
			console.error('No config specified');
		}
	}
}

module.exports = new StructuredConfigFactory();
