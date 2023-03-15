'use strict';

const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');
const TeamSubscriptionGranter = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/teams/team_subscription_granter');
const UUID = require('uuid').v4;

class DeleteCompanyHelper {

	constructor (options) {
		Object.assign(this, options);
		if (this.request) {
			['data', 'api', 'errorHandler', 'user', 'transforms'].forEach(x => this[x] = this.request[x]);
		} else {
			this.transforms = {};
		}
		if (this.transactionContext && !this.request) {
			throw new Error('cannot delete company in transaction contact without a request');
		}
	}

	// delete a company and perform associated operations
	async deleteCompany (company) {
		// we always work directly with attributes since this helper needs to be able to operate
		// outside of model context
		this.company = (company.attributes || company);

		await this.deactivateCompany();
		await this.deactivateEveryoneTeam();
		await this.deactivateMembers();
		if (!this.waitToPublishAndRevoke) {
			await this.publishAndRevoke();
		}
	}

	// deactivate the company itself
	async deactivateCompany () {
		const now = Date.now();
		const name = `${this.company.name}-deactivated${now}`;
		const op = {
			$set: {
				deactivated: true,
				name,
				modifiedAt: now
			}
		};
		this.transforms.deleteCompanyOp = await this.applyOp(this.data.companies, this.company, op);
	}

	// deactivate the company's everyone team
	async deactivateEveryoneTeam () {
		if (!this.everyoneTeam) {
			const everyoneTeamId = this.company.everyoneTeamId;
			if (!everyoneTeamId) {
				throw new Error(`no everyoneTeamId for company ${this.company.id}`);
			}
			this.everyoneTeam = await this.data.teams.getById(everyoneTeamId);
			if (!this.everyoneTeam) {
				throw new Error(`no everyone team for company ${this.company.id}`);
			}
		}

		// we always work directly with attributes since this helper needs to be able to operate
		// outside of model context
		this.everyoneTeam = this.everyoneTeam.attributes || this.everyoneTeam;

		const now = Date.now();
		const name = `Everyone-deactivated${now}`;
		const op = {
			$set: {
				deactivated: true,
				name,
				modifiedAt: now
			}
		};
		this.transforms.deleteTeamOp = await this.applyOp(this.data.teams, this.everyoneTeam, op);
	}

	// deactivate all memers of the everyone team
	// note that under one-user-per-org, we no longer need to concern ourselves with users who are in
	// multiple orgs
	async deactivateMembers () {
		const memberIds = this.everyoneTeam.memberIds || [];
		let teamUsers = await this.data.users.getByIds(memberIds);

		// we always work directly with attributes since this helper needs to be able to operate
		// outside of model context
		teamUsers = teamUsers.map(user => user.attributes || user);
		this.usersToDeactivate = teamUsers.filter(user => !user.deactivated);
		if (this.usersToDeactivate.length === 0) {
			return;
		}
		this.transforms.deletedUserOps = await Promise.all(this.usersToDeactivate.map(async userToDeactivate => {
			return await this.deactivateUser(userToDeactivate);
		}));
	}

	// deactivate a single user
	async deactivateUser (user) {
		const now = Date.now();
		const emailParts = user.email.split('@');
		const email = `${emailParts[0]}-deactivated${now}@${emailParts[1]}`;
		const op = {
			$set: {
				deactivated: true,
				email,
				searchableEmail: email.toLowerCase(),
				modifiedAt: now
			},
			$unset: {
				passwordEncryptedTemp: true
			}
		};
		return this.applyOp(this.data.users, user, op);
	}

	async publishAndRevoke () {
		await this.publishDeletionToUsers();
		await this.revokeUserMessagingPermissions();
	}

	// publish the deletion to the broadcaster channel for any users that have been deactivated,
	// this will be the last message they hear!
	async publishDeletionToUsers () {
		if (!this.transforms.deletedUserOps) {
			return;
		}

		await Promise.all(this.transforms.deletedUserOps.map(async deletedUserOp => {
			await this.publishDeletionToUser(deletedUserOp);
		}));
	}

	// publish the deletion to the broadcaster channel for any user that has been deactivated,
	// this will be the last message they hear!
	async publishDeletionToUser (deletedUserOp) {
		const channel = 'user-' + deletedUserOp.id;
		const requestId = this.request ? this.request.request.id : UUID();
		const message = Object.assign({}, { user: deletedUserOp }, { requestId });
		delete message.user.$set.searchableEmail;
		try {
			await this.api.services.broadcaster.publish(
				message,
				channel,
				{ request: this }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.warn(`Could not publish user deletiong message to user ${userToDelete.id}: ${JSON.stringify(error)}`);
		}
	}

	// revoke permissions to the users removed from the team to subscribe to the team channel
	async revokeUserMessagingPermissions () {
		if (!this.usersToDeactivate || this.usersToDeactivate.length === 0) {
			return;
		}

		const granterOptions = {
			data: this.data,
			broadcaster: this.api.services.broadcaster,
			team: this.everyoneTeam,
			members: this.usersToDeactivate,
			request: this.request,
			revoke: true
		};

		try {
			await new TeamSubscriptionGranter(granterOptions).grantToMembers();
		}
		catch (error) {
			throw this.errorHandler.error('teamMessagingGrant', { reason: error });
		}
	}

	async applyOp (collection, object, op) {
		// what we do here depends on whether we are within a transaction context or not
		// in transaction context, use the ModelSaver from the restful support library,
		// otherwise apply the op directly, albeit with version safety included
		if (this.transactionContext) {
			return new ModelSaver({
				request: this.request,
				collection,
				id: object.id
			}).save(op);
		} else {
			return collection.applyOpById(object.id, op, { version: object.version });
		}
	}
}

module.exports = DeleteCompanyHelper;
