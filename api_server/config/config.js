// api configuration

'use strict';

const Fs = require("fs");
const StructuredConfigFactory = require(process.env.CSSVC_BACKEND_ROOT + '/shared/codestream_configs/lib/structured_config');
const customConfigFunc = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/custom_config');

// The restartRequired() method is meant to compare two configurations (prior &
// current) in order to determine if a 'restart' (defined by the application) is
// required.
//
// These two configuration params refer to the customzed configs if a
// customConfig option is used, otherwise they refer to the native configs.
//
// The return value can be any type and will be passed back to the caller of the
// restartRequired() method (usually it's boolean, but it doesn't have to be).
//
// function customRestartFunc(priorConfig, currentConfig) {
// }

var Config;

if (!Config) {
	// pre-set config variables in the process environment
	const EnvDataFile = `${process.env.CSSVC_BACKEND_ROOT}/api_server/config/${process.env.CSSVC_ENV}.json`;
	if (Fs.existsSync(EnvDataFile)) {
		for (const [key, value] of Object.entries(JSON.parse(Fs.readFileSync(EnvDataFile, 'UTF-8')))) {
			if (!process.env[key]) {
				process.env[key] = value;
			}
		}
		process.env['CS_API_SANDBOX'] = process.env.CSSVC_BACKEND_ROOT;
		process.env['CS_API_LOGS'] = `${process.env.CSSVC_BACKEND_ROOT}/log`;
	}
}

Config = Config || StructuredConfigFactory.create({
	configFile: process.env.CS_API_CFG_FILE || process.env.CSSVC_CFG_FILE,
	mongoUrl: process.env.CSSVC_CFG_URL,
	mongoTlsCAFile: process.env.CSSVC_MONGO_CLIENT_CERT_FILE,
	showConfigProperty: 'apiServer.showConfig',
	// customRestartFunc,
	customConfigFunc
});

module.exports = Config;
