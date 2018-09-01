// provide middleware to receive a version header from all requests and establish an API version
// to which the request is targeted

'use strict';

const APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module.js');
const ErrorHandler = require(process.env.CS_API_TOP + '/server_utils/error_handler');
const Errors = require('./errors');
const VersionInfo = require('./version_info');

const ROUTES = [
	{
		method: 'get',
		path: '/no-auth/version',
		requestClass: require('./version_request')
	}
];

class Versioner extends APIServerModule {

	constructor (options) {
		super(options);
		this.errorHandler = new ErrorHandler(Errors);
		this.versionInfo = new VersionInfo({
			api: this.api,
			data: this.api.data
		});
	}

	getRoutes () {
		return ROUTES;
	}
	
	middlewares () {
		// return a middleware function that will examine the plugin version info associated
		// with the request, and determine disposition based on our internal version information
		return async (request, response, next) => {
			try {
				await this.handleVersionCompatibility(request, response);
			}
			catch (error) {
				// can not honor the request at all, abort ASAP with 403
				request.abortWith = {
					status: this.abortWithStatusCode || 403,
					error
				};
			}
			next();
		};
	}

	// examine the request headers for plugin version information, lookup the matching
	// version information in our internal version matrix, and determine compatibility
	async handleVersionCompatibility (request, response) {
		const versionCompatibility = await this.versionInfo.handleVersionCompatibility({
			pluginIDE: request.headers['x-cs-plugin-ide'],
			pluginVersion: request.headers['x-cs-plugin-version'],
		});

		response.set('X-CS-Version-Disposition', versionCompatibility.versionDisposition);

		// if the plugin is too old, we can not honor this request at all, but let
		// the client known what URL they can download from
		if (versionCompatibility.versionDisposition === 'incompatible') {
			this.abortWithStatusCode = 400;
			response.set('X-CS-Latest-Asset-Url', versionCompatibility.latestAssetUrl);
			throw this.errorHandler.error('versionNotSupported');
		}

		// if the plugin is unknown, no further information is available
		if (
			versionCompatibility.versionDisposition === 'unknown' ||
			versionCompatibility.versionDisposition === 'unknownIDE'
		) {
			return;
		}

		// set informative headers
		response.set('X-CS-Latest-Asset-Url', versionCompatibility.latestAssetUrl);
		response.set('X-CS-Current-Version', versionCompatibility.currentVersion);
		response.set('X-CS-Supported-Version', versionCompatibility.supportedVersion);
		response.set('X-CS-Preferred-Version', versionCompatibility.preferredVersion);

		// set informative headers regarding the agent
		if (versionCompatibility.preferredAgent) {
			response.set('X-CS-Preferred-Agent', versionCompatibility.preferredAgent);
		}
		if (versionCompatibility.supportedAgent) {
			response.set('X-CS-Supported-Agent', versionCompatibility.supportedAgent);
		}
	}

	// describe any errors associated with this module, for help
	describeErrors () {
		return {
			'Versioner': Errors
		};
	}
}

module.exports = Versioner;
