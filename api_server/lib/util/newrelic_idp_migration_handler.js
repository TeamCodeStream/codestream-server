'use strict';

const UserIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/indexes');

const PASSWORD_PLACEHOLDER = 'Temp123!'

class MigrationHandler {
	
	constructor (options) {
		Object.assign(this, options);
		this.data = this.data || this.api.data;
		this.logger = this.api || this.logger || console;
		this.throttle = this.throttle || 100;
		this.idpOptions = {
			mockResponse: this.dryRun,
			logger: this.logger,
			verbose: this.verbose
		};
	}

	// migrate this company to one-user-per-org
	async migrateCompany (company) {
		try {
			let numUsersMigrated = 0; 

			this.log('\n\n************************************************************************');
			this.log(`Migrating users in company ${company.id}:${company.name}...`);
			const teamId = company.everyoneTeamId;
			company.team = await this.data.teams.getById(teamId);

			// determine the NR organization ID that we will migrate users to, if any
			let toNROrgId = this.getNROrgId(company);

			// if we're not migrating to an existing NR org (meaning this will be a "codestream-only" comany),
			// determine first user to migrate, based on company creator and/or admins, then migrate
			// them first by doing a sign-up provisioning, which creates an org ... all other users get created directly
			let firstUser;
			let origin = 'NR';
			let nrOrgInfo;
			let existingUsers = [];
			if (!toNROrgId) {
				this.log(`No linked NR org ID, determining first user...`);
				firstUser = await this.determineFirstUser(company);
				if (firstUser.error) {
					return firstUser;
				}

				// migrate this user through signup process
				this.logVerbose(`User ${firstUser.id}:${firstUser.email} determined to be first user`);
				nrOrgInfo = await this.signupFirstUser(firstUser, company);
				if (nrOrgInfo.error) {
					return nrOrgInfo;
				}

				this.logVerbose(`First user signup: ${JSON.stringify(nrOrgInfo, 0, 5)}`);
				this.log(`User ${firstUser.id}:${firstUser.email} signed up as first user`);
				toNROrgId = nrOrgInfo.organization_id;
				origin = 'CS';
				numUsersMigrated++;
			} else {
				this.log(`This org is linked to NR org ${toNROrgId}`);

				// must determine an auth domain before creating user
				let authDomainIds;
				try {
					authDomainIds = await this.idp.getAuthDomains(toNROrgId, this.idpOptions);
				}
				catch (ex) {
					const message = ex instanceof Error ? ex.message : JSON.stringify(ex);
					const stack = ex instanceof Error ? ex.stack : '';
					return this.companyError(company, `exception thrown getting auth domains: ${message}:\n${stack}`);
				}
				this.logVerbose(`authDomainIds: ${authDomainIds}`);

				if (authDomainIds.length === 0) {
					return this.companyError(company, 'no auth domains found for user creation');
				} else if (authDomainIds.length > 1) {
					this.warn(`Organization ${toNROrgId} has multiple auth domains`);
				}
				nrOrgInfo = {
					authentication_domain_id: authDomainIds[0]
				};
				origin = 'NR';

				// get all the users belonging to this auth domain, existing users matching emails in the CS org
				// will be linked to instead of created against that auth domain
				existingUsers = await this.idp.getUsersByAuthDomain(authDomainIds[0], this.idpOptions)
			}

			// fetch users in the company
			const users = await this.data.users.getByQuery(
				{
					teamIds: teamId
				},
				{
					hint: UserIndexes.byTeamIds
				}
			);

			// migrate each (registered)  user in the everyone team of the company
			let numUserErrors = 0;
			let numUsersExisting = 0;
			this.logVerbose(`Found ${users.length} users`);
			for (let user of users) {
				if (firstUser && user.id === firstUser.id) continue;
				if (
					!user.email ||
					!user.isRegistered ||
					user.externalUserId ||
					user.deactivated
				) continue;

				const existingUser = existingUsers.find(u => u.attributes.email === user.email);
				if (existingUser) {
					this.log(`Found existing user ${user.email} in auth domain ${nrOrgInfo.authentication_domain_id}`);
					const userInfo = await this.updateUserToExisting(user, existingUser);
					numUsersExisting++;
				} else {
					this.log(`Migrating ${user.id}:${user.email} to auth domain ${nrOrgInfo.authentication_domain_id}...`);
					const userInfo = await this.createUserInOrg(user, nrOrgInfo.authentication_domain_id);
					if (userInfo.error) {
						numUserErrors++;
					} else {
						numUsersMigrated++;
					}
				}
				await this.wait(this.throttle);
			}

			// update the company, setting its linked NR Org ID
			const update = {
				linkedNROrgId: toNROrgId,
				orgOrigination: origin,
				codestreamOnly: origin === 'CS',
				nrOrgInfo: {
					authentication_domain_id: nrOrgInfo.authentication_domain_id,
					account_id: nrOrgInfo.account_id
				}
			};
			this.logVerbose(`Updating company: ${JSON.stringify(update, 0, 5)}`);
			await this.data.companies.updateById(company.id, update);

			return { numUsersMigrated, numUserErrors, numUsersExisting };
		}
		catch (ex) {
			const message = ex instanceof Error ? ex.message : JSON.stringify(ex);
			const stack = ex instanceof Error ? ex.stack : '';
			return this.companyError(company, `exception thrown: ${message}:\n${stack}`);
		}
	}

