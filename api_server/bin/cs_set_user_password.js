#!/usr/bin/env node

// utility script to set a user's password

/* eslint no-console: 0 */

'use strict';

const PasswordHasher = require(process.env.CS_API_TOP + '/modules/users/password_hasher');
const Email = process.argv[2];
const Password = process.argv[3];
const MongoClient = require(process.env.CS_API_TOP + '/server_utils/mongo/mongo_client');
const ApiConfig = require(process.env.CS_API_TOP + '/config/config');
const UserIndexes = require(process.env.CS_API_TOP + '/modules/users/indexes');

if (!Email || !Password) {
	console.log('Usage: cs_set_user_password <email> <password>');
	process.exit();
}

(async function() {

	const Config = await ApiConfig.loadPreferredConfig();

	const mongoClient = new MongoClient();
	const mongoConfig = Object.assign({}, Config.mongo, { collections: ['users'] });
	delete mongoConfig.queryLogging;
	try {
		await mongoClient.openMongoClient(mongoConfig);
	}
	catch (error) {
		console.error(`unable to open mongo client: ${JSON.stringify(error)}`);
		process.exit();
	}
	const userCollection = mongoClient.mongoCollections.users;

	const hash = await new PasswordHasher({ password: Password }).hashPassword();

	try {
		const users = await userCollection.getByQuery(
			{ searchableEmail: Email.toLowerCase() },
			{ hint: UserIndexes.bySearchableEmail }
		);
		if (users.length === 0) {
			console.error('User not found: ' + Email);
			process.exit();
		}
		await mongoClient.mongoCollections['users'].updateDirect(
			{ searchableEmail: Email.toLowerCase() }, 
			{ $set: { passwordHash: hash } }
		);
	} 
	catch (error) {
		console.error(`unable to set password hash for user: ${JSON.stringify(error)}`);
		process.exit();
	}

	console.log('Password hash changed');
	process.exit();
})();

