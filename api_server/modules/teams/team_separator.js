'use strict';

const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');

class MultiTeamSeparator {

	constructor (options) {
		Object.assign(this, options);
	}

	// separate all teams that are within a single company into their own companies, making each team
	// the "everyone" company for that team
	async separateAllTeams (company) {
		this.company = company;
		this.log(`Migrating multi-team company ${this.company.id} to company-centric paradigm by splitting into multiple companies...`);
		await this.getCompanyTeams();
		await this.createCompanies();
		await this.updateTeams();
		await this.setCompanyMigrated();
		await this.updateFirstTeam();
	}

	// get all the teams owned by the single company
	async getCompanyTeams () {
		const teamIds = this.company.teamIds || [];
		this.teamsToSplit = await this.data.teams.getByIds(teamIds, { requestId: this.requestId });
		if (this.teamsToSplit.length === 0) {
			// wha?? a company with no teams?? this really shouldn't happen
			this.warn(`Company ${this.company.id}:${this.company.name} has no teams!!!`);
		}
		this.firstTeam = this.teamsToSplit.shift();
		this.log(`Team ${this.firstTeam.id} will remain within the same company (${this.company.id})`);
		this.log(`Teams ${this.teamsToSplit.map(t => t.id)} will be given their own companies`);
	}

	// create a company for each team
	async createCompanies () {
		this.companiesByTeam = {};
		return Promise.all(this.teamsToSplit.map(async team => {
			await this.createCompanyForTeam(team);
		}))
	}

	// create a company for the given team, copying the properties of the original company as needed
	async createCompanyForTeam (team) {
		const now = Date.now();
		const companyData = DeepClone(this.company);
		Object.assign(companyData, {
			id: undefined,
			_id: undefined,
			teamIds: [team.id],
			name: team.name,
			everyoneTeamId: team.id,
			isBeingMigratedToCompanyCentric: undefined,
			hasBeenMigratedToCompanyCentric: true,
			createdAt: team.createdAt,
			creatorId: team.creatorId,
			modifiedAt: now,
			version: this.company.version + 1
		});

		this.log(`Creating company ${companyData.name} for team ${team.id}...`);
		if (this.dryRun) {
			this.log(`Would have created company ${companyData.name} for team ${team.id} with:\n${JSON.stringify(companyData, 0, 5)}`);
			this.companiesByTeam[team.id] = { id: '<COMPANY NOT YET CREATED>' };
		} else {
			this.companiesByTeam[team.id] = await this.data.companies.create(companyData);
		}
	}

	// update each team to point to its company
	async updateTeams () {
		return Promise.all(this.teamsToSplit.map(async team => {
			await this.updateTeam(team);
		}));
	}

	// update the given team to point to its newly created parent company
	async updateTeam (team) {
		const companyId = this.companiesByTeam[team.id].id;
		const op = {
			$set: {
				originalCompanyId: this.company.id,
				companyId,
				isEveryoneTeam: true,
				name: 'Everyone',
				originalName: team.name
			}
		};

		this.log(`Updating team ${team.id} to be owned by newly created company ${companyId}...`);
		if (this.dryRun) {
			this.log(`Would have updated team ${team.id} to be owned by newly created company ${companyId} with op:\n${JSON.stringify(op, undefined, 5)}`);
		} else {
			await this.data.teams.updateDirect({ id: this.data.teams.objectIdSafe(team.id) }, op, { requestId: this.requestId });
		}
	}

	// set the company as migrated, once and for all!
	async setCompanyMigrated () {
		const op = {
			$set: {
				everyoneTeamId: this.firstTeam.id,
				hasBeenMigratedToCompanyCentric: true,
				teamIds: [this.firstTeam.id],
				name: this.firstTeam.name,
				originalTeamIds: this.company.teamIds,
				originalName: this.company.name
			},
			$unset: {
				isBeingMigratedToCompanyCentric: true
			}
		}

		this.log(`Migrating multi-team company ${this.company.id} to company-centric (after splitting teams off)...`);
		if (this.dryRun) {
			this.log(`Would have migrated multi-team company ${this.company.id} to company-centric with op:\n${JSON.stringify(op, undefined, 5)}`);
		} else {
			return this.data.companies.updateDirect({ id: this.data.companies.objectIdSafe(this.company.id) }, op, { requestId: this.requestId });
		}
	}

	// update the "first" team in the list of teams, which did not need a company created, only needs to be set as the everyone team
	async updateFirstTeam () {
		const op = {
			$set: {
				isEveryoneTeam: true,
				name: 'Everyone',
				originalName: this.firstTeam.name
			}
		};

		this.log(`Updating first team ${this.firstTeam.id} for company ${this.company.id} to everyone team...`);
		if (this.dryRun) {
			this.log(`Would have updated first team ${this.firstTeam.id} for company ${this.company.id} with op:\n${JSON.stringify(op, 0, 5)}`);
		} else {
			return this.data.teams.updateDirect({ id: this.data.teams.objectIdSafe(this.firstTeam.id) }, op, { requestId: this.requestId });
		}
	}

	warn (msg) {
		this.logger.warn('*************************************************************************************');
		this.logger.warn('*************************************************************************************');
		this.logger.warn('*************************************************************************************');
		this.logger.warn(`${this.requestId || ''} ${msg}`);
		this.logger.warn('*************************************************************************************');
		this.logger.warn('*************************************************************************************');
		this.logger.warn('*************************************************************************************');
	}
	
	log (msg) {
		this.logger.log('*************************************************************************************');
		this.logger.log(`${this.requestId || ''} ${msg}`);
		this.logger.log('*************************************************************************************');
	}
}

module.exports = MultiTeamSeparator;