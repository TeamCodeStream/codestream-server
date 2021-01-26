'use strict';

const RegistrationTest = require('./registration_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Crypto = require('crypto');

class GitLensReferralTest extends RegistrationTest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 2;
		this.teamOptions.creatorIndex = 1;
	}

	get description () {
		return 'when registering as a user who was previously recognized as a GitLens user, the user should get source attribute set to "GitLens"';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createGitLensUser
		], callback);
	}

	hash (s) {
		return Crypto.createHash('sha1').update(`gitlens:${s.trim().toLowerCase()}`).digest('hex').toLowerCase();
	}

	// send a request which will associate the email with a GitLens user
	createGitLensUser (callback) {
		const emailHash = this.hash(this.data.email);
		this.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/gitlens-user',
				data: {
					emailHashes: [emailHash]
				}
			},
			callback
		);
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.strictEqual(data.user.source, 'GitLens', 'source not set to "GitLens"');
		super.validateResponse(data);
	}
}

module.exports = GitLensReferralTest;
