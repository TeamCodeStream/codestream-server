// Get version compatibility info given extension's version

'use strict';

const Indexes = require('./indexes');
const CompareVersions = require('compare-versions');

class VersionInfo {

	constructor (options) {
		Object.assign(this, options);
	}

	// given the extension's version information, lookup the matching
	// version information in our internal version matrix, and determine compatibility
	async handleVersionCompatibility (inputVersionInfo) {
		const versionCompatibility = {};
		const { pluginIDE, pluginVersion } = inputVersionInfo;
		if (!pluginIDE || !pluginVersion) {
			// if we're not given an IDE or a version, version compatibility is unknown
			versionCompatibility.versionDisposition = 'unknown';
			return versionCompatibility;
		}

		// look up the specific version info for this plugin and release
		const versionInfo = await this.data.versionMatrix.getByQuery(
			{
				clientType: pluginIDE 
			},
			{ 
				hint: Indexes.byClientType,
				fields: ['currentRelease', 'minimumPreferredRelease', 'earliestSupportedRelease', pluginVersion.replace(/\./g, '*')]
			}
		);
		if (versionInfo.length === 0) {
			// if we don't have version info for this IDE, version compatibility is still unknown
			versionCompatibility.versionDisposition = 'unknownIDE';
			return versionCompatibility;
		}

		// kind of a hack here, go from "VS Code" to "vscode", will this be a hard and fast rule?
		const ideDir = pluginIDE.replace(/ /g, '').toLowerCase();
		const assetEnv = this.api.config.api.assetEnvironment;
		versionCompatibility.latestAssetUrl = 
			`https://assets.codestream.com/${assetEnv}/${ideDir}/codestream-latest.vsix`;

		return await this.matchVersions(versionCompatibility, pluginVersion, versionInfo[0]);
	}

	// match the given plugin version information against what we have stored for the plugin in our internal matrix,
	// determine how out of date the plugin is and whether we there is compatibility at all
	async matchVersions (versionCompatibility, pluginVersion, versionInfo) {
		const { currentRelease, earliestSupportedRelease, minimumPreferredRelease } = versionInfo;
		const releaseInfo = versionInfo[pluginVersion.replace(/\./g, '*')];

		// set version compatibility info
		Object.assign(versionCompatibility, {
			currentVersion: currentRelease,
			supportedVersion: earliestSupportedRelease,
			preferredVersion: minimumPreferredRelease
		});

		// set information regarding the agent
		if (releaseInfo) {
			Object.assign(versionCompatibility, {
				preferredAgent: releaseInfo.preferredAgent,
				supportedAgent: releaseInfo.earliestSupportedAgent
			});
		}

		let disposition;
		pluginVersion = this.normalizePluginVersion(pluginVersion);
		try {
			// if the plugin is too old, we can not honor this request at all
			if (CompareVersions(pluginVersion, earliestSupportedRelease) < 0) {
				disposition = 'incompatible';
			}

			// if the plugin is behind the minimum preferred release, that means the release in
			// question is soon to be deprecated, and upgrade is strongly recommended
			else if (CompareVersions(pluginVersion, minimumPreferredRelease) < 0) {
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
		}
		catch (error) {
			this.api.warn(`Invalid version info: ${pluginVersion}`);
			disposition = 'unknownVersion';
		}

		versionCompatibility.versionDisposition = disposition;
		return versionCompatibility;
	}

	normalizePluginVersion (version) {
		const [realVersion, build] = version.split('+');
		const [nonPre, pre] = realVersion.split('-');
		const [major, minor, patch] = nonPre.split('.');
		if (!major) {
			return '';
		}
		let normalizedVersion = major;
		if (minor) {
			normalizedVersion += '.' + minor;
		}
		if (patch) {
			normalizedVersion += '.' + patch;
		}
		if (pre) {
			normalizedVersion += '-' + pre;
		}
		if (build) {
			normalizedVersion += '+' + build;
		}
		return normalizedVersion;
	}
}

module.exports = VersionInfo;
