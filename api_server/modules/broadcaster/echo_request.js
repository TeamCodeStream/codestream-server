// handle the GET /echo request to do a test of the real-time broadcast system

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request');

class EchoRequest extends RestfulRequest {

	// authorize the request for the current user
	async authorize () {
		// no authorization necessary, applies to current authenticated user
	}

	async process () {
		// send the echo through the broadcaster
	}

	// describe this route for help
	static describe (module) {
		const description = DeleteRequest.describe(module);
		description.access = 'Must be the creator of the codemark, or an admin';
		description.returns = {
			summary: 'Returns the codemark with a directive to set deactivated flag to true, as well as any associated post or markers',
			looksLike: {
				codemark: {
					id: '<ID of the codemark>',
					$set: {
						deactivated: true
					}
				},
				post: {
					id: '<ID of associated post>',
					$set: {
						deactivated: true
					}
				},
				markers: [{
					id: '<ID of associated marker>',
					$set: {
						deactivated: true
					}
				}]
			}
		};
		description.publishes = 'Same as response, published to the stream that owns the codemark, or the team if third-party provider is used';
		description.errors.push('alreadyDeleted');
		return description;
	}
}

module.exports = DeleteCodemarkRequest;
