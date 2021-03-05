#!/usr/bin/env node

/* eslint no-console: 0 */

'use strict';

// const fs = require('fs');
// const hjson = require('hjson');
const util = require('util');
const printf = require('printf');
// const Fs = require('fs');
// const Url = require('url');
const Commander = require('commander');
const { config } = require('process');
const firstConfigInstallationHook= require(__dirname + '/../../server_utils/custom_cfg_initialization');
const StructuredCfgFactory = require(__dirname + '/../lib/structured_config.js');
const StringifySortReplacer = require(__dirname + '/../../server_utils/stringify_sort_replacer');
const LicenseManager = require(__dirname + '/../../server_utils/LicenseManager');

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
	.option('-l, --load <cfgFile>', 'add this config file into mongo')
	.option('--and-activate', 'use with --load if you want to activate the config being loaded')
	.option('--admin-port <adminPort>', 'set this admin port when loading via --add-cfg-file')
	.option('--first-cfg-hook', 'apply the first-time configuration setup hook used by the API')
	.option('-d, --desc <desc>', 'config description')
	.option('-c, --cfg-collection-name <cfgCollectionName>', 'configuration collection name (def = structuredConfiguration)')
	.option('-r, --report', 'report configuration summary')
	.option('-s, --schema-version <schemaVersion>', 'override default schema version', cmdrHandleInt)
	.option('-S, --dump <serialNum>', 'read config for serial number and dump it')
	.option('-a  --activate <serialNum>', 'activate the configuration')
	.option('-D, --delete <serialNum>', 'delete config for serial number')
	// .option('-L, --load-cfg', 'load config as an application would')
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

const ConfigReport = async() => {
	await CfgData.loadConfig();
	const configSummary = await CfgData.getConfigSummary({schemaVersion: Commander.schemaVersion});
	const activeConfigDoc = CfgData.getConfigMetaDocument();
	if (configSummary) {
		console.log('Serial Number            A Time Stamp                     Schema  Revision  Desc');
		console.log('------------------------ - -----------------------------  ------  --------  -----------------------');
		configSummary.forEach(cfg => {
			console.log(
				printf('%24s %1s %29s  %6d     %5d  %s', cfg.serialNumber, cfg.serialNumber === activeConfigDoc.serialNumber ? '*' : ' ', new Date(cfg.timeStamp).toUTCString(), cfg.schemaVersion, cfg.revision, cfg.desc)
			);
		});
	}
}

(async function() {
	let exitCode = 0;
	await CfgData.initialize({connectOnly: true});
	// Add a new config to the collection from a file
	if (Commander.load) {
		if (!Commander.desc) {
			console.error('description (--desc) required');
			process.exit(1);
		}
		const CfgFile = StructuredCfgFactory.create({ configFile: Commander.load });
		const configToLoad = await CfgFile.loadConfig();
		if (Commander.firstCfgHook) {
			firstConfigInstallationHook(configToLoad);
			configToLoad.apiServer.phoneHomeUrl = 'https://phone-home.codestream.com';
			const myLicense = await new LicenseManager({
				db: CfgData.getMongoClient().db(),
				onPrem: true,
			}).getMyLicense();
			if (configToLoad.apiServer.phoneHomeDisabled && (!myLicense.isPaid || myLicense.isTrial)) {
				configToLoad.apiServer.phoneHomeDisabled = false;
			}
		}
		if (Commander.adminPort && configToLoad.adminServer) configToLoad.adminServer.port = parseInt(Commander.adminPort);
		const dataHeader = await CfgData.addNewConfigToMongo(
			// hjson.parse(Fs.readFileSync(Commander.load, 'utf8')),
			configToLoad,
			{
				schemaVersion: Commander.schemaVersion,
				desc: Commander.desc,
				activate: Commander.andActivate || false,
			}
		);
		if (!dataHeader) {
			console.error('config load failed');
			exitCode = 1;
		}
		else {
			dataHeader.timeStamp = new Date(dataHeader.timeStamp).toUTCString();
			console.log(util.inspect(dataHeader, false, null, true /* enable colors */));
		}
		await ConfigReport();
	}
	// summary of all configs in the collection
	else if (Commander.report) {
		await ConfigReport();
	}
	// dump a config by its serial number
	else if (Commander.dump) {
		const config =
			Commander.dump === 'active'
				? await CfgData.loadConfig()
				: Commander.dump == 'latest'
				? await CfgData.getMostRecentConfig()
				: await CfgData.getConfigBySerial(Commander.dump);
		if (Commander.pretty) {
			console.log(util.inspect(config, false, null, true /* enable colors */));
		} else {
			console.log(JSON.stringify(config, StringifySortReplacer, '\t'));
		}
	}
	// delete a config by its serial number
	else if (Commander.delete) {
		await CfgData.deleteConfigFromMongo(Commander.delete);
		await ConfigReport();
	}
	// activate a configuration
	else if (Commander.activate) {
		await CfgData.activateMongoConfig(Commander.activate);
		await ConfigReport();
	}
	else {
		Commander.help();
		examples();
		exitCode = 1;
	}
	process.exit(exitCode);
})();
