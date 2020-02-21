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
			tag: 'remove-review-tag',
			summary: 'Remove a tag from a review',
			access: 'User must be a member of the team that owns the review.',
			description: 'Remove a tag from a review, specified by tag ID. The tag must be a known tag for the team, according to the ID.',
			input: {
				summary: 'Specify the review ID in the request path, and the tag ID in the request body',
				looksLike: {
					tagId: '<ID of the tag to remove>'
				}
			},
			returns: {
				summary: 'A review, with directives indicating how to update the review',
				looksLike: {
					review: '<some directive>'
				}
			},
			publishes: 'The response data will be published on the team channel for the team that owns the review',
			errors: [
				'updateAuth',
				'notFound'
			]
		};
	}
}

module.exports = RemoveTagRequest;
