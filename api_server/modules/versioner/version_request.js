// handle "GET /no-auth/version" request to get version compatibility info for the
// given version of an extension

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request');

class VersionRequest extends RestfulRequest {
	
	async authorize () {
		// no authorization required
	}

	// process the request...
	async process () {
		await this.requireAndAllow();		// require parameters, and filter out unknown parameters
		await this.handleVersionCompatibility();	// determine version compatibility and response
	}

	// require certain parameters, and discard unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters(
			'query',
			{
				optional: {
					string: ['pluginVersion', 'pluginIDE']
				}
			}
		);
	}

	// handle version compatibility, given input version info for a specific plugin version
	async handleVersionCompatibility () {
		const versionInfo = {};
		Object.keys(this.request.query).forEach(key => {
			versionInfo[key] = decodeURIComponent(this.request.query[key]);
		});
		versionInfo.readFromDatabase = this.request.headers['x-cs-read-version-from-db'];
		this.responseData = await this.module.versionInfo.handleVersionCompatibility(versionInfo);
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'version',
			summary: 'Get version compatibility info associated with passed plugin IDE and version',
			access: 'No access rule',
			description: 'Called to determine whether the client\'s current version of the plugin for a particular IDE is still supported, and whether a newer release is available and/or whether the client\'s release is soon to be deprecated',
			input: {
				summary: 'Specify plugin IDE and version in the query parameters',
				looksLike: {
					pluginIDE: '<IDE the plugin is running on, eg. \'VS Code\', other possible values TBD>',
					pluginVersion: '<Version of the plugin the client is currently running>'
				}
			},
			returns: {
				summary: 'Object containing information about version compatibility',
				looksLike: {
					versionDisposition: '<Disposition of version compatibility, see @@#Overview#@@>',
					currentVersion: '<Latest available version of the plugin>',
					supportedVersion: '<Earliest supported version of the plugin, earlier versions are no longer supported at all>',
					preferredVersion: '<Version the client should strive to upgrade to, earlier versions are deprecated and may soon no longer be supported>',
					supportedAgent: '<Earliest supported version of the agent, earlier versions MUST upgrade>',
					preferredAgent: '<Minimum version the agent should be upgraded to, earlier versions are deprecated and may soon no longer be supported>',
					latestAssetUrl: '<URL where the latest version of the plugin for the given IDE can be found>'
				}
			}
		};
	}
}

module.exports = VersionRequest;

