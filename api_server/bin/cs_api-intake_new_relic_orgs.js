#!/usr/bin/env node

/* eslint no-console: 0 */

'use strict';

const MongoClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/mongo/mongo_client');
const ApiConfig = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/config/config');
const Commander = require('commander');
const ReadLine = require('readline');
const FS = require('fs');

Commander
	.option('-f, --file <file>', 'CSV file containing data to pull in')
	.option('-l, --limit <limit>', 'Limit to this number of records')
	.parse(process.argv);

const COLLECTIONS = ['newRelicOrgs'];
const THROTTLE_TIME = 1000;

// wait this number of milliseconds
const Wait = function(time) {
	return new Promise(resolve => {
		setTimeout(resolve, time);
	});
};

class IntakeEngine {

	constructor (options) {
		Object.assign(this, options);
	}

	async go () {
		await this.openMongoClient();
		await this.openFileStream();
		await this.writeCollection();
		await this.finish();
		process.exit();
	}

	// open a mongo client to do the dirty work
	async openMongoClient () {
		this.mongoClient = new MongoClient({ collections: COLLECTIONS });
		try {
			await this.mongoClient.openMongoClient(ApiConfig.getPreferredConfig().storage.mongo);
			this.data = this.mongoClient.mongoCollections;
		}
		catch (error) {
			throw `unable to open mongo client: ${JSON.stringify(error)}`;
		}
	}

	// open a file stream to read from
	async openFileStream () {
		this.fileStream = await FS.createReadStream(this.file);
		this.readLine = ReadLine.createInterface({
			input: this.fileStream
		});
	}

	// write out the account to org mapping collection, with throttling
	async writeCollection () {
		let n = 0;
		await this.data.newRelicOrgs.deleteByQuery({});
		for await (const line of this.readLine) {
			const [accountId, orgId] = line.split(',');
			const accountIdNum = parseInt(accountId, 10);
			if (!accountIdNum) continue;
			await this.data.newRelicOrgs.create({
				accountId: accountIdNum,
				orgId
			}, { noVersion: true });
			n++;
			if (n === this.limit) {
				console.log('Reached limit');
				break;
			}
			if (n % 1000 == 0) {
				console.log(`Wrote ${n} documents`);
				await Wait(THROTTLE_TIME);
			}
		}
	}

	async finish () {
		this.fileStream.close();
	}
}

(async function() {
	try {
		const file = Commander.file;
		if (!file) {
			throw 'must provide teamId or all';
		}
		let limit;
		if (Commander.limit) {
			limit = parseInt(Commander.limit);
			if (isNaN(limit)) {
				throw 'limit is not a number'
			}
		}
		await ApiConfig.loadPreferredConfig();
		await new IntakeEngine({ file, limit }).go();
	}
	catch (error) {
		console.error(error);
		process.exit();
	}
})();


