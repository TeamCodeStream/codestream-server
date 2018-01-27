'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var PubNub = require('pubnub');
var PubNubConfig = require(process.env.CS_API_TOP + '/config/pubnub');
var PubNubClient = require(process.env.CS_API_TOP + '/server_utils/pubnub/pubnub_client.js');
var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var Assert = require('assert');

// a class to check if the user is gets subscribed to the team and repo channel when a repo is created
// (or exists already) and they are added to the team that owns the repo
class SubscriptionTest extends CodeStreamAPITest {

	get description () {
		let action = this.otherUserCreates ? 'are added to' : 'create';
		let repoStatus = this.repoExists ? 'an existing repo' : 'a new repo';
		let teamStatus = this.teamExists ? 'an existing team' : 'a new team';
		return `user should be able to subscribe to the ${this.which} channel when they ${action} ${repoStatus} in ${teamStatus}`;
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,			
			this.createOtherUser,	// create a second registered user
			this.createOtherRepo,	// create a pre-existing repo as needed
			this.createRepo 		// create the test repo
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

	// create a pre-existing repo as needed for the test
	createOtherRepo (callback) {
		if (!this.repoExists && !this.teamExists) {
			return callback();	// no pre-existing repo
		}
		let token = this.otherUserCreates ? this.otherUserData.accessToken : this.token;	// "other" user or "current" user creates the repo
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

	// create the test repo
	createRepo (callback) {
		if (this.repoExists) {
			// "create" a repo that already exists
			this.postExistingRepo(callback);
		}
		else {
			// truly create a new repo
			this.postNewRepo(callback);
		}
	}

	// "create" a repo that already exists
	postExistingRepo (callback) {
		let token = this.otherUserCreates ? this.otherUserData.accessToken : this.token;	// "other" user or "current" user creates the repo
		// use attributes of the other repo in trying to create this repo
		let repoData = {
			teamId: this.otherRepo.teamId,
			url: this.otherRepo.url,
			firstCommitHash: this.otherRepo.firstCommitHash,
			emails: this.otherUserCreates ? [this.currentUser.email] : [this.otherUserData.user.email]	// always include both users
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

	// truly create a new repo
	postNewRepo (callback) {
		let token = this.otherUserCreates ? this.otherUserData.accessToken : this.token;	// "other" user or "current" user creates the repo
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				this.repo = response.repo;
				callback();
			},
			{
				teamId: this.teamExists ? this.otherTeam._id : null,
				withEmails: this.otherUserCreates ? [this.currentUser.email] : [this.otherUserData.user.email],	// always include both users
				token: token
			}
		);
	}

	// run the test
	run (callback) {
		// create a pubnub client and attempt to subscribe to whichever channel
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

	// create a pubnub client for the test
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
