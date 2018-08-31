// provide middleware to receive a version header from all requests and establish an API version
// to which the request is targeted

'use strict';

const APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module.js');
const ErrorHandler = require(process.env.CS_API_TOP + '/server_utils/error_handler');
const Errors = require('./errors');
const Indexes = require('./indexes');
const CompareVersions = require('compare-versions');

class Versioner extends APIServerModule {

	constructor (options) {
		super(options);
		this.errorHandler = new ErrorHandler(Errors);
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
		const pluginIDE = request.headers['x-cs-plugin-ide'];
		const pluginVersion = request.headers['x-cs-plugin-version'];
		if (!pluginIDE || !pluginVersion) {
			// if we're not given an IDE or a version, we'll honor the request,
			// but we make no guarantees!
			response.set('X-CS-Version-Disposition', 'unknown');
			return;
		}

		// look up the specific version info for this plugin and release
		const versionInfo = await this.api.data.versionMatrix.getByQuery(
			{
				clientType: pluginIDE 
			},
			{ 
				hint: Indexes.byClientType,
				fields: ['currentRelease', 'minimumPreferredRelease', 'earliestSupportedRelease', pluginVersion.replace(/\./g, '*')]
			}
		);
		if (versionInfo.length === 0) {
			// if we don't have version info for this IDE, we'll also honor the request,
			// but again, we make no guarantees
			response.set('X-CS-Version-Disposition', 'unknownIDE');
			return;
		}

		// kind of a hack here, go from "VS Code" to "vscode", will this be a hard and fast rule?
		const ideDir = pluginIDE.replace(/ /g, '').toLowerCase();
		const assetEnv = this.api.config.api.assetEnvironment;
		response.set('X-CS-Latest-Asset-Url', 
			`https://assets.codestream.com/${assetEnv}/${ideDir}/codestream-latest.vsix`);

		return await this.matchVersions(response, pluginVersion, versionInfo[0]);
	}

	// match the plugin version information given with the request against that we have stored
	// for the plugin in our internal matrix, determine how out of date the plugin is and
	// whether we can honor the request at all
	async matchVersions (response, pluginVersion, versionInfo) {
		const { currentRelease, earliestSupportedRelease, minimumPreferredRelease } = versionInfo;
		const releaseInfo = versionInfo[pluginVersion.replace(/\./g, '*')];

		// if the plugin is too old, we can not honor this request at all
		if (CompareVersions(pluginVersion, earliestSupportedRelease) < 0) {
			response.set('X-CS-Version-Disposition', 'incompatible');
			this.abortWithStatusCode = 400;
			throw this.errorHandler.error('versionNotSupported');
		}

		// set informative headers
		response.set('X-CS-Current-Version', currentRelease);
		response.set('X-CS-Supported-Version', earliestSupportedRelease);
		response.set('X-CS-Preferred-Version', minimumPreferredRelease);

		// set informative headers regarding the agent
		if (releaseInfo) {
			response.set('X-CS-Preferred-Agent', releaseInfo.preferredAgent);
			response.set('X-CS-Supported-Agent', releaseInfo.earliestSupportedAgent);
		}
		let disposition;

		// if the plugin is behind the minimum preferred release, that means the release in
		// question is soon to be deprecated, and upgrade is strongly recommended
		if (CompareVersions(pluginVersion, minimumPreferredRelease) < 0) {
			disposition = 'deprecated';
		}

		// if the plugin is behind the current release, all is ok, but upgrade is 
		// still recommended at some point
		else if (CompareVersions(pluginVersion, currentRelease) < 0) {
			disposition = 'outdated';
		}

		// all is ok, unless we didn't recognize the plugin version
		else if (releaseInfo) {
			disposition = 'ok';
		}

		// didn't recognize the plugin version, but otherwise all is ok
		else {
			disposition = 'unknownVersion';
		}

		response.set('X-CS-Version-Disposition', disposition);
	}

	// describe any errors associated with this module, for help
	describeErrors () {
		return {
			'Versioner': Errors
		};
	}
}

module.exports = Versioner;
