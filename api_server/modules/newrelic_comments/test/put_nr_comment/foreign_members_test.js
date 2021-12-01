'use strict';

const UpdateNRCommentTest = require('./update_nr_comment_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class ForeginMembersTest extends UpdateNRCommentTest {

	get description () {
		return 'when a reply to a code error is updated via the New Relic comment engine, any mentioned users should be added as foreign members of the team unless they are already on the team';
	}

	get method () {
		return 'get';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.claimCodeError,
			this.updateNRComment,
			this.setPath
		], callback);
	}

	setTestOptions (callback) {
		this.userOptions.numRegistered = 3;
		this.userOptions.numUnregistered = 2;
		this.teamOptions.members = [0, 1, 3];
		this.mentionedUsersOnTeam = [1, 3];
		this.mentionedUsersNotOnTeam = [2, 4];
		super.setTestOptions(callback);
	}

	makeUpdateData (callback) {
		this.mentionedEmails = [
			this.userFactory.randomEmail()
		];
		const authorId = this.nrCommentResponse.codeStreamResponse.post.creatorId;
		this.expectedForeignMemberIds = [authorId, 'placeholder'];
		this.mentionedUsersOnTeam.forEach(nUser => {
			this.mentionedEmails.push(this.users[nUser].user.email);
		});
		this.mentionedUsersNotOnTeam.forEach(nUser => {
			this.mentionedEmails.push(this.users[nUser].user.email);
			this.expectedForeignMemberIds.push(this.users[nUser].user.id);
		});
		super.makeUpdateData(error => {
			if (error) { return callback(error); }
			this.data.mentionedUsers = this.mentionedEmails.map(email => { 
				return { email };
			});
			callback();
		});
	}

	updateNRComment (callback) {
		super.updateNRComment(error => {
			if (error) { return callback(error); }
			this.expectedForeignMemberIds[1] = Object.keys(this.nrUpdateResponse.post.userMaps).find(userId => {
				return this.nrUpdateResponse.post.userMaps[userId].email === this.mentionedEmails[0];
			});
			callback();
		});
	}

	setPath (callback) {
		this.path = `/teams/${this.team.id}`;
		callback();
	}

	// validate that the response is correct
	validateResponse (data) {
		data.team.foreignMemberIds.sort();
		this.expectedForeignMemberIds.sort();
		Assert.deepStrictEqual(data.team.foreignMemberIds, this.expectedForeignMemberIds, 'foreignMemberIds not correct');
	}
}

module.exports = ForeginMembersTest;
