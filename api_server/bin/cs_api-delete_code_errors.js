#!/usr/bin/env node

//desc// delete all code errors and associated posts from a given company

/* eslint no-console: 0 */

'use strict';

const Commander = require('commander');
const MongoClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/mongo/mongo_client');
const ApiConfig = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/config/config');

Commander
	.option('-c, --companyId <companyId>', 'ID of the company')
	.parse(process.argv);

if (!Commander.companyId) {
	console.warn('companyId required');
	process.exit();
}

class CodeErrorDeleter {

	constructor (options) {
		Object.assign(this, options);
	}

	async go () {
		await this.openMongoClient();
		await this.doDelete();
		process.exit();
	}

	// open a mongo client to do the dirty work
	async openMongoClient () {
		this.mongoClient = new MongoClient({ collections: ['__all'] });
		try {
			await this.mongoClient.openMongoClient(ApiConfig.getPreferredConfig().storage.mongo);
			this.data = this.mongoClient.mongoCollections;
		}
		catch (error) {
			throw `unable to open mongo client: ${JSON.stringify(error)}`;
		}
	}

	// do the deletion
	async doDelete () {
		const company = await this.data.companies.getById(this.companyId);
		if (!company) {
			console.warn('COMPANY NOT FOUND: ' + this.companyId);
		}
		const teamId = company.everyoneTeamId;

		const codeErrors = await this.data.codeErrors.getByQuery({ teamId }, { overrideHintRequired: true });
		console.log(`Found ${codeErrors.length} code errors for company ${this.companyId}`);
		const codeErrorIds = codeErrors.map(ce => ce._id);
		const postIds = codeErrors.map(ce => ce.postId);

		const childPosts = await this.data.posts.getByQuery(
			{
				teamId,
				parentPostId: { $in: postIds }
			},
			{ overrideHintRequired: true }
		);
		console.log(`Found ${childPosts.length} child posts`);
		const childPostIds = childPosts.map(p => p._id.str);

		const grandchildPosts = await this.data.posts.getByQuery(
			{ 
				teamId,
				parentPostId: { $in: childPostIds }
			},
			{ overrideHintRequired: true }
		);
		console.log(`Found ${grandchildPosts.length} grandchild posts`);
		const grandchildPostIds = grandchildPosts.map(p => p._id.str);

		const allChildPostIds = [...childPostIds, ...grandchildPostIds];

		console.log(`Deleting markers...`);
		await this.data.markers.deleteByQuery({ teamId, postId: { $in: allChildPostIds } });

		console.log(`Deleting codemarks...`);
		await this.data.codemarks.deleteByQuery({ teamId, postId: { $in: allChildPostIds } });

		console.log(`Deleting posts...`);
		const allPostIds = [...postIds, ...allChildPostIds];
		await this.data.posts.deleteByIds(allPostIds);

		console.log(`Deleting code errors...`);
		await this.data.codeErrors.deleteByIds(codeErrorIds);
	}
}

(async function() {
	try {
		await ApiConfig.loadPreferredConfig();
		await new CodeErrorDeleter({companyId: Commander.companyId}).go();
	}
	catch (error) {
		console.error(error);
		process.exit();
	}
})();


