'use strict';

var GetMyselfTest = require('./get_myself_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var Assert = require('assert');
const UserAttributes = require('../../user_attributes');

class GetMyselfNoMeAttributesTest extends GetMyselfTest {

	get description () {
		return 'should not return me-only attributes when requesting myself by id';
	}

	// before the test runs...
	before (callback) {
		this.id = this.currentUser._id;	// we'll fetch "ourselves" but by our real ID, not by "me" ... this doesn't return me attributes
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

	// validate the response to the test request
	validateResponse (data) {
		// look for any "me-attributes" (attributes the requesting user can see but no other users should see) ...
		// with this request, we should NOT see any me-attributes
		let user = data.user;
		let foundMeAttributes = [];
		let meAttributes = Object.keys(UserAttributes).filter(attribute => UserAttributes[attribute].forMe);
		meAttributes.forEach(attribute => {
			if (user.hasOwnProperty(attribute)) {
				foundMeAttributes.push(attribute);
			}
		});
		Assert(foundMeAttributes.length === 0, 'response contains these me-only attributes: ' + foundMeAttributes.join(','));
	}
}

module.exports = GetMyselfNoMeAttributesTest;
