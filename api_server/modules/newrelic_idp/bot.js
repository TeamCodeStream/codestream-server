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
	.option('-o --getOrg <id>', 'Get New Relic / Azure org matching the given ID')
	.option('-a --auth <domain_id>', 'List all New Relic / Azure users under given authentication domain ID')
	.option('-u --username <username>', 'List all New Relic / Azure users matching a given username')
	.option('--update <id>', 'Update the attributes of the user, given its ID')
	.option('--org-name <id>', 'Update the attributes of the org, given its ID')
	.option('--data <data>', 'The data to use when updating user attributes, in json')
	.option('--name <name>', 'The name to use when updating an org name, in json')
	.option('--delete <id>', 'Delete the user given by ID')
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
		} else if (Commander.getOrg) {
			response = await idp.getOrg(Commander.getOrg);
			response = { data: { attributes: response } };
		} else if (Commander.auth) {
			response = await idp.getUsersByAuthDomain(Commander.auth);
		} else if (Commander.username) {
			response = await idp.getUsersByUsername(Commander.username);
		} else if (Commander.update && Commander.data) {
			let json;
			try {
				json = JSON.parse(Commander.data);
			} catch (error) {
				console.log('Unable to parse json:', error.message);
				process.exit();
			}
			response = await idp.updateUser(Commander.update, json);
		} else if (Commander.orgName && Commander.name) {
			response = await idp.changeOrgName(Commander.orgName, Commander.name);
		} else if (Commander.delete) {
			response = await idp.deleteUser(Commander.delete);
		}
		console.log(JSON.stringify(response && response.data, undefined, 5));
	}
	catch (error) {
		console.error(error);
		process.exit();
	}
})();


