// provide middleware to receive a version header from all requests and establish an API version
// to which the request is targeted

'use strict';

const APIServerModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/api_server/api_server_module.js');
const ErrorHandler = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/error_handler');
const Errors = require('./errors');
const VersionInfo = require('./version_info');
const ReadPackageJson = require('read-package-json');
const FS = require('fs');
const { awaitParallel } = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/await_utils');

const ROUTES = [
	{
		method: 'get',
		path: '/no-auth/version',
		requestClass: require('./version_request')
	},
	{
		method: 'put',
		path: '/no-auth/--put-mock-version',
		func: 'handleMockVersion'
	},
	{
		method: 'get',
		path: '/no-auth/capabilities',
		requestClass: require('./capabilities_request')
	},
	{
		method: 'get',
		path: '/no-auth/asset-info',
		requestClass: require('./asset_info')
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

			// for users in "maintenance mode", set header and return error
			if (request.user && request.user.get('inMaintenanceMode')) {
				response.set('X-CS-API-Maintenance-Mode', 1);
				request.abortWith = {
					status: 403,
					error: this.errorHandler.error('inMaintenanceMode') 
				};
			}

			// for users for whom a password set is required, set header and return error
			if (
				request.user && 
				request.user.get('mustSetPassword') && 
				(
					request.path !== '/password' ||
					request.method !== 'put'
				)
			) {
				response.set('X-CS-API-Must-Set-Password', 1);
				request.abortWith = {
					status: 403,
					error: this.errorHandler.error('mustSetPassword')
				};
			}
			
			next();
		};
	}

	// examine the request headers for plugin version information, lookup the matching
	// version information in our internal version matrix, and determine compatibility
	async handleVersionCompatibility (request, response) {

		// this is just the API server version, which we return to the client
		response.set('X-CS-API-Version', this.apiVersion);

		// determine version disposition, based on version information passed from the extension
		const versionCompatibility = await this.versionInfo.handleVersionCompatibility({
			pluginIDE: request.headers['x-cs-plugin-ide'],
			// available, but not required
			// pluginIDEDetail: request.headers['x-cs-plugin-ide-detail'],
			pluginVersion: request.headers['x-cs-plugin-version'],
			// FIXME: env based logic should be moved to custom_config.js and prod-only execution should be eliminated
			readFromDatabase: !this.api.config.sharedGeneral.isProductionCloud && request.headers['x-cs-read-version-from-db']
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

	// handle setting a mock version in the compatibility matrix, for testing
	handleMockVersion (request, response) {
		// FIXME: env based logic should be moved to custom_config.js and prod-only execution should be eliminated
		if (!this.api.config.sharedGeneral.isProductionCloud) {
			this.api.data.versionMatrix.create(request.body);
			response.send({});
		}
		else {
			response.status(401).send('MOCK VERSION NOT SUPPORTED IN PRODUCTION');
		}
	}

	// initialize this module
	async initialize () {
		if (!this.api.config.sharedGeneral.isProductionCloud) {
			const apiTestVersion = await this.api.data.versionMatrix.getOneByQuery(
				{ apiTestVersion: { $exists: true } },
				{ overrideHintRequired: true }
			);
			if (apiTestVersion && apiTestVersion.apiTestVersion) {
				this.apiVersion = apiTestVersion.apiTestVersion;
				this.api.log('Test API Version is ' + this.apiVersion);
				return;
			}
		}

		return awaitParallel([
			// read our package.json and extract the API server version,
			// which we'll return to the client on every request
			this.getApiServerVersion,

			// read the version matrix, informing the client what version they 
			// need to be at to be compatible with this API server
			this.readVersionMatrix
		], this);
	}

	// read package.json for api server version
	getApiServerVersion () {
		return new Promise((resolve, reject) => {
			ReadPackageJson(
				process.env.CSSVC_BACKEND_ROOT + '/api_server/package.json',
				(error, data) => {
					if (error) { reject(error); }
					this.apiVersion = data.version;
					this.api.log('API Version is ' + this.apiVersion);
					resolve();
				}
			);
		});
	}

	// read the version matrix from etc directory
	readVersionMatrix () {
		return new Promise((resolve, reject) => {
			try {
				FS.readFile(
					process.env.CSSVC_BACKEND_ROOT + '/api_server/etc/version_matrix.json',
					'utf8',
					(error, data) => {
						if (error) throw error;
						const versionMatrix = JSON.parse(data);
						this.versionInfo.setVersionMatrix(versionMatrix);
						resolve();
					}
				);
			}
			catch (error) {
				const message = error instanceof Error ? error.message : JSON.stringify(error);
				reject(`unable to read version matrix: ${message}`);
			}
		});
	}

	// describe any errors associated with this module, for help
	describeErrors () {
		return {
			'Versioner': Errors
		};
	}
}

module.exports = Versioner;
