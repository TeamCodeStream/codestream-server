"use strict";

const UUID = require('uuid').v4;

class IDPSync {

	constructor (options) {
		Object.assign(this, options);
	}

	async syncUserAndOrg () {
		return (
			(await this.syncUser()) &&
			(await this.syncOrg())
		);
	}

	async syncUser () {
		const { user } = this.request;
		const nrUserId = user.get('nrUserId');
		if (!nrUserId) {
			this.request.warn(`User ${user.id} has no nrUserId`);
			return false;
		}

		const nrUserData = await this.request.api.services.idp.getUser(nrUserId, { request: this.request });
		const nrUser = nrUserData.data.attributes;
console.warn('NR USER:', JSON.stringify(nrUser, 0, 5));
		// TODO: what if deleted?
		const attrsToUpdate = {};
		if (nrUser.name !== user.get('fullName')) {
			attrsToUpdate.fullName = nrUser.name;
		} else if (
			nrUser.email !== user.get('email')
		) {
			attrsToUpdate.email = nrUser.email;
			attrsToUpdate.searchableEmail = nrUser.email.toLowerCase();
		}

		if (Object.keys(attrsToUpdate).length > 0) {
			await this.updateUser(attrsToUpdate);
		}
		return true;
	}

	async updateUser (attrs) {
		const { user } = this.request;
		this.request.log(`Updating user attributes for user ${user.id} (${Object.keys(attrs).join(',')}) from IDP sync`);

		const op = await this.request.api.data.users.applyOpById(
			user.id,
			{
				$set: {
					...attrs,
					modifiedAt: Date.now()
				}
			},
			{ 
				version: user.get('version')
			}
		);
		delete op.$set.searchableEmail;

		// send the resulting op out on broadcaster so clients make the update
		const teamId = (user.get('teamIds') || [])[0]; 
		if (!teamId) return; // should never happen
		const channel = `team-${teamId}`;
		const message = {
			requestId: UUID(),
			user: {
				id: user.id,
				...op
			}
		};
		try {
			await this.request.api.services.broadcaster.publish(
				message,
				channel,
				{ logger: this.request }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.request.warn(`Could not publish NR-sync user update message to channel ${channel}: ${JSON.stringify(error)}`);
		}

		// copy the changes into the current user object
		Object.assign(this.request.user.attributes, attrs);
	}

	async syncOrg () {
		const { user } = this.request;
		const companyId = (user.get('companyIds') || [])[0];
		if (!companyId) {
			throw this.request.errorHandler.error('notFound', { info: 'companyId' }); // shouldn't happen
		}
		const company = await this.request.data.companies.getById(companyId);
		if (!company) {
			throw this.request.errorHandler.error('notFound', { info: 'company' }); // shouldn't happen
		}
		const nrOrgId = company.get('linkedNROrgId');
		if (!nrOrgId) {
			this.request.warn('Company has no linkedNROrgId');
			return false;
		}

		const nrOrg = await this.request.api.services.idp.getOrg(nrOrgId, { request: this.request });
		// TODO: what if deleted?
		const attrsToUpdate = {};
		if (nrOrg.name !== company.get('name')) {
			attrsToUpdate.name = nrOrg.name;
		} 

		if (Object.keys(attrsToUpdate).length > 0) {
			await this.updateCompany(company, attrsToUpdate);
		}
		return true;
	}

	async updateCompany (company, attrs) {
		this.request.log(`Updating company attributes for company ${company.id} (${Object.keys(attrs).join(',')}) from IDP sync`);

		const op = await this.request.api.data.companies.applyOpById(
			company.id,
			{
				$set: {
					...attrs,
					modifiedAt: Date.now()
				}
			},
			{ 
				version: company.get('version')
			}
		);

		// send the resulting op out on broadcaster so clients make the update
		const teamId = company.get('everyoneTeamId'); 
		if (!teamId) return; // should never happen
		const channel = `team-${teamId}`;
		const message = {
			requestId: UUID(),
			user: {
				id: company.id,
				...op
			}
		};
		try {
			await this.request.api.services.broadcaster.publish(
				message,
				channel,
				{ logger: this.request }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.request.warn(`Could not publish NR-sync company update message to channel ${channel}: ${JSON.stringify(error)}`);
		}
	}
}

module.exports = IDPSync;