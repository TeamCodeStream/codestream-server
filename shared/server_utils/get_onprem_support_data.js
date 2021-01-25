
'use strict';

const hjson = require("hjson");
const fs = require("fs");

// Load OnPrem support data

// This data describes properties of the installation (docker based, asset based,
// asset versions, etc...). Not all of the same data is relevant to each product
// type (installation type). Further, some data is not avaiable at runtime for
// the individual services.
//
// This data is orthogonal to the configuration data.
//
// Configuration values used here (such as onPremInstallationDirectory) should
// exist _outside_ the CodeStream configuration as they're specific to network
// resources upon which CodeStream is deployed (docker on one host, docker in
// the cloud, kubernetes, etc...).


function getProductType(logger) {
	let onPremInstallationDirectory = process.env.OPADM_ONPREM_INSTALL_DIR || '/opt/config'
	let productType;
	// if (!fs.existsSync(onPremInstallationDirectory)) {
	// 	console.log(`${onPremInstallationDirectory} does not exist. Falling back to etc/onprem-installation-data with dummy data`);
	// 	onPremInstallationDirectory = 'etc/onprem-installation-data';
	// }
	if (!fs.existsSync(onPremInstallationDirectory)) {
		onPremInstallationDirectory = null;
	}
	if (onPremInstallationDirectory === '/opt/config') {
		// dockerized version of CS running on a single linux host
		productType = 'Single Linux Host';
	}
	else {
		// non-dockerized development environments (local sandboxes, PDOP, ...)
		productType = `On-Prem Development`;
	}
	return { onPremInstallationDirectory, productType };	
}

module.exports = async function(logger) {
	let onPremVersion = '0.0.0', release = null, installationBranch = null, assetInfo = {}, dockerInfo = {};
	const { onPremInstallationDirectory, productType } = getProductType(logger);

	// on-prem version and docker image info contained here
	if (onPremInstallationDirectory) {
		const releaseFile = `${onPremInstallationDirectory}/release`;
		release = fs.existsSync(releaseFile) ? fs.readFileSync(releaseFile).toString().trim() : 'GA';

		const installationBranchFile = `${onPremInstallationDirectory}/installation-branch`;
		installationBranch = fs.existsSync(installationBranchFile) ? fs.readFileSync(installationBranchFile).toString().trim() : 'master';

		const containerVersionFile = `${onPremInstallationDirectory}/container-versions`;
		if (fs.existsSync(containerVersionFile)) {
			const containerVersions = fs.readFileSync(containerVersionFile).toString().replace(/"/g, '').split('\n');
			containerVersions.forEach(versionAssignment => {
				if (versionAssignment && !versionAssignment.startsWith('#')) {
					let [componentName, componentValue] = versionAssignment.split('=');
					dockerInfo[componentName] = componentValue;
				}
			});
			onPremVersion = dockerInfo.onPremVersion;
			delete dockerInfo.onPremVersion;
		}
	}

	const installationData = {
		productType,
		dockerInfo,
		assetInfo,
		onPremVersion,
		release,
		installationBranch
	};
	return installationData;
};
