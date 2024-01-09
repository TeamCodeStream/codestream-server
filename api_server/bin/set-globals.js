#!/usr/bin/env node
/* eslint no-console: 0 */
const ApiConfig = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/config/config');
const MongoClient = require('mongodb').MongoClient;

const globalsToSet = [ "serviceGatewayAuth" ];

(async function () {
	let mongoClient, db;
	try {
		console.log("set-globals...");
		const mongoUrl = ApiConfig.configIsMongo()
			? ApiConfig.options.mongoUrl
			: (await ApiConfig.loadPreferredConfig()).storage.mongo.url;
		const mongoTlsOpts = ApiConfig.configIsMongo()
			? ApiConfig.options.mongoTlsOpts
			: (await ApiConfig.loadPreferredConfig()).storage.mongo.tlsOptions;
		mongoClient = await MongoClient.connect(mongoUrl, Object.assign({ useNewUrlParser: true }, mongoTlsOpts));
		db = mongoClient.db();
		for (const global of globalsToSet) {
			const item = await db.collection('globals').findOne({ tag: global });
			if (!item) {
				await db.collection('globals').insertOne({ enabled: true, tag: global });
			} else {
				if (!item.enabled) {
					await db.collection('globals').updateOne({ tag: global }, { $set: { enabled: true } });
				}
			}
			console.log(`${global} set to true`);
		}
		process.exit(0);
	} catch (error) {
		console.log('mongo connect error', error);
		process.exit(1);
	}
})();
