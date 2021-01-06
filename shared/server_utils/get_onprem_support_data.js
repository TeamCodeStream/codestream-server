
'use strict';

const hjson = require('hjson');

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

const fs = require('fs');
// const { integrationStatuses } = require('../../onprem_admin/src/store/actions/presentation');

function getProductType(logger) {
	let onPremInstallationDirectory = process.env.CSSVC_ONPREM_INSTALL_DATA || '/opt/config'
	let productType;
	if (!fs.existsSync(onPremInstallationDirectory)) {
		console.log(`${onPremInstallationDirectory} does not exist. Falling back to etc/onprem-installation-data with dummy data`);
		onPremInstallationDirectory = 'etc/onprem-installation-data';
	}
	if (!fs.existsSync(onPremInstallationDirectory)) {
		console.log(`installation directory ${onPremInstallationDirectory} does not exist. done trying`);
		process.exit(1);
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

	const releaseFile = `${onPremInstallationDirectory}/release`;
	release = fs.existsSync(releaseFile) ? fs.readFileSync(releaseFile).toString().trim() : 'GA';

	const installationBranchFile = `${onPremInstallationDirectory}/installation-branch`;
	installationBranch = fs.existsSync(installationBranchFile) ? fs.readFileSync(installationBranchFile).toString().trim() : 'master';

	// on-prem version and docker image info contained here
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

	// most of the asset info is not available to the onprem admin server directly
	if (fs.existsSync('onprem-admin.info')) {
		const infoData = hjson.parse(fs.readFileSync('onprem-admin.info', 'utf8'));
		assetInfo['onprem-admin'] = `${infoData.fullName} (${infoData.assetEnvironment})`;
	}
	else {
		assetInfo['onprem-admin'] = `sandbox repo (${process.env.OPADM_ASSET_ENV})`;
	}

	const installationData = {
		productType,
		assetInfo,
		dockerInfo,
		onPremVersion,
		release,
		installationBranch
	};
	logger.log("installaionData", installationData);
	return installationData;
};
