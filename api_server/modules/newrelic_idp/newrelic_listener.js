"use strict";

const CompanyIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/companies/indexes');
const UserIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/indexes');
const UUID = require('uuid').v4;

class NewRelicListener {

	constructor (options) {
		Object.assign(this, options);
	}

	async listen () {
		const queueUrl = this.api.config.sharedGeneral.newRelicMessageQueue;
		if (!queueUrl) {
			this.api.warn('Not listening to New Relic message queue, queue url not configured');
			return;
		}

		this.api.log('Trying to listen to New Relic message queue...');
		await this.api.services.queueService.listen({
			name: 'NRMsgQueue', // when url is provided, we can use any name we want here
			url: queueUrl,
			handler: this.handleNewRelicMessage.bind(this),
			dontLogRx: true
		});
		this.api.log('Successfully listening to New Relic message queue');
	}

	async handleNewRelicMessage (message, requestId, callback) {
		if (callback) {
			callback(true); // immediately release the message
		}

		if (!message.Message) return;
		let payload;
		try {
			payload = JSON.parse(message.Message);
		} catch (ex) {
			this.api.warn('Could not parse payload from New Relic message:', ex.message);
		}

		if (!payload.data || !payload.data.target) return;
		//console.warn('RX', payload.data.type);
		switch (payload.type) {
			case "organization.update": 
				this.onOrganizationUpdate(payload);
				break;

			/*
			case "organization.create": 
				this.onOrganizationCreate(payload);
				break;
			*/
			
			case "organization.delete":
				this.onOrganizationDelete(payload);
				break;

			case "organization.destroy":
				//console.warn("ORG DESTROY", payload);
				break;

			case "user.update": 
				this.onUserUpdate(payload);
				break;

			/*
			case "user.create": 
				this.onUserCreate(payload);
				break;
			*/

			case "user.delete":
				this.onUserDelete(payload);
				break;

			default:
				//console.warn('Ignoring New Relic message of type ' + payload.type);
				break;
		}
	}

