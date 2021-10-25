'use strict';

const TeamMerger = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/teams/team_merger');
const TeamSeparator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/teams/team_separator');

class MigrationHandler {
	
	constructor (options) {
		Object.assign(this, options);
		this.data = this.data || this.api.data;
		this.logger = this.api || this.logger || console;
	}

	// look for any companies the user is in that have not yet been migrated to company-centric,
	// if so, we block the request, return an error code, and kick off the migration
	async handleMigration () {

		// look for any companies the user is in that are not yet migrated
		// (or get the manually set company)
		let companyIds, companies;
		if (this.companyId) {
			const company = await this.data.companies.getById(this.companyId.toLowerCase());
			if (!company) {
				return 'notFound';
			}
			companies = [company];
			companyIds = [company.id];
		} else if (this.company) {
			companies = [this.company];
			companyIds = [this.company.id];
		} else {
			const excludeCompanyIds = (this.migrationData && this.migrationData.excludeCompanyIds) || [];
			companyIds = this.request.user.get('companyIds') || [];
			companyIds = companyIds.filter(companyId => {
				if (excludeCompanyIds.includes(companyId)) {
					this.log(`Excluding company ${companyId} from company-centric migration by order`);
					return false;
				} else {
					return true;
				}
			});
			companies = await this.data.companies.getByIds(companyIds);
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
					this.data.companies.updateDirect(
						{ id: this.data.companies.objectIdSafe(company.id) },
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
			this.log(`All companies of (${companyIds}) have already been migrated`);
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

		// if we have any multi-team companies that must be migrated, kick these off now
		// if they are merges they are non-trivial and may take time, but for now those won't be automatic
		if (migrationStatus.unmigratedMultiTeam.length > 0) {
			companyIds = migrationStatus.unmigratedMultiTeam.map(c => c.id);
			this.log(`Found ${companyIds.length} multi-team unmigrated companies (${companyIds}), kicking off migrations...`);
			await Promise.all(migrationStatus.unmigratedMultiTeam.map(async company => {
				await this.migrateMultiTeamCompany(company);
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
		let teamIds = companies.map(company => {
			return (company.teamIds || [])[0];
		}).filter(teamId => teamId);

		// mark their single teams as the "everyone" team
		if (this.dryRun) {
			this.log(`Would have updated teams ${teamIds} for single-team companies to everyone teams`);
		} else {
			await this.data.teams.updateDirect(
				{ id: this.data.teams.inQuerySafe(teamIds) }, 
				{ $set: { isEveryoneTeam: true } },
				{ multi: true }
			);
		}

		// update the companies
		await Promise.all(companies.map(async company => {
			if (company.teamIds && company.teamIds.length) {
				const op = {
					$set: {
						everyoneTeamId: company.teamIds[0],
						hasBeenMigratedToCompanyCentric: true
					}
				};
				if (this.dryRun) {
					this.log(`Would have updated single-team company ${company.id} to company-centric with op:\n${JSON.stringify(op, undefined, 5)}`);
				} else {
					await this.data.companies.updateDirect({ id: this.data.companies.objectIdSafe(company.id) }, op);
				}
			} else {
				this.log(`Company ${company.id} has no teams`);
			}
		}));
	}

	// kick off the migration for a multi-team company
	async migrateMultiTeamCompany (company) {
		try {
			const requestId = `M-${company.id}`;
			if (this.doMerge) {
				await new TeamMerger({
					logger: this.logger,
					data: this.data,
					dryRun: this.dryRun,
					requestId
				}).mergeAllTeams(company);
			} else {
				await new TeamSeparator({
					logger: this.logger,
					data: this.data,
					dryRun: this.dryRun,
					requestId
				}).separateAllTeams(company);
			}
			this.didMigrateMultiTeamCompany = true;
		}
		catch (error) {
			this.logger.warn(`Caught error trying to migrate multi-team company ${company.id}: ${error.message}`);
			this.logger.warn(error.stack);
		}
	}

	warn (msg) {
		this.logger.warn('*************************************************************************************');
		this.logger.warn('*************************************************************************************');
		this.logger.warn('*************************************************************************************');
		this.logger.warn(msg);
		this.logger.warn('*************************************************************************************');
		this.logger.warn('*************************************************************************************');
		this.logger.warn('*************************************************************************************');
	}
	
	log (msg) {
		this.logger.log('*************************************************************************************');
		this.logger.log(msg);
		this.logger.log('*************************************************************************************');
	}
}

module.exports = MigrationHandler;