// provide middleware to receive a version header from all requests and establish an API version
// to which the request is targeted

'use strict';

const APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module.js');
const ErrorHandler = require(process.env.CS_API_TOP + '/server_utils/error_handler');
const Errors = require('./errors');
const Indexes = require('./indexes');

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
					status: 403,
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

		return await this.matchVersions(response, pluginVersion, versionInfo[0]);
	}

	// match the plugin version information given with the request against that we have stored
	// for the plugin in our internal matrix, determine how out of date the plugin is and
	// whether we can honor the request at all
	async matchVersions (response, pluginVersion, versionInfo) {
		// set informative headers
		response.set('X-CS-Current-Version', versionInfo.currentRelease);
		response.set('X-CS-Supported-Version', versionInfo.earliestSupportedRelease);
		response.set('X-CS-Preferred-Version', versionInfo.minimumPreferredRelease);

		// parse and extract version info
		const currentRelease = this.parseVersion(versionInfo.currentRelease);
		const earliestSupportedRelease = this.parseVersion(versionInfo.earliestSupportedRelease);
		const minimumPreferredRelease = this.parseVersion(versionInfo.minimumPreferredRelease);
		const pluginRelease = this.parseVersion(pluginVersion);
		const releaseInfo = versionInfo[pluginVersion.replace(/\./g, '*')];

		// set informative headers regarding the agent
		if (releaseInfo) {
			response.set('X-CS-Preferred-Agent', releaseInfo.preferredAgent);
			response.set('X-CS-Supported-Agent', releaseInfo.earliestSupportedAgent);
		}
		let disposition;

		// if the plugin is too old, we can not honor this request at all
		if (this.compareVersions(pluginRelease, earliestSupportedRelease) < 0) {
			response.set('X-CS-Version-Disposition', 'incompatible');
			throw this.errorHandler.error('versionNotSupported');
		}

		// if the plugin is behind the minimum preferred release, that means the release in
		// question is soon to be deprecated, and upgrade is strongly recommended
		else if (this.compareVersions(pluginRelease, minimumPreferredRelease) < 0) {
			disposition = 'deprecated';
		}

		// if the plugin is behind the current release, all is ok, but upgrade is 
		// still recommended at some point
		else if (this.compareVersions(pluginRelease, currentRelease) < 0) {
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

	// parse a version string into a version object which can be compared
	parseVersion (versionString) {
		if (versionString.startsWith('v')) {
			versionString = versionString.substring(1);
		}
		const [version, pre] = versionString.split('-');
		const [major, minor, patch] = version.split('.');
		return {
            major: typeof major === 'string' ? parseInt(major, 10) : major,
            minor: typeof minor === 'string' ? parseInt(minor, 10) : minor,
            patch: typeof patch === 'string' ? parseInt(patch, 10) : patch,
            pre: pre
        };
	}

	// compare two version structures, return -1, 0, 1
	compareVersions (v1, v2) {
        if (v1.major > v2.major) return 1;
        if (v1.major < v2.major) return -1;

		if (v1.minor > v2.minor) return 1;
        if (v1.minor < v2.minor) return -1;

        if (v1.patch > v2.patch) return 1;
        if (v1.patch < v2.patch) return -1;

        if (v1.pre === undefined && v2.pre !== undefined) return 1;
        if (v1.pre !== undefined && v2.pre === undefined) return -1;

        if (v1.pre !== undefined && v2.pre !== undefined) return v1.pre.localeCompare(v2.pre);

        return 0;
	}

	// describe any errors associated with this module, for help
	describeErrors () {
		return {
			'Versioner': Errors
		};
	}
}

module.exports = Versioner;
