'use strict';

import express from 'express';
import { Logger, MongoStructuredConfig, SystemStatusMonitor } from '../config/globalData';

const ApiRouter = express.Router();

// list of config meta docs
ApiRouter.get('/config/summary/:schemaVersion?', (req, res) => {
	(async function() {
		Logger.log(`api(get):/config/summary/${req.params.schemaVersion})`);
		const configSummary = await MongoStructuredConfig.getConfigSummary({schemaVersion: req.params.schemaVersion});
		res.send(configSummary);
	})();
});

// activate a configuration by serial number
ApiRouter.put('/config/activate/:serialNumber', (req, res) => {
	(async function() {
		Logger.log(`api(put):/config/activate/${req.params.serialNumber})`);
		const result = await MongoStructuredConfig.activateMongoConfig(req.params.serialNumber);
		if (result) {
			res.send('true');
		}
		else {
			res.status(400).send('false');
		}
	})();
});

// fetch a configuration by serial number
ApiRouter.get('/config/:serialNumber', (req, res) => {
	(async function () {
		Logger.log(`api(get):/config/${req.params.serialNumber}`);
		const config = await MongoStructuredConfig.getConfigBySerial(req.params.serialNumber, {includeMetaData: true});
		if (config) {
			res.send(config);
		} else {
			res.status(404).send('false');
		}
	})();
});

// delete configuration by serial number
ApiRouter.delete('/config/:serialNumber', (req, res) => {
	(async function() {
		Logger.log(`api(delete):/config/${req.params.serialNumber}`);
		const result = await MongoStructuredConfig.deleteConfigFromMongo(req.params.serialNumber);
		if (result) {
			res.send('true');
		}
		else {
			res.status(404).send('false');
		}
	})();
});

// add a new config to the database and optionally activate it (set to '1' or 'true')
// FIXME: is it necessary to validate the body before writing to mongo??
ApiRouter.post('/config/:activate?', (req, res) => {
	(async function() {
		Logger.log(`api(post):/config/${req.params.activate}`);
		const activate = req.params.activate in ['1', 'true', 'activate'];
		const configDoc = await MongoStructuredConfig.addNewConfigToMongo(
			req.body.configData,
			{ desc: req.body.desc }
		);
		if (!configDoc) {
			Logger.error(`Add new config failed`, req.body);
			res.status(404).send({success: false, reason: "Failed to add config to database"});
			return;
		}
		Logger.log(`added new config ${configDoc.serialNumber}`);
		if (activate) {
			const result = await MongoStructuredConfig.activateMongoConfig(configDoc.serialNumber);
			if (!result) {
				res.status(404).send({success: false, reason: `Failed to activate config ${serialNumber}`});
				return;
			}
			Logger.log(`activated cibfug ${configDoc.serialNumber}`);
		}
		res.send({success: true, response: { configDoc }});
	})();
});

ApiRouter.get('/status/history', (req, res) => {
	Logger.log(`api(get):/status/history`);
	res.send(SystemStatusMonitor.statusHistory);
});

export default ApiRouter;
