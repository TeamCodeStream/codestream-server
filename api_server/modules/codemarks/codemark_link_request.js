// handle the POST /codemark-link/:id request to make a permalink to an existing codemark

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
const CodemarkLinkCreator = require('./codemark_link_creator');
const ModelSaver = require(process.env.CS_API_TOP + '/lib/util/restful/model_saver');

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
		if (!await this.findExisting()) {	// find a possible existing codemark link for this same codemark
			await this.makeLink();		// create a new codemark link
		}
		await this.saveToCodemark();	// save the permalink to the codemark as needed
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

	// find a possible existing codemark link for this same codemark
	async findExisting () {
		const info = await new CodemarkLinkCreator({
			request: this
		}).findCodemarkLink(
			this.codemark.attributes,
			this.markers,
			this.request.body.isPublic
		);

		if (info) {
			this.responseData.permalink = info.url;
			return true;
		}
	}

	// create the link to the codemark
	async makeLink () {
		this.responseData.permalink = await new CodemarkLinkCreator({
			request: this,
			codemark: this.codemark.attributes,
			markers: this.markers,
			isPublic: this.request.body.isPublic
		}).createCodemarkLink();
	}

	// save the permalink with the codemark as needed
	async saveToCodemark () {
		// this is how we get permalinks set for legacy codemarks, before we
		// actually created a permalink for every codemark ... only applies if
		// the codemark doesn't already have a permalink, and if the permalink
		// is private
		if (this.codemark.get('permalink') || this.request.body.isPublic) {
			return;
		}

		const op = { 
			$set: {
				permalink: this.responseData.permalink,
				modifiedAt: Date.now()
			}
		};
		this.updateOp = await new ModelSaver({
			request: this.request,
			collection: this.data.codemarks,
			id: this.codemark.id
		}).save(op);
	}

	async postProcess () {
		// if the codemark was updated, send the update to the team channel
		if (!this.updateOp) {
			return;
		}
		const message = {
			codemark: this.updateOp,
			requestId: this.request.id
		};
		const channel = 'team-' + this.codemark.get('teamId');
		try {
			await this.api.services.broadcaster.publish(
				message,
				channel,
				{ request: this }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate
			this.warn(`Unable to publish codemark update message to channel ${channel}: ${JSON.stringify(error)}`);
		}
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
