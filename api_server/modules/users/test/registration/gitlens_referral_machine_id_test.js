'use strict';

const GitLensReferralTest = require('./gitlens_referral_test');
const RandomString = require('randomstring');

class GitLensReferralMachineIdTest extends GitLensReferralTest {

	get description () {
		return 'when registering as a user who was previously recognized as a GitLens user, the user should get source attribute set to "GitLens" even if only the machine ID matches';
	}

	// send a request which will associate the email with a GitLens user
	createGitLensUser (callback) {
		const email = this.userFactory.randomEmail(); // NOT the same email as the user who will register
		const emailHash = this.hash(email);
		this.data.machineId = RandomString.generate(12);
		const machineIdHash = this.hash(this.data.machineId);
		this.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/gitlens-user',
				data: {
					emailHashes: [emailHash],
					machineIdHash
				}
			},
			callback
		);
	}
}

module.exports = GitLensReferralMachineIdTest;
