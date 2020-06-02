
'use strict';

// Load OnPrem support data

// this function is hard-coded to match the only onprem installation type we
// have today (Single Linux Host) but it will need to change to accomodate
// other installation types in the future.
//
// Configuration values used here (such as onPremInstallationDirectory) should
// exist _outside_ the CodeStream configuration as they're specific to network
// resources upon which CodeStream is deployed (docker on one host, docker in
// the cloud, kubernetes, etc...).

const fs = require('fs');

const installationType = 'Single Linux Host';

module.exports = async function() {
	let onPremVersion = '0.0.0', release, installationBranch, dockerHubInfo = {};

	if (installationType === 'Single Linux Host') {
		const onPremInstallationDirectory = process.env.CSSVC_ONPREM_INSTALL_DIR || '/opt/config';

		const releaseFile = `${onPremInstallationDirectory}/release`;
		release = fs.existsSync(releaseFile) ? fs.readFileSync(releaseFile).toString().trim() : 'GA';

		const installationBranchFile = `${onPremInstallationDirectory}/installation-branch`;
		installationBranch = fs.existsSync(installationBranchFile) ? fs.readFileSync(installationBranchFile).toString().trim() : 'master';

		// eg. https://github.com/TeamCodeStream/onprem-install/blob/master/versions/preview-single-host.ver
		const containerVersionFile = `${onPremInstallationDirectory}/container-versions`;
		if (fs.existsSync(containerVersionFile)) {
			const containerVersions = fs.readFileSync(containerVersionFile).toString().replace(/"/g, '').split('\n');
			containerVersions.forEach(versionAssignment => {
				if (!versionAssignment.startsWith('#')) {
					let [componentName, componentValue] = versionAssignment.split('=');
					dockerHubInfo[componentName] = componentValue;
				}
			});
			onPremVersion = dockerHubInfo.onPremVersion;
		}
	}

	return {
		installationType,
		dockerHubInfo,
		onPremVersion,
		release,
		installationBranch
	};
};
