'use strict';

const PutCodemarkTest = require('./put_codemark_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class PostFromOtherTeamTest extends PutCodemarkTest {

	constructor (options) {
		super(options);
		this.goPostless = true;
	}

	get description () {
		return 'should return an error when trying to connect a codemark to a post from a different team';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010',
			reason: 'linked post must be for the same team'
		};
	}

	init (callback) {
		// after other test initialization, create a post, which we'll then link to in the test request
		BoundAsync.series(this, [
			super.init,
			this.createTeam,
			this.createPost
		], callback);
	}

	// create another team to post to
	createTeam (callback) {
		this.teamFactory.createRandomTeam(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherTeamStream = response.streams[0];
				callback();
			},
			{
				token: this.token
			}
		);
	}

	// create a post, we'll then link the codemark to this post in the test request,
	// and expect appropriate changes in the response
	createPost (callback) {
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.data.postId = response.post.id;
				callback();
			},
			{
				streamId: this.otherTeamStream.id,
				token: this.token
			}
		);
	}

	// get data to use for the postless codemark ... now that we allow postless codemarks to be created in 
	// non-third-party provider teams, we'll remove the providerType field from the default behavior
	getPostlessCodemarkData () {
		const data = super.getPostlessCodemarkData();
		delete data.providerType;
		return data;
	}
}

module.exports = PostFromOtherTeamTest;