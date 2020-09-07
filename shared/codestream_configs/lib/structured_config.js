
'use strict';

const StructuredConfigFile = require('./structured_config_file');
const StructuredConfigMongo = require('./structured_config_mongo');

class StructuredConfigFactory {
	create(options) {
		if (options.configFile) {
			return new StructuredConfigMongo(options);
		}
		else if (options.mongoUrl) {
			return new StructuredConfigFile(options);
		}
		else {
			console.error("StructuredConfigFactory(): missing config reference option. 'configFile' or 'mongoUrl' option required");
		}
	}
}

module.exports = new StructuredConfigFactory();
