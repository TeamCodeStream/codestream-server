#!/usr/bin/env node

// utility script to set a user's password

/* eslint no-console: 0 */

'use strict';

const PasswordHasher = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/password_hasher');
const Email = process.argv[2];
const Password = process.argv[3];
const MongoClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/mongo/mongo_client');
const ApiConfig = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/config/config');
const UserIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/indexes');

if (!Email || !Password) {
	console.log('Usage: cs_set_user_password <email> <password>');
	process.exit();
}

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

