#!/usr/bin/env node

/*************************************************************************************************************************************************
 *************************************************************************************************************************************************
 *************************************************************************************************************************************************
 * NOTE - THIS SCRIPT IS STILL IN PROGRESS ... DO NOT USE UNTIL MORE FULLY TESTED
 *************************************************************************************************************************************************
 *************************************************************************************************************************************************
 *************************************************************************************************************************************************
*/

/* eslint no-console: 0 */

'use strict';

const Commander = require('commander');
const MongoClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/mongo/mongo_client');
const ApiConfig = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/config/config');

Commander
	.option('-t, --team <teamId>', 'Deidentify team')
	.option('-u, --user <userId>', 'Deidentify user')
	.option('--strings, --deidentify-strings', 'Quote-enclosed, comma-separated list of strings to redact')
	.parse(process.argv);

if (!Commander.team && !Commander.user) {
	console.warn('teamId or userId required');
	process.exit();
}

let Options = {
	teamId: Commander.team,
	userId: Commander.user,
	deidentifyStrings: Commander.deidentifyStrings
};

const COLLECTIONS = ['companies', 'teams', 'users', 'posts', 'codemarks', 'reviews'];

const Wait = function(time) {
	return new Promise(resolve => {
		setTimeout(resolve, 100);
	});
}

class Deidentifier {

	async go (options) {
		Object.assign(this, options);
		this.logger = this.logger || console;
		await ApiConfig.loadPreferredConfig();
		await this.openMongoClient();
		await this.getTargetObject();
		await this.getUsers();
		await this.deidentifyUsers();
		await this.deactivateTeam();
	}

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

	async getTargetObject () {
		if (this.teamId) {
			this.team = await this.data.teams.getById(this.teamId);
			if (!this.team) {
				throw `could not fetch team ${this.teamId}`;
			}
		} else if (this.userId) {
			this.user = await this.data.users.getById(this.userId);
			if (!this.user) {
				throw `could not fetch user ${this.userId}`;
			}
		}
		else {
			throw 'must provide team ID or user ID';
		}
	}

	async getUsers () {
		if (this.team) {
			this.users = await this.data.users.getByIds(this.team.memberIds);
		} else {
			this.users = [this.user];
		}
	}

	async deidentifyUsers () {
		for (const user of this.users) {
			console.log(`Deidentifying user ${user.id}...`);
			await this.deidentifyUser(user);
			await Wait(100);
		}
	}

	async deidentifyUser (user) {
		await this.deidentifyUserContent(user);

		if (this.team && (user.teamIds || []).find(tid => tid !== this.team.id)) {
			console.log(`******** Not deidentifying user ${user.id} who is on multiple teams`);
			return;
		}

		const now = Date.now();
		const { email, fullName } = user;
		const emailParts = (email || '').split('@');
		const domainParts = emailParts[1] && emailParts[1].split('.');
		const fullNameParts = (fullName || '').split(' ');
		const redactedEmail = `${this.redactString(emailParts[0])}-deactivated${now}@${domainParts.map(part => this.redactString(part)).join('.')}`;
		const redactedFullName = fullNameParts.map(part => this.redactString(part)).join(' ');

		const op = {
			$set: {
				email: redactedEmail,
				searchableEmail: redactedEmail,
				fullName: redactedFullName,
				deactivated: true,
			},
			$unset: {
				firstName: true,
				lastName: true,
				providerInfo: true,
				accessTokens: true,
				timeZone: true,
				sessions: true,
				preferences: true,
				pubNubToken: true,
				providerIdentities: true,
				broadcasterToken: true,
				modifiedReposModifiedAt: true,
				status: true,
				modifiedRepos: true,
				countryCode: true,
				compactModifiedRepos: true,
				secondaryEmails: true
			}
		};
		if (this.team) {
			op.$pull = {
				teamIds: this.team.id
			};
			if (this.team.companyId) {
				op.$pull.companyIds = this.team.companyId;
			}
		}

		await this.data.users.updateDirect(
			{ _id: this.data.users.objectIdSafe(user.id) },
			op
		);
	}

	redactString (str) {
		return '*'.repeat(str.length);
	}

	async deidentifyUserContent (user) {
		const teamIds = user.teamIds || [];
		for (let teamId of teamIds) {
			await this.deidentifyUserContentFromTeam(user, teamId);
		}
	}

	async deidentifyUserContentFromTeam (user, teamId) {
		for (let collection of ['posts', 'codemarks', 'reviews']) {
			await this.deidentifyUserContentInCollection(collection, user, teamId);
		}
	}

	async deidentifyUserContentInCollection (collection, user, teamId) {
		const result = await this.data[collection].getByQuery({ teamId }, { stream: true });
		let item;
		do {
			item = await result.next();
			if (item) {
				if (await this.deidentifyUserContentInItem(collection, item, user)) {
					await Wait(100);
				}
			}
		} while (item);
		result.done();
	}

	async deidentifyUserContentInItem(collection, item, user) {
		const set = { };
		['text', 'title'].forEach(contentAttr => {
			const strings = (this.deidentifyStrings || '').split(',');
			const stringsOrAttrs = [...strings, '__email', '__fullName'];
			stringsOrAttrs.forEach(stringOrAttr => {
				let index = -1;
				do {
					let value;
					if (stringOrAttr.startsWith('__')) {
						value = user[stringOrAttr.substring(2)] || '';
					} else {
						const match = stringOrAttr.match(/"(.*)"/);
						if (match) {
							value = match[1];
						} else {
							value = stringOrAttr;
						}
					}
					if (value.length > 0) {
						index = (item[contentAttr] || '').toLowerCase().indexOf(value.toLowerCase());
						if (index !== -1) {
							const before = item[contentAttr].substring(0, index - 1);
							const redacted = this.redactString(value);
							const after = item[contentAttr].substring(before.length + value.length);
							item[contentAttr] = set[contentAttr] = `${before}${redacted}${after}`;
						}
					}
				} while (index !== -1);
			});
		});

		if (Object.keys(set).length > 0) {
			console.log(`Deidentifying user ${user.id} from ${collection} item ${item.id}...`);
			await this.data[collection].updateDirect(
				{ _id: this.data[collection].objectIdSafe(item.id) },
				{ $set: set }
			);
			return true;
		}
	}

	async deactivateTeam () {
		if (this.team) {
			await this.data.teams.updateDirect(
				{ _id: this.data.teams.objectIdSafe(this.team.id) },
				{ $set: { deactivated: true } }
			);
		}
	}
}

(async function() {
	try {
		await new Deidentifier().go(Options);
		process.exit();
	}
	catch (error) {
		console.error(error);
		process.exit();
	}
})();
