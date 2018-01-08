'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var PubNub = require('pubnub');
var PubNubConfig = require(process.env.CS_API_TOP + '/config/pubnub');
var PubNubClient = require(process.env.CS_API_TOP + '/lib/util/pubnub/pubnub_client.js');
var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var Assert = require('assert');

class SubscriptionTest extends CodeStreamAPITest {

	get description () {
		let action = this.otherUserCreates ? 'are added to' : 'create';
		let repoStatus = this.repoExists ? 'an existing repo' : 'a new repo';
		let teamStatus = this.teamExists ? 'an existing team' : 'a new team';
		return `user should be able to subscribe to the ${this.which} channel when they ${action} ${repoStatus} in ${teamStatus}`;
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createOtherUser,
			this.createOtherRepo,
			this.createRepo
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

	createOtherRepo (callback) {
		if (!this.repoExists && !this.teamExists) {
			return callback();
		}
		let token = this.otherUserCreates ? this.otherUserData.accessToken : this.token;
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherRepo = response.repo;
				this.otherTeam = response.team;
				callback();
			},
			{
				token: token
			}
		);
	}

	createRepo (callback) {
		if (this.repoExists) {
			this.postExistingRepo(callback);
		}
		else {
			this.postNewRepo(callback);
		}
	}

	postExistingRepo (callback) {
		let token = this.otherUserCreates ? this.otherUserData.accessToken : this.token;
		let repoData = {
			teamId: this.otherRepo.teamId,
			url: this.otherRepo.url,
			firstCommitHash: this.otherRepo.firstCommitHash,
			emails: this.otherUserCreates ? [this.currentUser.email] : [this.otherUserData.user.email]
		};
		this.repoFactory.createRepo(
			repoData,
			token,
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				this.repo = response.repo;
				callback();
			}
		);
	}

	postNewRepo (callback) {
		let token = this.otherUserCreates ? this.otherUserData.accessToken : this.token;
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				this.repo = response.repo;
				callback();
			},
			{
				teamId: this.teamExists ? this.otherTeam._id : null,
				withEmails: this.otherUserCreates ? [this.currentUser.email] : [this.otherUserData.user.email],
				token: token
			}
		);
	}

	run (callback) {
		let pubNubClient = this.createPubNubClient();
		let id = this.which === 'repo' ? this.repo._id :
			this.teamExists ? this.otherTeam._id : this.team._id;
		let channel = `${this.which}-${id}`;
		pubNubClient.subscribe(
			channel,
			() => {},
			error => {
				Assert.ifError(error, `error subscribing to ${channel}`);
				callback();
			}
		);
	}

	createPubNubClient () {
		// we remove the secretKey, which clients should NEVER have, and the publishKey, which we won't be using
		let clientConfig = Object.assign({}, PubNubConfig);
		delete clientConfig.secretKey;
		delete clientConfig.publishKey;
		clientConfig.uuid = this.currentUser._id;
		clientConfig.authKey = this.token;
		let client = new PubNub(clientConfig);
		return new PubNubClient({
			pubnub: client
		});
	}
}

module.exports = SubscriptionTest;
