#!/usr/bin/env node

/* eslint no-console: 0 */

'use strict';

const util = require('util');
const Commander = require('commander');
const StructuredCfg = require(__dirname + '/../lib/structured_config.js');
const fs = require('fs');
const hjson = require('hjson');

function cmdrHandleInt(value) {
	return parseInt(value);
}

Commander
	.option('-m, --mongo-url <mongoUrl>', 'mongo url (required)')
	.option('-l, --add-cfg-file <addCfgFile>', 'add this config file into mongo')
	.option('-c, --cfg-collection-name <cfgCollectionName>', 'configuration collection name (def = structuredConfiguration)')
	.option('-r, --report-cfg', 'report configuration summary')
	.option('-s, --schema-version <schemaVersion>', 'override default schema version', cmdrHandleInt)
	.option('-S, --show-cfg <serialNum>', 'read config for serial number and dump it')
	.option('-D, --delete-cfg <serialNum>', 'delete config for serial number')
	.parse(process.argv);


if (!Commander.mongoUrl) {
	console.error('mongoUrl required');
	Commander.outputHelp();
	console.log(
		'\nOVERVIEW\nLoad and manage configuration data stored in a mongo database.\n\n' +
		'EXAMPLES\n  To load a config file into mongo using the current schema version:\n' +
		'    mongo-config-loader.js --mongo-url mongodb://localhost/codestream  --load-cfg-file $CSSVC_CFG_FILE\n' +
		'\n  Summary of configs in mongo:\n' +
		'    mongo-config-loader.js --mongo-url mongodb://localhost/codestream --report-cfg'
	);
	process.exit(1);
}

const CfgData = new StructuredCfg({
	mongoCfgCollection: Commander.cfgCollectionName,
	mongoUrl: Commander.mongoUrl
});

(async function() {
	let exitCode = 0;
	await CfgData.initialize({connectOnly: true});
	// Add a new config to the collection from a file
	if (Commander.addCfgFile) {
		const dataHeader = await CfgData.addNewConfigToMongo(
			hjson.parse(fs.readFileSync(Commander.addCfgFile, 'utf8')),
			{ schemaVersion: Commander.schemaVersion }
		);
		if (!dataHeader) {
			console.error('config load failed');
			exitCode = 1;
		}
		else {
			dataHeader.timeStamp = new Date(dataHeader.timeStamp).toUTCString();
			console.log(util.inspect(dataHeader, false, null, true /* enable colors */));
		}
	}
	// summary of all configs in the collection
	else if (Commander.reportCfg) {
		const configSummary = await CfgData.getConfigSummary({schemaVersion: Commander.schemaVersion});
		if (configSummary) {
			console.log('Serial Number               Schema    Time Stamp');
			console.log('-------------               ------    ----------');
			configSummary.forEach(cfg => console.log(`${cfg.serialNumber.padStart(20)}  ${cfg.schemaVersion.toString().padStart(6)}      ${new Date(cfg.timeStamp).toUTCString()}`));
		}
	}
	// dump a config by its serial number
	else if (Commander.showCfg) {
		const config = await CfgData.getConfigBySerial(Commander.showCfg);
		console.log(util.inspect(config, false, null, true /* enable colors */));
	}
	// delete a config by its serial number
	else if (Commander.deleteCfg) {
		await CfgData.deleteConfigFromMongo(Commander.deleteCfg);
	}
	else {
		Commander.help();
		exitCode = 1;
	}
	process.exit(exitCode);
})();
