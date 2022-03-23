// handle "GET /no-auth/capabilities" request to get capability info for this API server

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request');
const DetermineCapabilities = require('./determine_capabilities');

class CapabilitiesRequest extends RestfulRequest {
	
	async authorize () {
		// no authorization required
	}

	// process the request...
	async process () {
		// return the capabilities
		const {
			isOnPrem,
			isProductionCloud,
			newRelicLandingServiceUrl,
			newRelicApiUrl
		} = this.api.config.sharedGeneral;
		const environmentGroup = this.api.config.environmentGroup || {};


		// substitute the "short name" of this environment host, if found
		let runTimeEnvironment = this.api.config.sharedGeneral.runTimeEnvironment;
		if (environmentGroup && environmentGroup[runTimeEnvironment]) {
			runTimeEnvironment = environmentGroup[runTimeEnvironment].shortName;
		}

		// determine this API server's capabilities
		const capabilities = await DetermineCapabilities({ request: this });
		this.responseData = {
			capabilities,
			environment: runTimeEnvironment,
			environmentHosts: Object.values(environmentGroup),
			isOnPrem: isOnPrem,
			isProductionCloud: isProductionCloud,
			newRelicLandingServiceUrl: newRelicLandingServiceUrl,
			newRelicApiUrl: newRelicApiUrl
		};
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'capabilities',
			summary: 'Get array of capabilities served by this API server',
			access: 'No access rule',
			description: 'Capabilities are a hash with the names of the capabilities as keys, with meaning to the extensions; extensions can use this call to get the capabilities of a given instance of the API server so it can know what features to offer',
			returns: {
				summary: 'Returns a hash indicating the API server capabilities, generally the hash values contain: description, url, version',
				looksLike: {
					capabilities: '<capabilities>'
				}
			}
		};
	}
}

module.exports = CapabilitiesRequest;

