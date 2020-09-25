'use strict';

import express from 'express';
import { Logger, MongoStructuredConfig } from '../config/GlobalData';

const ApiRouter = express.Router();

// return the global config data as a 'config' property in a json object
// ApiRouter.get('/config', (req, res) => {
// 	res.send({ config: Config });
// });

// list of config meta docs
ApiRouter.get('/config/summary/:schemaVersion?', (req, res) => {
	(async function() {
		Logger.log(`api:/config/summary (schemaVersion=${req.params.schemaVersion})`);
		const configSummary = await MongoStructuredConfig.getConfigSummary({schemaVersion: req.params.schemaVersion});
		res.send(configSummary);
	})();
});

// activate a configuration
ApiRouter.put('/config/activate/:serialNumber', (req, res) => {
	(async function() {
		Logger.log(`api:/config/activate (schemaVersion=${req.params.serialNumber})`);
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
		Logger.log(`api:/config (get request) ${req.params.serialNumber}`);
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
		Logger.log(`api:/config (delete request)  ${req.params.serialNumber}`);
		const result = await MongoStructuredConfig.deleteConfigFromMongo(req.params.serialNumber);
		if (result) {
			res.send('true');
		}
		else {
			res.status(404).send('false');
		}
	})();
});

export default ApiRouter;
