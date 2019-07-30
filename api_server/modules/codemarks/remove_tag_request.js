'use strict';

const AddTagRequest = require('./add_tag_request');

class RemoveTagRequest extends AddTagRequest {

	constructor (options) {
		super(options);
		this.removing = true;
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'remove-tag',
			summary: 'Remove a tag from a codemark',
			access: 'User must be a member of the team that owns the codemark.',
			description: 'Remove a tag from a codemark, specified by tag ID. The tag must be a known tag for the team, according to the ID.',
			input: {
				summary: 'Specify the codemark ID in the request path, and the tag ID in the request body',
				looksLike: {
					tagId: '<ID of the tag to remove>'
				}
			},
			returns: {
				summary: 'A codemark, with directives indicating how to update the codemark',
				looksLike: {
					codemark: '<some directive>'
				}
			},
			publishes: 'The response data will be published on the team channel for the team that owns the codemarks',
			errors: [
				'updateAuth',
				'notFound'
			]
		};
	}
}

module.exports = RemoveTagRequest;
