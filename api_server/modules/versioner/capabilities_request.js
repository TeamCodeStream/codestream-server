// handle "GET /no-auth/capabilities" request to get capability info for this API server

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request');
const APICapabilities = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/etc/capabilities');

class CapabilitiesRequest extends RestfulRequest {
	
	async authorize () {
		// no authorization required
	}

	// process the request...
	async process () {
		// return the capabilities
		this.responseData = {
			capabilities: { ...APICapabilities }
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

