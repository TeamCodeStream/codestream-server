'use strict';

const Errors = require('./errors');
const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request.js');
const { request, gql } = require('graphql-request');

class NRLookupExperimentRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(Errors);
	}

	async authorize () {
	}

	async process () {
		await this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['apiKey']
				},
				optional: {
					boolean: ['meInstead']
				}
			}
		);

		try {
			const baseUrl = this.api.config.sharedGeneral.newRelicApiUrl || 'https://api.newrelic.com';
			const url = baseUrl + '/graphql';
			let query;
			if (this.request.body.meInstead) {
				query = gql`{
					actor {
						user {
							email
							id
							name
						}
					}
				}`;
			} else {
				query = gql`{
					actor {
						account(id: 313870) {
							nrqlLookups {
								fileEndpoint(name: "myLookup") {
									uri
								}
							}
						}
					}
				}`;
			}
			const headers = {
				'Api-Key': this.request.body.apiKey,
				//'Content-Type': 'application/json',
				'NewRelic-Requesting-Services': 'CodeStream',
				'nerd-graph-unsafe-experimental-opt-in': 'NrqlLookups',
				'x-login-context': this.request.headers['service-gateway-login-context'],
				"X-Query-Source-Capability-Id": "CODESTREAM",
				"X-Query-Source-Component-Id": "codestream|server"
			}
			this.responseData = await request(url, query, {}, headers);
		} catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			this.warn('Caught error running GraphQL query: ' + message);
			throw this.errorHandler.error('internal', { reason: message });
		}
	}
}

module.exports = NRLookupExperimentRequest;