	async onOrganizationUpdate (payload) {
		// is there a name change? that's all we care about for orgs
		const { id, name } = payload.data.target;
		if (!name) return;

		// is this an org we care about?
		const company = await this.api.data.companies.getOneByQuery(
			{
				linkedNROrgId: id
			},
			{
				hint: CompanyIndexes.byLinkedNROrgId
			}
		);
		if (!company || company.name === name) {
			return;
		}

		this.api.log(`Processing a New Relic originated org name change: "${company.name}" to "${name}" for company ${company.id}`);

		// update the company with the name change
		const op = await this.api.data.companies.applyOpById(
			company.id,
			{ 
				$set: {
					name,
					modifiedAt: Date.now()
				}
			},
			{
				version: company.version
			}
		);

		// send the resulting op out on broadcaster so clients make the update
		const channel = `team-${company.everyoneTeamId}`;
		const message = {
			requestId: UUID(),
			company: {
				id: company.id,
				...op
			}
		};
		try {
			await this.api.services.broadcaster.publish(
				message,
				channel,
				{ logger: this.api }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.api.warn(`Could not publish NR-initiated company update message to channel ${channel}: ${JSON.stringify(error)}`);
		}
	}

	onOrganizationCreate (payload) {
	}

	async onOrganizationDelete (payload) {
		//console.warn('ORG DELETE!', payload);
		// is there a name change? that's all we care about for orgs
		const { organizationId } = payload.data;
		if (!organizationId) return;

		// is this an org we care about?
		const company = await this.api.data.companies.getOneByQuery(
			{
				linkedNROrgId: organizationId
			},
			{
				hint: CompanyIndexes.byLinkedNROrgId
			}
		);
		if (!company) {
			return;
		}

		this.api.log(`Processing a New Relic originated org deletion for company ${company.id}`);

		/* Not receiving these messages, so can't test this code reliably
		return new DeleteCompanyHelper({
			api: this.api,
			data: this.api.data,
			transforms: {}
		}).deleteCompany(company);
		*/
	}

	onUserCreate (payload) {
	}

	async onUserUpdate (payload) {
		// we care about name and email changes here, nothing else
		const { organizationId } = payload.data;
		const { id, name, email } = payload.data.target;
		const nrUserId = parseInt(id, 10);
		if (
			!organizationId ||
			!nrUserId ||
			isNaN(nrUserId) ||
			(
				!name &&
				!email
			)
		) {
			return;
		}
		if (email && email.match(/codestream\.com$/)) {
			//console.warn('CODESTREAM USER UPDATE:', JSON.stringify(payload, 0, 5));
		}

		// is this an org we care about?
		const company = await this.api.data.companies.getOneByQuery(
			{
				linkedNROrgId: organizationId
			},
			{
				hint: CompanyIndexes.byLinkedNROrgId
			}
		);
		if (!company) {
			return;
		}

		// is this a user we care about?
		const user = await this.api.data.users.getOneByQuery(
			{
				nrUserId: nrUserId,
				teamIds: company.everyoneTeamId
			},
			{
				hint: UserIndexes.byNRUserId
			}
		);
		if (!user) return;
		const nameChanging = name && name !== user.fullName;
		const emailChanging = email && email !== user.email;
		if (!nameChanging && !emailChanging) return;
		this.api.log(`Processing a New Relic originated user change for user ${user.id}`);

		// update the user with the name and/or email change
		const op = await this.api.data.users.applyOpById(
			user.id,
			{
				$set: {
					fullName: name,
					email,
					searchableEmail: email.toLowerCase(),
					modifiedAt: Date.now()
				}
			},
			{ 
				version: user.version
			}
		);
		delete op.$set.searchableEmail;

		// send the resulting op out on broadcaster so clients make the update
		const channel = `team-${company.everyoneTeamId}`;
		const message = {
			requestId: UUID(),
			user: {
				id: user.id,
				...op
			}
		};
		try {
			await this.api.services.broadcaster.publish(
				message,
				channel,
				{ logger: this.api }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.api.warn(`Could not publish NR-initiated user update message to channel ${channel}: ${JSON.stringify(error)}`);
		}
	}

	async onUserDelete (payload) {
		const { organizationId } = payload.data;
		const { id  } = payload.data.target;
		const nrUserId = parseInt(id, 10);
		if (
			!organizationId ||
			!nrUserId ||
			isNaN(nrUserId)
		) {
			return;
		}

		// is this an org we care about?
		const company = await this.api.data.companies.getOneByQuery(
			{
				linkedNROrgId: organizationId
			},
			{
				hint: CompanyIndexes.byLinkedNROrgId
			}
		);
		if (!company) {
			return;
		}

		// is this a user we care about?
		const user = await this.api.data.users.getOneByQuery(
			{
				nrUserId: nrUserId,
				teamIds: company.everyoneTeamId
			},
			{
				hint: UserIndexes.byNRUserId
			}
		);
		if (!user) {
			return;
		}

		this.api.log(`Processing a New Relic originated user deletion, user ${user.id}`);

		// update the user with the deactivation
		const emailParts = user.email.split('@');
		const now = Date.now();
		const deactivatedEmail = `${emailParts[0]}-deactivated${now}@${emailParts[1]}`;		
		const op = await this.api.data.users.applyOpById(
			user.id,
			{
				$set: {
					deactivated: true,
					email: deactivatedEmail,
					searchableEmail: deactivatedEmail.toLowerCase(),
					modifiedAt: now
				}
			},
			{ 
				version: user.version
			}
		);
		delete op.$set.searchableEmail;

		// send the resulting op out on broadcaster so clients make the update
		const channel = `team-${company.everyoneTeamId}`;
		const message = {
			requestId: UUID(),
			user: {
				id: user.id,
				...op
			}
		};
		try {
			await this.api.services.broadcaster.publish(
				message,
				channel,
				{ logger: this.api }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.api.warn(`Could not publish NR-initiated user deletion message to channel ${channel}: ${JSON.stringify(error)}`);
		}
	}
}

module.exports = NewRelicListener;