'use strict';

const Migration = require('./migration');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');

const ThrottleTime = 100;

// wait this number of milliseconds
const Wait = function (time) {
	return new Promise(resolve => {
		setTimeout(resolve, time);
	});
};

class UserStatusToTeamLevel extends Migration {

	get description () {
		return 'Pushing user status to team level for all users';
	}

	async execute () {
		const result = await this.data.users.getByQuery(
			{ 
				$and: [
					{ status: { $exists: true } },
					{ "status.label": { $ne: "" } }
				]
			},
			{
				stream: true,
				overrideHintRequired: true,
				sort: { _id: -1 }
			}
		);

		let user;
		do {
			user = await result.next();
			if (user) {
				await this.processUser(user);
				await Wait(ThrottleTime);
			}
		} while (user);
		result.done();

	}

	async processUser (user) {
		const newStatus = DeepClone(user.status);	 // maintain backward compatibility, though after extension update this won't be read
		const invisible = user.status.invisible;

		// for users who are on only one team, migrate their status to the 
		// level of that one team, otherwise we just delete their status
		if (user.teamIds.length === 1) {
			newStatus[user.teamIds[0]] = user.status;

		// except that if the user has their "invisible" flag set
		// (meaning LiveView is off), we honor that for all teams
		} else if (invisible && user.teamIds.length > 1) {
			for (let teamId of user.teamIds) {
				newStatus[teamId] = { invisible: true };
			}
		}

		this.log(`Writing user level status for user ${user.id}...`);
		await this.data.users.updateDirect(
			{ id: this.data.users.objectIdSafe(user.id) },
			{$set: { status: newStatus } }
		);
	}

	async verify () {
	}
}

module.exports = UserStatusToTeamLevel;