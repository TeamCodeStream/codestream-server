
'use strict';

const StructuredConfigFile = require('./structured_config_file');
const StructuredConfigMongo = require('./structured_config_mongo');

class StructuredConfigFactory {
	create(options) {
		if (options.mongoUrl) {
			return new StructuredConfigMongo(options);
		}
		else {
			return new StructuredConfigFile(options);
		}
	}
}

module.exports = new StructuredConfigFactory();
