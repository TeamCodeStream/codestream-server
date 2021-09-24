'use strict';

const CreateNRCommentTest = require('./create_nr_comment_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class NewRelicUserIdReplaceTest extends CreateNRCommentTest {

	get description () {
		return 'when creating a New Relic comment, if a New Relic user ID is provided and the creator of the comment had a previous New Relic user ID that is now different, the New Relic user ID should replace the user\'s identity in provider identities';
	}

	// ensure we send a random New Relic user ID with our test comment
	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.nrCommentOptions.includeNewRelicUserId = true;
			callback();
		});
	}

	// before the test runs...
	before (callback) {
		// create an NR comment with a random creator, then set the creator of our test comment
		// to the same creator (by email)
		BoundAsync.series(this, [
			super.before,
			this.createNRComment,
			this.setCreator
		], callback);
	}

	// set the creator of the test comment to the creator of the first comment,
	// this should result in the same user ... but use a different New Relic user ID
	setCreator (callback) {
		this.data = this.requestData;
		this.data.creator.email = this.nrCommentResponse.post.creator.email;
		this.secondNewRelicUserId = this.data.creator.newRelicUserId = this.nrCommentFactory.randomNewRelicUserId();
		this.expectedResponse.post.creator.newRelicUserId = this.secondNewRelicUserId;
		this.expectedResponse.post.seqNum++;
		callback();
	}

	// run the base test, but then do other stuff...
	run (callback) {
		// run the base test, but then register the creator so we can fetch them
		BoundAsync.series(this, [
			super.run,
			this.registerFauxUser,
			this.fetchUser
		], callback);
	}

	// fetch the user and validate
	fetchUser (callback) {
		this.doApiRequest(
			{
				method: 'get',
				path: '/users/me',
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.validateFetchedUser(response);
				callback();
			}
		);
	}

	// validate that we changed the identity
	validateFetchedUser (response) {
		const { user } = response;
		Assert.deepStrictEqual(
			user.providerIdentities,
			[`newrelic::${this.secondNewRelicUserId}`],
			'New Relic user ID was not changed in providerIdentities'
		);
	}
}

module.exports = NewRelicUserIdReplaceTest;
