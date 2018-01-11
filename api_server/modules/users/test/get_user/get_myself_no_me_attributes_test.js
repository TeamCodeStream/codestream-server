'use strict';

var GetMyselfTest = require('./get_myself_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var Assert = require('assert');
const UserAttributes = require('../../user_attributes');

class GetMyselfNoMeAttributesTest extends GetMyselfTest {

	get description () {
		return 'should not return me-only attributes when requesting myself by id';
	}

	before (callback) {
		this.id = this.currentUser._id;
		BoundAsync.series(this, [
			this.createOtherUser,
			this.createRepo,
			this.createStream,
			this.createPost,
			super.before
		], callback);
	}

	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData = response;
				callback();
			}
		);
	}

	createRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.repo = response.repo;
				this.team = response.team;
				callback();
			},
			{
				withEmails: [this.currentUser.email],
				withRandomEmails: 1,
				token: this.otherUserData.accessToken
			}
		);
	}

	createStream (callback) {
		let streamOptions = {
			type: 'file',
			teamId: this.team._id,
			repoId: this.repo._id,
			token: this.otherUserData.accessToken
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

	createPost (callback) {
		let postOptions = {
			streamId: this.stream._id,
			token: this.otherUserData.accessToken
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

	validateResponse (data) {
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
