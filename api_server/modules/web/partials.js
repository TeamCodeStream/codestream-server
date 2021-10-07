'use strict';

class Partials {
	constructor(data) {
		this.data = data;
	}

	async getMenu(user, team) {
		let companyName;
		try {
			if (user && !team) {
				const teamIds = user.get('teamIds');
				if (teamIds && teamIds.length > 0) {
					  team = await this.data.teams.getById(teamIds[0]);
				
				}
			}
			if (team) {
				const company = await this.data.companies.getById(team.get('companyId'))
				companyName = company.get('name');
			}
		}
		catch (ex) {
			//what?
		}

		return {
			companyName: companyName,
			isAuthenticated: user != null
		};
	}
}

module.exports = Partials;
