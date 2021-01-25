
// load asset or installation info for a service

const Fs = require('fs');
const hjson = require('hjson');

const AssetData = {};

async function getAssetData(options = {}) {
	const logger = options.logger || console;
	if (Object.keys(AssetData).length) {
		return AssetData;
	}
	let serviceRoot = options.serviceRoot || '.';
	let packageName = options.name;
	if (!packageName) {
		if (Fs.existsSync(`${serviceRoot}/package.json`)) {
			packageName = hjson.parse(Fs.readFileSync(`${serviceRoot}/package.json`, 'utf8')).name;
		}
		else {
			logger.log(`get_installation_data() cannot determine package name`);
			return null;
		}
	}
	const assetInfoFile = `${serviceRoot}/${packageName}.info`;
	AssetData.assetInfo = Fs.existsSync(assetInfoFile) ? hjson.parse(Fs.readFileSync(assetInfoFile, 'utf8')) : null;
	return AssetData;
}

module.exports = getAssetData;
