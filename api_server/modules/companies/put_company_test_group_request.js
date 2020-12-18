// handle the "PUT /company-test-group" request to update the test group for a company
// for one or more given keys

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');

const MAX_KEYS = 200;

class CompanyTestGroupRequest extends RestfulRequest {

	async authorize () {
		const companyId = this.request.params.id.toLowerCase();
		this.company = await this.data.companies.getById(companyId);
		if (!this.company) {
			throw this.errorHandler.error('notFound', { info: 'company' });
		}

		// user must be a member of the company
		if (!this.user.hasCompany(companyId)) {
			throw this.errorHandler.error('updateAuth', { reason: 'user must be a member of the company' });
		}

	}

	// process the request...
	async process () {
		if (Object.keys(this.request.body).length > MAX_KEYS) {
			throw this.errorHandler.error('invalidParameter', { reason: 'too many keys' });
		}

		const op = { $set: { } };
		op.$set.modifiedAt = Date.now();
		Object.keys(this.request.body).forEach(key => {
			op.$set[`testGroups.${key}`] = this.request.body[key];
		});
		this.updateOp = await new ModelSaver({
			request: this,
			collection: this.data.companies,
			id: this.company.id
		}).save(op);
	}

	// handle returning the response
	async handleResponse () {
		if (this.gotError) {
			return await super.handleResponse();
		}
		this.responseData = { company: this.updateOp };
		await super.handleResponse();
	}

	// after the response is returned....
	async postProcess () {
		// send the message to the team channel for every team in the company
		await Promise.all((this.company.get('teamIds') || []).map(async teamId => {
			const channel = `team-${teamId}`;
			const message = Object.assign({}, this.responseData, { requestId: this.request.id });
			try {
				await this.api.services.broadcaster.publish(
					message,
					channel,
					{ request: this }
				);
			}
			catch (error) {
				// this doesn't break the chain, but it is unfortunate
				this.warn(`Unable to publish company message to channel ${channel}: ${JSON.stringify(error)}`);
			}
		}));
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'company-test-group',
			summary: 'Update a one oe more test groups for a company',
			access: 'User must be a member of the company',
			description: 'Test group assignment is determined randomly by the client, then saved using this call. One or more test groups can be given as keys in the request body.',
			input: 'Specify a hash of test names to the test assignments in the request body.',
			returns: {
				summary: 'A company object, with directive appropriate for updating the company\'s testGroups attribute',
				looksLike: {
					team: {
						id: '<ID of the company>',
						testGroups: {
							'<test group name>': '<some directive>',
							'...': '...'
						}
					}
				}
			},
			publishes: {
				summary: 'Publishes the response data to the team channel for all teams in the company.',
				looksLike: {
					team: {
						id: '<ID of the company>',
						settings: {
							'<test group name>': '<some directive>',
							'...': '...'
						}
					}
				}
			},
			errors: [
				'invalidParameter',
				'notFound'
			]
		};
	}
}

module.exports = CompanyTestGroupRequest;
