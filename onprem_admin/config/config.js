
'use strict';

import StructuredConfigFactory from '../../shared/codestream_configs/lib/structured_config';
import customConfigFunc from '../../shared/server_utils/custom_config';

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

module.exports = StructuredConfigFactory.create({
	configFile: process.env.OPADM_CFG_FILE || process.env.CSSVC_CFG_FILE,
	mongoUrl: process.env.CSSVC_CFG_URL,
	showConfigProperty: 'adminServer.showConfig',
	// customRestartFunc,
	customConfigFunc
});
