// handle the "DELETE /provider-host" request to set a provider host for a given third-party provider

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
const ModelSaver = require(process.env.CS_API_TOP + '/lib/util/restful/model_saver');
const UserErrors = require(process.env.CS_API_TOP + '/modules/users/errors');

class DeleteProviderHostRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(UserErrors);
	}

	async authorize () {
		// user must be a member of the team
		const teamId = this.request.params.teamId.toLowerCase();
		this.team = await this.data.teams.getById(teamId);
		if (!this.team) {
			throw this.errorHandler.error('notFound', { info: 'team' });
		}
		if (!this.user.hasTeam(this.team.id)) {
			throw this.errorHandler.error('deleteAuth', { reason: 'user must be a member of the team' });
		}
	}

	// process the request
	async process () {
		// make sure we know about this provider
		const provider = this.request.params.provider.toLowerCase();
		const serviceAuth = this.api.services[`${provider}Auth`];
		if (!serviceAuth) {
			throw this.errorHandler.error('unknownProvider', { info: provider });
		}

		const now = Date.now();
		const providerId = this.request.params.providerId.toLowerCase();
		const unsetKey = `providerHosts.${provider}.${providerId}`;
		const op = {
			$set: {
				modifiedAt: now,
			},
			$unset: {
				[unsetKey]: true
			}
		};

		this.updateOp = await new ModelSaver({
			request: this,
			collection: this.data.teams,
			id: this.team.id
		}).save(op);

		this.responseData = {
			team: {
				id: this.team.id,
				_id: this.team.id,	// DEPRECATE ME
				$set: {
					modifiedAt: now
				},
				$unset: {
					[`providerHosts.${providerId}`]: true
				}
			}
		};
	}

	// handle returning the response
	async handleResponse () {
		if (this.gotError) {
			return await super.handleResponse();
		}
		this.responseData.team.$set.version = this.updateOp.$set.version;
		this.responseData.team.$version = this.updateOp.$version;
		await super.handleResponse();
	}

	// after the response is returned....
	async postProcess () {
		// send the message to the team channel
		const channel = 'team-' + this.team.id;
		const message = Object.assign({}, this.responseData, { requestId: this.request.id });
		try {
			await this.api.services.messager.publish(
				message,
				channel,
				{ request: this }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate
			this.warn(`Unable to publish provider host message to channel ${channel}: ${JSON.stringify(error)}`);
		}
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'delete-provider-host',
			summary: 'Delete the attributes for a third-party provider host for the given team',
			access: 'Only a member of the team can delete a provider host',
			description: 'For connecting to on-prem third-party integration providers, or for providers that have per-team provider settings, delete the attributes needed to connect to the third-party provider host',
			input: 'Specify the provider, team ID, and provider ID in the path.',
			returns: {
				summary: 'A team object, with directives appropriate for updating the team\'s providerHosts attribute',
				looksLike: {
					team: {
						id: '<ID of the team>',
						$set: '<$set directive to update providerHosts>',
						$unset: '<$unset directive to delete the actual provider host attributes>'
					}
				}
			},
			publishes: {
				summary: 'Publishes a team object, with directives corresponding to the request body passed in, to the team channel, indicating how the providerHosts object for the team object should be updated.',
				looksLike: {
					team: {
						id: '<ID of the team>',
						$set: '<$set directive to update providerHosts>',
						$unset: '<$unset directive to delete the actual provider host attributes>'
					}
				}
			},
			errors: [
				'notFound',
				'deleteAuth',
				'unknownProvider'
			]
		};
	}
}

module.exports = DeleteProviderHostRequest;
