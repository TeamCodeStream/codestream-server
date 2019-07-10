// handle the POST /codemark-link/:id request to make a permalink to an existing codemark

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
const CodemarkLinkCreator = require('./codemark_link_creator');

class CodemarkLinkRequest extends RestfulRequest {

	// authorize the request for the current user
	async authorize () {
		// get the codemark, only someone on the team can make a permalink to it
		this.codemark = await this.data.codemarks.getById(this.request.params.id);
		if (!this.codemark) {
			throw this.errorHandler.error('notFound', { info: 'codemark' });
		}
		if (!this.user.hasTeam(this.codemark.get('teamId'))) {
			throw this.errorHandler.error('readAuth');
		}
	}

	// process the request
	async process () {
		await this.requireAndAllow();	// require parameters, and filter out unknown parameters
		await this.getMarkers();		// get the markers associated with the codemark
		await this.makeLink();			// create the codemark link
	}

	// require certain parameters, and discard unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters(
			'body',
			{
				optional: {
					boolean: ['isPublic']
				}
			}
		);
	}

	// get the markers associated with this codemark
	async getMarkers () {
		if (this.codemark.get('markerIds')) {
			this.markers = await this.data.markers.getByIds(this.codemark.get('markerIds'));
		}
		else {
			this.markers = [];
		}
	}

	// create the link to the codemark
	async makeLink () {
		this.responseData.permalink = await new CodemarkLinkCreator({
			request: this,
			codemark: this.codemark,
			isPublic: this.request.body.isPublic
		}).createCodemarkLink();
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'codemark-permalink',
			summary: 'Generate a permalink referencing a codemark',
			access: 'Current user must be a member of the team that owns the codemark',
			description: 'Generates a permalink referencing a codemark pointing to code.',
			input: {
				summary: 'Specify options in the request body',
				looksLike: {
					'isPublic': '<If set, creates a public permalink that does not require authentication>'
				}
			},
			returns: {
				summary: 'Returns the permalink',
				looksLike: {
					permalink: '<URL referencing the codemark>'
				}
			},
			errors: [
				'readAuth',
				'notFound'
			]
		};
	}
}

module.exports = CodemarkLinkRequest;
