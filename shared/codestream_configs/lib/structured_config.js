
'use strict';

const StructuredConfigFile = require('./structured_config_file');
const StructuredConfigMongo = require('./structured_config_mongo');

class StructuredConfigFactory {
	create(options={}) {
		if (options.configFile) {
			return new StructuredConfigFile(options);
		}
		else if(options.mongoUrl) {
			return new StructuredConfigMongo(options);
		}
		else {
			console.error('you need a config reference (configFile or mongoUrl) to get a config from the factory')
		}
	}
}

module.exports = new StructuredConfigFactory();
