const APICapabilities = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/etc/capabilities');

module.exports = async options => {

	const capabilities = { ...APICapabilities };
	const config = options.config || (options.request && options.request.api.config);
	const request = options.request;

	// remove capability for outbound email support if suppressEmails is set in configuration
	if (config.email.suppressEmails) {
		delete capabilities.emailSupport;
	}
		
	const { isOnPrem } = config.sharedGeneral;
	for (let key in capabilities) {
		const capability = capabilities[key];

		// remove capabilities that are for cloud only
		if (isOnPrem && capability.cloudOnly) {
			delete capabilities[key];
		}
		
		// remove capabilities that aare turned on by a global variable 
		if (capability.useGlobal) {
			const global = request && await request.api.data.globals.getOneByQuery(
				{ tag: key }, 
				{ overrideHintRequired: true }
			);
			if (!global || !global.enabled) {
				delete capabilities[key];
			}
		}
	}

	return capabilities;
};