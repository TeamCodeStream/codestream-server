'use strict';

var GetMyselfTest = require('./get_myself_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const UserTestConstants = require('../user_test_constants');
const UserAttributes = require('../../user_attributes');

class GetMyAttributesTest extends GetMyselfTest {

	get description () {
		return 'should return me-only attributes when requesting myself';
	}

	getExpectedFields () {
		// when fetching "myself", there are attributes i should see that no on else can see
		let userResponse = {};
		userResponse.user = [...UserTestConstants.EXPECTED_USER_FIELDS, ...UserTestConstants.EXPECTED_ME_FIELDS];
		return userResponse;
	}

	// before the test runs...
	before (callback) {
		this.id = 'me';	// this will be the "ID" of the user to fetch
		BoundAsync.series(this, [
			this.createOtherUser,	// create a second registered user
			this.createRepo,		// have the other user create a repo, which creates a team
			this.createStream,		// have the other user create a file-type stream in the repo
			this.createPost,		// have the other user create a post in the stream, this creates a lastReads attribute which only the current user should see when they fetch themselves
			super.before			// now do the standard setup 
		], callback);
	}

	// create a second registered user
	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData = response;
				callback();
			}
		);
	}

	// other user creates a repo (and team)
	createRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.repo = response.repo;
				this.team = response.team;
				callback();
			},
			{
				withEmails: [this.currentUser.email],	// include the "current" user in the team
				withRandomEmails: 1,					// create another random user for good measure
				token: this.otherUserData.accessToken	// "other" user creates the repo
			}
		);
	}

	// other user creates a file-type stream in the repo
	createStream (callback) {
		let streamOptions = {
			type: 'file',
			teamId: this.team._id,
			repoId: this.repo._id,
			token: this.otherUserData.accessToken	// "other" user creates the stream
		};
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
				callback();
			},
			streamOptions
		);
	}

	// create a post in the stream ... this should create a lastReads attribute for the current user which they
	// should then see when they fetch "themselves"
	createPost (callback) {
		let postOptions = {
			streamId: this.stream._id,
			token: this.otherUserData.accessToken	// "other" user creates the post
		};
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.post = response.post;
				callback();
			},
			postOptions
		);
	}

	// validate that the received user data does not have any attributes a client shouldn't see
	validateSanitized (user, fields) {
		// because me-attributes are usually sanitized out (for other users), but not for the fetching user,
		// we'll need to filter these out before calling the "base" validateSanitized, which would otherwise
		// fail when it sees these attributes
		let meAttributes = Object.keys(UserAttributes).filter(attribute => UserAttributes[attribute].forMe);
		meAttributes.forEach(attribute => {
			let index = fields.indexOf(attribute);
			if (index !== -1) {
				fields.splice(index, 1);
			}
		});
		super.validateSanitized(user, fields);
	}
}

module.exports = GetMyAttributesTest;
