'use strict';

const ChildPostsClaimedTest = require('./child_posts_claimed_test');
const Assert = require('assert');

class ForeignUsersTest extends ChildPostsClaimedTest {

	get description () {
		return 'when a code error is claimed by a team, all the authors of replies to that code error from the comment engine should be added as foreign users to the team';
	}

	run (callback) {
		super.run(error => {
			 if (error) { return callback(error); }
			 this.validateTeam(callback);
		});
	}

	// fetch the team and verify that all authors of the child posts were added as foreign users
	validateTeam (callback) {
		this.doApiRequest(
			{
				method: 'get',
				path: '/teams/' + this.team.id,
				token: this.token
			}, 
			(error, { team }) => {
				if (error) { return callback(error); }
				const userIds = this.childPosts.map(post => post.creatorId);
				const expectedForeignUserIds = [];
				const expectedMemberIds = this.team.memberIds;
				for (let n = 0; n < this.numChildPosts; n++) {
					const existingUserIndex = this.childPostByUser && this.childPostByUser[n];
					const existingUser = existingUserIndex ? this.users[existingUserIndex] : undefined;
					const isTeamMember = (
						this.teamOptions.members === 'all' ||
						(
							this.teamOptions.members instanceof Array && 
							this.teamOptions.members.includes(existingUserIndex)
						)
					);
					if (!existingUser || !isTeamMember) {
						expectedForeignUserIds.push(userIds[n]);
						expectedMemberIds.push(userIds[n]);
					}
				}
				expectedMemberIds.push(this.nrCommentResponse.post.creatorId);
				expectedForeignUserIds.push(this.nrCommentResponse.post.creatorId);
				expectedForeignUserIds.sort();
				team.foreignMemberIds.sort();
				Assert.deepStrictEqual(team.foreignMemberIds, expectedForeignUserIds, 'foreign members do not match');
				team.memberIds.sort();
				expectedMemberIds.sort();
				Assert.deepStrictEqual(team.memberIds, expectedMemberIds, 'members do not match');
				callback();
			}
		)
	}
}
module.exports = ForeignUsersTest;