	// determine what NR organization ID we will migrate users to from this company, if any
	getNROrgId (company) {
		// for now, assume the company has only one linked NR org, and use that
		if (company.nrOrgIds && company.nrOrgIds.length > 0) {
			return company.nrOrgIds[0];
		}
	}

	// determine the "first user", the user that will create the NR organization
	async determineFirstUser (company) {
		try {
			let firstUser;

			// first user will be the earliest created admin
			// otherwise step through the admins
			const admins = await this.data.users.getByIds(company.team.adminIds);
			let earliestCreatedAt;
			admins.forEach(admin => {
				if (!admin.deactivated && (!earliestCreatedAt || admin.createdAt < earliestCreatedAt)) {
					firstUser = admin;
					earliestCreatedAt = admin.createdAt;
				}
			});
			if (firstUser) return firstUser;

			// as a total fallback, take the earliest created member
			const members = await this.data.users.getByIds(company.team.memberIds);
			earliestCreatedAt = null;
			members.forEach(member => {
				if (
					!member.deactivated && 
					!company.team.removedMemberIds.includes(member.id) &&
					(
						!earliestCreatedAt || 
						member.createdAt <= earliestCreatedAt
					)
				) {
					firstUser = member;
					earliestCreatedAt = member.createdAt;
				}
			});

			return firstUser || this.companyError(company, 'no first user found among active members');
		} catch (ex) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			const stack = ex instanceof Error ? ex.stack : '';
			return this.companyError(company, `exception thrown determining first user: ${message}:\n${stack}`);
		}
	}

	// signup the first user in an org, creating a new org and putting the user in it
	async signupFirstUser (firstUser, company) {
		try {
			let nrUserInfo;
			try {
				const name = firstUser.fullName || firstUser.email.split('@')[0];
				nrUserInfo = await this.idp.fullSignup({
					email: firstUser.email,
					password: PASSWORD_PLACEHOLDER, // this will ultimatey be replaced!
					name,
					orgName: company.name
				}, this.idpOptions);
			} catch (ex) {
				const message = ex instanceof Error ? ex.message : JSON.stringify(ex);
				const error = `*** Caught exception calling signup: ${message}`;
				return this.userError(firstUser, error);
			}
			this.logVerbose(`fullSignup response:\n${JSON.stringify(nrUserInfo, 0, 5)}`);

			// for some reason, the user_id comes out as a string 
			if (typeof nrUserInfo.user_id === 'string') {
				nrUserInfo.user_id = parseInt(nrUserInfo.user_id, 10);
				if (!nrUserInfo.user_id || isNaN(nrUserInfo.user_id)) {
					throw new Error('provisioned user had non-numeric ID from New Relic');
				}
			}
				
			// save NR user info obtained from the signup process
			await this.data.users.applyOpById(
				firstUser.id,
				{
					$set: {
						nrUserInfo: { }, // anything we want to save here?
						nrUserId: nrUserInfo.user_id
					},
					$unset: {
						encryptedPasswordTemp: true,
						companyName: true,
						originalEmail: true
					}
				}
			);

			// return the org info
			const nrOrgInfo = { ...nrUserInfo };
			delete nrOrgInfo.user_id;
			return nrOrgInfo;
		} catch (ex) {
			const message = ex instanceof Error ? ex.message : JSON.stringify(ex);
			const stack = ex instanceof Error ? ex.stack : '';
			const error = `Exception thrown signing up first user: ${message}:\n${stack}`;
			return this.companyError(company, error);
		}
	}

	// create a user record under the specified New Relic auth domain id
	async createUserInOrg (user, authDomainId) {
		try {
			const name = user.fullName || user.email.split('@')[0];
			let nrUserInfo;
			try {
				nrUserInfo = await this.idp.createUserWithPassword(
					{
						name,
						email: user.email,
						authentication_domain_id: authDomainId,
						email_is_verified: true,
						active: true
					},
					PASSWORD_PLACEHOLDER, // this will ultimately be replaced!
					this.idpOptions
				);
			} catch (ex) {
				const message = ex instanceof Error ? ex.message : JSON.stringify(ex);
				const stack = ex instanceof Error ? ex.stack : '';
				return this.userError(user, `exception thrown on createUserWithPassword: ${message}:\n${stack}`);
			}

			// for some reason, the ID comes out as a string 
			if (typeof nrUserInfo.id === 'string') {
				nrUserInfo.id = parseInt(nrUserInfo.id, 10);
				if (!nrUserInfo.id || isNaN(nrUserInfo.id)) {
					throw new Error('created user had non-numeric ID from New Relic');
				}
			}

			// save NR user info obtained from the creation process
			const op = {
				$set: {
					nrUserInfo: { }, // anything we want to store here?
					nrUserId: nrUserInfo.id
				},
				$unset: {
					encryptedPasswordTemp: true,
					joinCompanyId: true,
					originalEmail: true
				}
			};
			await this.data.users.applyOpById(user.id, op);

			return nrUserInfo;
		} catch (ex) {
			const message = ex instanceof Error ? ex.message : JSON.stringify(ex);
			const stack = ex instanceof Error ? ex.stack : '';
			return this.userError(user, `exception thrown creating user: ${message}:\n${stack}`);
		}
	}

	// update a CS user that was found to have an existing user record within their NR org
	async updateUserToExisting (csUser, nrUser) {
		// for some reason, the user_id comes out as a string 
		if (typeof nrUser.id === 'string') {
			nrUser.id = parseInt(nrUser.id, 10);
			if (!nrUser.id || isNaN(nrUser.id)) {
				throw new Error('provisioned user had non-numeric ID from New Relic');
			}
		}

		const op = {
			$set: {
				nrUserInfo: { }, // anything we want to store here?
				nrUserId: nrUser.id
			},
			$unset: {
				encryptedPasswordTemp: true,
				joinCompanyId: true,
				originalEmail: true
			}
		};
		await this.data.users.applyOpById(csUser.id, op);
	}

	// wait this number of milliseconds
	async wait (time) {
		this.logVerbose(`Waiting ${time} ms...`);
		return new Promise(resolve => {
			setTimeout(resolve, time);
		});
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
		this.logger.log(msg);
	}

	async companyError (company, msg) {
		// update the company, setting error
		this.warn(msg);
		await this.data.companies.updateById(company.id, { migrationError: msg });
		return { error: msg };
	}

	async userError (user, msg) {
		// update the user, setting error
		this.warn(`Failed to migrate user ${user.id}:${user.email}: ${msg}`);
		await this.data.users.updateById(user.id, { migrationError: msg });
		return { error: msg };
	}

	logVerbose (msg) {
		if (this.verbose) {
			this.log(msg);
		}
	}
}

module.exports = MigrationHandler;