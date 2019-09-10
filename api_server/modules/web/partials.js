'use strict';

class Partials {
	constructor(data) {
		this.data = data;
	}

	async getMenu(user, teamName) {
		try {
			if (user && !teamName) {
				const teamIds = user.get('teamIds');
				if (teamIds && teamIds.length > 0) {
					const team = await this.data.teams.getById(teamIds[0]);
					if (team) {
						teamName = team.get('name');
					}
				}
			}
		}
		catch (ex) {
			//what?
		}

		return {
			teamName: teamName,
			isAuthenticated: user != null
		};
	}
}

module.exports = Partials;
