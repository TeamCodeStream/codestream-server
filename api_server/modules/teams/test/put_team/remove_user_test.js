'use strict';

const PutTeamTest = require('./put_team_test');
const Assert = require('assert');

class RemoveUserTest extends PutTeamTest {

	get description () {
		return 'should return the updated team and directive when removing a user from a team';
	}
   
	// form the data for the team update
	makeTeamData (callback) {
		// find one of the other users in the team, and remove them from the team
		super.makeTeamData(() => {
			this.removedUsers = this.getRemovedUsers();
			if (this.removedUsers.length === 1) {
				// this tests conversion of single element to an array
				const removedUser = this.removedUsers[0];
				this.data.$addToSet = { removedMemberIds: removedUser.id };
				this.expectedData.team.$addToSet = { 
					removedMemberIds: [removedUser.id]
				};
				this.expectedData.team.$pull = {
					adminIds: [removedUser.id]
				};
			}
			else {
				const removedUserIds = this.removedUsers.map(user => user.id);
				this.data.$addToSet = { removedMemberIds: removedUserIds };
				this.expectedData.team.$addToSet = {
					removedMemberIds: removedUserIds
				};
				this.expectedData.team.$pull = {
					adminIds: removedUserIds
				};
			}

			this.expectedData.users = [];
			for (let i = 0; i < this.removedUsers.length; i++) {
				let version = this.removedUsers[i].version;
				if (this.removedUsers[i].id === this.users[this.teamOptions.creatorIndex].user.id) {
					version += 5;
				}
				const userUpdate = {
					_id: this.removedUsers[i].id, // DEPRECATE ME
					id: this.removedUsers[i].id,
					$pull: {
						teamIds: this.team.id
					},
					$set: {
						modifiedAt: Date.now(), // placeholder
						version: version + 1
					},
					$version: {
						before: version,
						after: version + 1
					}
				};
				this.expectedData.users.push(userUpdate);
			}
			callback();
		});
	}

	// get the users we want to remove from the team
	getRemovedUsers () {
		return [this.users[2].user];
	}

	validateResponse (data) {
		data.users.sort((a, b) => {
			return a.id.localeCompare(b.id);
		});
		this.expectedData.users.sort((a, b) => {
			return a.id.localeCompare(b.id);
		});
		for (let i = 0; i < data.users.length; i++) {
			Assert(data.users[i].$set.modifiedAt >= this.modifiedAfter, 'user.modifiedAt is not greater than before the team was updated');
			this.expectedData.users[i].$set.modifiedAt = data.users[i].$set.modifiedAt;
		}
		super.validateResponse(data);
	}
}

module.exports = RemoveUserTest;
