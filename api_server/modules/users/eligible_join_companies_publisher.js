// handle publishing a change in a user's "eligible join companies" ... publish the change
// on the user channel for all registered users matching the given email

'use strict';

const Indexes = require("./indexes");
const GetEligibleJoinCompanies = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/companies/get_eligible_join_companies');

class EligibleJoinCompaniesPublisher {

	constructor (options) {
		Object.assign(this, options);
	}

	// for every registered user record whose email matches the given email,
	// broadcast a new eligibleJoinCompanies "attribute"
	async publishEligibleJoinCompanies (email, options = {}) {
		let users = await this.request.data.users.getByQuery(
			{
				searchableEmail: email.toLowerCase()
			},
			{
				hint: Indexes.bySearchableEmail
			}
		);
		users = users.filter(user => !user.get('deactivated') && user.get('isRegistered'));
		if (users.length === 0) { return; }

		const eligibleJoinCompanies = await GetEligibleJoinCompanies(email, this.request);

		await Promise.all(users.map(async user => {
			await this.publishEligibleJoinCompaniesToUser(user, eligibleJoinCompanies);
		}));

		if (!options.dontPublishInOtherEnvironments) {
			const { environmentManager } = this.request.api.services;
			if (!environmentManager) { return; }
			if (this.request.request.headers['x-cs-block-xenv']) {
				this.request.log('Not publishing eligible join companies cross-environment, blocked by header');
				return;
			}
			return environmentManager.publishEligibleJoinCompaniesInEnvironments(email);
		}
	}

	// publish current eligibleJoinCompanies to a given user
	async publishEligibleJoinCompaniesToUser (user, eligibleJoinCompanies) {
		const channel = `user-${user.id}`;
		const message = {
			requestId: this.request.request.id,
			user: {
				id: user.id,
				$set: {
					eligibleJoinCompanies
				},
				$version: {
					before: '*'
				}
			}
		};
		try {
			await this.broadcaster.publish(
				message,
				channel,
				{ request: this.request	}
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.request.warn(`Could not publish eligibleJoinCompanies message to user ${user.id}: ${JSON.stringify(error)}`);
		}
	}
}

module.exports = EligibleJoinCompaniesPublisher;
