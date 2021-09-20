'use strict';

const MultiTeamMigrator = require('./multi_team_migrator');

class MigrationHandler {
	
	constructor (options) {
		Object.assign(this, options);
	}

	// look for any companies the user is in that have not yet been migrated to company-centric,
	// if so, we block the request, return an error code, and kick off the migration
	async handleMigration () {

		// look for any companies the user is in that are not yet migrated
		// (or get the manually set company)
		let companyIds, companies;
		if (this.companyId) {
			const company = await this.api.data.companies.getById(this.companyId.toLowerCase());
			if (!company) {
				return 'notFound';
			}
			companies = [company];
			companyIds = [company.id];
		} else {
			companyIds = this.request.user.get('companyIds') || [];
			companies = await this.api.data.companies.getByIds(companyIds);
		}

		const migrationStatus = companies.reduce((stat, company) => {
			if (company.deactivated) {
				// don't care
			} else if (company.isBeingMigratedToCompanyCentric) {
				stat.migrationInProgress.push(company);
			} if (company.hasBeenMigratedToCompanyCentric) {
				stat.migrated.push(company);
			} else if ((company.teamIds || []).length > 1) {
				// to minimize change of race condition, mark this company as being migrated RIGHT NOW...
				// don't even await
				if (this.dryRun) {
					this.log(`Would have marked company ${company.id} as being migrated`);
				} else {
					this.api.data.companies.updateDirect(
						{ id: this.api.data.companies.objectIdSafe(company.id) },
						{ $set: { isBeingMigratedToCompanyCentric: true } }
					);
				}
				stat.unmigratedMultiTeam.push(company);
			} else {
				stat.unmigratedSingleTeam.push(company);
			}
			return stat;
		}, {
			migrated: [],
			unmigratedSingleTeam: [],
			unmigratedMultiTeam: [],
			migrationInProgress: []
		});

		if (
			migrationStatus.unmigratedSingleTeam.length === 0 &&
			migrationStatus.unmigratedMultiTeam.length === 0 &&
			migrationStatus.migrationInProgress.length === 0) {
			// all companies migrated
			this.log('All companies have already been migrated');
			return;
		}

		// in all other cases we will not honor the request, user must at least refresh, and maybe wait
		let errorCode = 'needsRefresh';

		// companies with only one team are trivial, we'll do those first
		if (migrationStatus.unmigratedSingleTeam.length > 0) {
			companyIds = migrationStatus.unmigratedSingleTeam.map(c => c.id);
			this.log(`Found ${companyIds.length} single-team unmigrated companies (${companyIds}), performing trivial migration...`);
			await this.migrateSingleTeamCompanies(companies);
		}

		// if we have any multi-team companies that must be migrated, these are non-trivial and may take time
		// so kick off the migration here
		if (migrationStatus.unmigratedMultiTeam.length > 0) {
			companyIds = migrationStatus.unmigratedMultiTeam.map(c => c.id);
			this.log(`Found ${companyIds.length} multi-team unmigrated companies (${companyIds}), kicking off migrations...`);
			Promise.all(migrationStatus.unmigratedMultiTeam.map(async company => {
				this.migrateMultiTeamCompany(company, this.request);
			}));
			errorCode = 'migrationInProgress';
		}

		// if there are any companies for which migration is already in progress, the migrationInProgress
		// error needs to be returned for the client to wait
		if (migrationStatus.migrationInProgress.length > 0) {
			companyIds = migrationStatus.migrationInProgress.map(c => c.id);
			this.log(`These companies have company-centric migration already in progress: ${companyIds}`);
			errorCode = 'migrationInProgress';
		}

		return errorCode;
	}

	// migrate all the single-team companies
	async migrateSingleTeamCompanies (companies) {
		const teamIds = companies.map(company => company.teamIds[0]);

		// mark their single teams as the "everyone" team
		if (this.dryRun) {
			this.log(`Would have updated teams ${teamIds} for single-team companies to everyone teams`);
		} else {
			await this.api.data.teams.updateDirect(
				{ id: this.api.data.teams.inQuerySafe(teamIds) }, 
				{ $set: { isEveryoneTeam: true } },
				{ multi: true }
			);
		}

		// update the companies
		await Promise.all(companies.map(async company => {
			const op = {
				$set: {
					everyoneTeamId: company.teamIds[0],
					hasBeenMigratedToCompanyCentric: true
				}
			};
			if (this.dryRun) {
				this.log(`Would have updated single-team company ${company.id} to company-centric with op:\n${JSON.stringify(op, undefined, 5)}`);
			} else {
				await this.api.data.companies.updateDirect({ id: this.api.data.companies.objectIdSafe(company.id) }, op);
			}
		}));
	}

	// kick off the migration for a multi-team company
	async migrateMultiTeamCompany (company, request) {
		return new MultiTeamMigrator().migrate({
			company,
			request,
			api: this.api,
			dryRun: this.dryRun
		});
	}

	warn (msg) {
		this.api.warn('*************************************************************************************');
		this.api.warn('*************************************************************************************');
		this.api.warn('*************************************************************************************');
		this.api.warn(msg);
		this.api.warn('*************************************************************************************');
		this.api.warn('*************************************************************************************');
		this.api.warn('*************************************************************************************');
	}
	
	log (msg) {
		this.api.log('*************************************************************************************');
		this.api.log(msg);
		this.api.log('*************************************************************************************');
	}
}

module.exports = MigrationHandler;