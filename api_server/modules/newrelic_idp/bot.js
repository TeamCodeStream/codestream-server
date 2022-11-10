#!/usr/bin/env node

/* eslint no-console: 0 */

'use strict';

const Commander = require('commander');
const NewRelicIDP = require('./newrelic_idp');

//const ApiConfig = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/config/config');
//const FS = require('fs');

Commander
	.option('-l, --list <email>', 'List all New Relic / Azure users matching email')
	.option('-g --get <id>', 'Get New Relic / Azure user matching the given ID')
	.option('-a --auth <domain_id>', 'List all New Relic / Azure users under given authentication domain ID')
	.option('-u --username <username>', 'List all New Relic / Azure users matching a given username')
	.parse(process.argv);

(async function() {
	const idp = new NewRelicIDP();

	try {
		await idp.initialize();

		let response;
		if (Commander.list) {
			response = await idp.listUsers(Commander.list);
		} else if (Commander.get) {
			response = await idp.getUser(Commander.get);
		} else if (Commander.auth) {
			response = await idp.getUsersByAuthDomain(Commander.auth);
		} else if (Commander.username) {
			response = await idp.getUsersByUsername(Commander.username);
		}
		console.log(JSON.stringify(response && response.data, undefined, 5));
	}
	catch (error) {
		console.error(error);
		process.exit();
	}
})();


