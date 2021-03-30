
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

const OnPremProductTypes = [
	'Single Linux Host',    // docker on linux running with host-based networking
	'Single Mac Host',      // docker on a mac using host.docker.internal for intra-container comm
	'On-Prem Development',  // development sandboxes (no docker)
	'Docker Compose'        // docker containers running with docker-compose default networking
];

// IMPORTANT: During the migration phase, this function is called _before_ the
// config is loaded (see api_server/bin/api_server.js). It can probe the
// environment for basic data, but it must not depend on the configuration in
// any way.
function getProductType() {
	let onPremInstallationDirectory = process.env.OPADM_ONPREM_INSTALL_DIR || '/opt/config'
	let productType = process.env.CSSVC_PRODUCT_TYPE || null;

	// FIXME: how do we get installation directory info to the containers?
	if (process.env.CSSVC_PRODUCT_TYPE)
		return { onPremInstallationDirectory: null, productType: process.env.CSSVC_PRODUCT_TYPE };

	// FIXME: uncomment when we're not worried about legacy installations WRT this var.
	// if (!productType) {
	// 	console.error('FATAL: product type (CSSVC_PRODUCT_TYPE) required');
	// 	process.exit(1);
	// }
	if (productType && !OnPremProductTypes.indexOf(productType)) {
		console.error(`FATAL: product type ${productType} is not supported`);
		process.exit(1);
	}

	// onPremInstallationDirectory only applies to Single Linux Host
	if (!fs.existsSync(`${onPremInstallationDirectory}/container-versions`)) {
		onPremInstallationDirectory = null;
	}

	// FIXME: this is legacy. Remove when we're certain that CSSVC_PRODUCT_TYPE
	// is _always_ defined
	if (!productType)
		productType =
			onPremInstallationDirectory === '/opt/config' ? 'Single Linux Host' : 'On-Prem Development';

	return { onPremInstallationDirectory, productType };	
}

async function getOnPremSupportData() {
	let onPremVersion = '0.0.0', release = null, installationBranch = null, assetInfo = {}, dockerInfo = {};
	const { onPremInstallationDirectory, productType } = getProductType();

	// on-prem version and docker image info contained here
	if (onPremInstallationDirectory) {
		// FIXME: CSSVC_INSTALL_RELEASE ?
		const releaseFile = `${onPremInstallationDirectory}/release`;
		release = fs.existsSync(releaseFile) ? fs.readFileSync(releaseFile).toString().trim() : 'GA';

		// FIXME: CSSVC_INSTALL_BRANCH ?
		const installationBranchFile = `${onPremInstallationDirectory}/installation-branch`;
		installationBranch = fs.existsSync(installationBranchFile) ? fs.readFileSync(installationBranchFile).toString().trim() : 'master';

		// FIXME: How do I get this data into the container ?
		const containerVersionFile = `${onPremInstallationDirectory}/container-versions`;
		if (fs.existsSync(containerVersionFile)) {
			const containerVersions = fs.readFileSync(containerVersionFile).toString().replace(/"/g, '').split('\n');
			containerVersions.forEach(versionAssignment => {
				if (versionAssignment && !versionAssignment.startsWith('#')) {
					let [componentName, componentValue] = versionAssignment.split('=');
					if (componentName === 'onPremVersion') {
						onPremVersion = componentValue;
					} else {
						dockerInfo[componentName] = componentValue;
					}
				}
			});
		}
	}

	return {
		productType,
		dockerInfo,
		assetInfo,
		onPremVersion,
		release,
		installationBranch
	};
};

module.exports = {
	getProductType,
	getOnPremSupportData
};