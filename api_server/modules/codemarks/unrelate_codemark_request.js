'use strict';

const RelateCodemarkRequest = require('./relate_codemark_request');

class UnrelateCodemarkRequest extends RelateCodemarkRequest {

	constructor (options) {
		super(options);
		this.unrelating = true;
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'unrelate-codemark',
			summary: 'Unrelate two related codemarks',
			access: 'Codemarks must be from the same team, and the user must be a member of the team.',
			description: 'Unrelate two related codemarks. The relationship is bi-directional, and will be removed in both directions.',
			input: 'Specify each codemark ID in the request path, the order is irrelevant',
			returns: 'A codemarks array, with directives indicating how to update the codemarks',
			publishes: 'The response data will be published on the team channel for the team that owns the codemarks',
			errors: [
				'updateAuth',
				'notFound'
			]
		};
	}
}

module.exports = UnrelateCodemarkRequest;
