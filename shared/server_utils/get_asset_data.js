
// load asset or installation info for a service

const Fs = require('fs');
const hjson = require('hjson');

const AssetData = {};

async function getAssetData(options = {}) {
	const logger = options.logger || console;
	if (Object.keys(AssetData).length) {
		return AssetData;
	}
	let serviceRoot = options.serviceRoot || '.'; // devtools framework *_TOP directory
	let repoRoot = options.repoRoot || serviceRoot;

	let packageName = options.name;
	if (!packageName) {
		if (Fs.existsSync(`${serviceRoot}/package.json`)) {
			packageName = hjson.parse(Fs.readFileSync(`${serviceRoot}/package.json`, 'utf8')).name;
		} else {
			logger.log(`get_installation_data() cannot determine package name`);
			return null;
		}
	}
	AssetData.runTimeEnvironment = options.runTimeEnvironment || null;
	const assetInfoFile = `${serviceRoot}/${packageName}.info`;
	AssetData.assetInfo = Fs.existsSync(assetInfoFile)
		? hjson.parse(Fs.readFileSync(assetInfoFile, 'utf8'))
		: null;
	// this file is placed in the docker image by the devtools dt-docker-build script
	AssetData.isDockerContainer = Fs.existsSync(`${repoRoot}/dockerImage.json`);
	AssetData.dockerImageInfo = AssetData.isDockerContainer
		? hjson.parse(Fs.readFileSync(`${repoRoot}/dockerImage.json`, 'utf8'))
		: null;
	return AssetData;
}

module.exports = getAssetData;
