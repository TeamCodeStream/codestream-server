#!/usr/bin/env node

/* eslint no-console: 0 */

'use strict';

// const fs = require('fs');
// const hjson = require('hjson');
const util = require('util');
const printf = require('printf');
const Commander = require('commander');
const StructuredCfgFactory = require(__dirname + '/../lib/structured_config.js');
const StringifySortReplacer = require(__dirname + '/../../server_utils/stringify_sort_replacer');

function cmdrHandleInt(value) {
	return parseInt(value);
}

function examples() {
	console.log(
		'\nOVERVIEW\nLoad and manage configuration data stored in a mongo database.\n\n' +
			'EXAMPLES\n  To load a config file into mongo using the current schema version:\n' +
			'    mongo-config-loader.js --mongo-url mongodb://localhost/codestream  --add-cfg-file $CSSVC_CFG_FILE\n' +
			'\n  Summary of configs in mongo:\n' +
			'    mongo-config-loader.js --mongo-url mongodb://localhost/codestream --report-cfg'
	);
}

Commander
	.option('-m, --mongo-url <mongoUrl>', 'mongo url (required)')
	.option('-l, --add-cfg-file <addCfgFile>', 'add this config file into mongo')
	.option('-d, --desc <>', 'config description')
	.option('-c, --cfg-collection-name <cfgCollectionName>', 'configuration collection name (def = structuredConfiguration)')
	.option('-r, --report-cfg', 'report configuration summary')
	.option('-s, --schema-version <schemaVersion>', 'override default schema version', cmdrHandleInt)
	.option('-S, --show-cfg <serialNum>', 'read config for serial number and dump it')
	.option('-a  --activate-cfg <serialNum>', 'activate the configuration')
	.option('-D, --delete-cfg <serialNum>', 'delete config for serial number')
	.option('-L, --load-cfg', 'load config as an application would')
	.option('--pretty', 'pretty output for config dump')
	.parse(process.argv);

if (!Commander.mongoUrl && !process.env.CSSVC_CFG_URL) {
	console.error('mongoUrl required. Specify --mongo-url or set CSSVC_CFG_URL');
	Commander.outputHelp();
	examples()
	process.exit(1);
}

const CfgData = StructuredCfgFactory.create({
	mongoCfgCollection: Commander.cfgCollectionName,
	quiet: true,
	mongoUrl: Commander.mongoUrl || process.env.CSSVC_CFG_URL
});

(async function() {
	let exitCode = 0;
	await CfgData.initialize({connectOnly: true});
	// Add a new config to the collection from a file
	if (Commander.addCfgFile) {
		const CfgFile = StructuredCfgFactory.create({ configFile: Commander.addCfgFile });
		const configToLoad = await CfgFile.loadConfig();
		const dataHeader = await CfgData.addNewConfigToMongo(
			// hjson.parse(fs.readFileSync(Commander.addCfgFile, 'utf8')),
			configToLoad,
			{ schemaVersion: Commander.schemaVersion, desc: Commander.desc }
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
			console.log('Serial Number             Time Stamp                     Schema  Revision  Desc');
			console.log('------------------------  -----------------------------  ------  --------  -----------------------');
			configSummary.forEach(cfg => {
				console.log(
					printf('%24s  %29s  %6d  %5d     %s', cfg.serialNumber, new Date(cfg.timeStamp).toUTCString(), cfg.schemaVersion, cfg.revision, cfg.desc)
				);
			});
		}
	}
	// dump a config by its serial number
	else if (Commander.showCfg) {
		const config = await CfgData.getConfigBySerial(Commander.showCfg);
		if (Commander.pretty) {
			console.log(util.inspect(config, false, null, true /* enable colors */));
		} else {
			console.log(JSON.stringify(config, StringifySortReplacer, '\t'));
		}
	}
	// delete a config by its serial number
	else if (Commander.deleteCfg) {
		await CfgData.deleteConfigFromMongo(Commander.deleteCfg);
	}
	// activate a configuration
	else if (Commander.activateCfg) {
		await CfgData.activateMongoConfig(Commander.activateCfg);
	}
	else if (Commander.loadCfg) {
		await CfgData.loadPreferredConfig();
	}
	else {
		Commander.help();
		examples();
		exitCode = 1;
	}
	process.exit(exitCode);
})();
