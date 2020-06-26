#!/usr/bin/env node

// utility script to set a user's password

/* eslint no-console: 0 */

'use strict';

const PasswordHasher = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/password_hasher');
const MongoClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/mongo/mongo_client');
const ApiConfig = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/config/config');
const UserIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/indexes');
const Commander = require('commander');

Commander
	.requiredOption('-e, --email <email>', 'Email of user whose password is to change')
	.requiredOption('-p, --password <password>', 'Password to change to')
	.option('--force-set', 'Force the user to change their password next time they log in')
	.parse(process.argv);

(async function() {

	await ApiConfig.loadPreferredConfig();

	const mongoClient = new MongoClient({ collections: ['users'] });
	try {
		await mongoClient.openMongoClient(ApiConfig.getPreferredConfig().mongo);
	}
	catch (error) {
		console.error(`unable to open mongo client: ${JSON.stringify(error)}`);
		process.exit();
	}
	const userCollection = mongoClient.mongoCollections.users;

	const hash = await new PasswordHasher({ password: Commander.password }).hashPassword();

	try {
		const users = await userCollection.getByQuery(
			{ searchableEmail: Commander.email.toLowerCase() },
			{ hint: UserIndexes.bySearchableEmail }
		);
		if (users.length === 0) {
			console.error('User not found: ' + Commander.email);
			process.exit();
		}
		
		const set = {
			passwordHash: hash
		};
		if (Commander.forceSet) {
			set.mustSetPassword = true;
		}
		await mongoClient.mongoCollections['users'].updateDirect(
			{ searchableEmail: Commander.email.toLowerCase() }, 
			{ $set: set }
		);
	} 
	catch (error) {
		console.error(`unable to set password hash for user: ${JSON.stringify(error)}`);
		process.exit();
	}

	console.log('Password hash changed');
	process.exit();
})();

