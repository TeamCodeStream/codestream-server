// handle the POST /codemark-link request to create a new permalink to a codemark

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
const CodemarkCreator = require('./codemark_creator');

class CodemarkLinkRequest extends RestfulRequest {

	// authorize the request for the current user
	async authorize () {
		this.teamId = this.request.body.teamId;
		if (!this.teamId) {
			throw this.errorHandler.error('parameterRequired', { info: 'teamId' });
		}
		this.teamId = this.teamId.toLowerCase();
		const authorized = await this.user.authorizeTeam(this.teamId, this);
		if (!authorized) {
			throw this.errorHandler.error('createAuth', { reason: 'user not on team' });
		}
	}

	// process the request
	async process () {
		await this.requireAndAllow();		// require parameters, and filter out unknown parameters
		await this.createCodemark();		// create the codemark itself
	}

	// require certain parameters, and discard unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['teamId'],
					'array(object)': ['markers']
				},
				optional: {
					object: ['remoteCodeUrl'],
					boolean: ['isPublic']
				}
	
			}
		);
	}

	// create the codemark itself, and specify that we also want a link
	async createCodemark () {
		const origin = this.request.headers['x-cs-plugin-ide'] || '';
		const attributes = {
			type: 'link',
			teamId: this.teamId,
			markers: this.request.body.markers,
			remoteCodeUrl: this.request.body.remoteCodeUrl
		};
		this.codemark = await new CodemarkCreator({
			request: this,
			origin,
			makeLink: true,
			linkIsPublic: this.request.body.isPublic
		}).createCodemark(attributes);
	}

	/* eslint complexity: 0 */
	async handleResponse () {
		if (this.gotError) {
			return super.handleResponse();
		}

		// handle various data transforms that may have occurred as a result of creating the link-codemark,
		// adding objects to the response returned
		const { transforms, responseData } = this;

		// add the codemark created and the permalink url
		responseData.codemark = this.codemark.getSanitizedObject();
		responseData.permalink = this.transforms.permalink;

		// add any repos created for posts with codemarks and markers
		if (transforms.createdRepos && transforms.createdRepos.length > 0) {
			responseData.repos = transforms.createdRepos.map(repo => repo.getSanitizedObject());
		}

		// add any repos updated for posts with codemarks and markers, which may have brought 
		// new remotes into the fold for the repo
		if (transforms.repoUpdates && transforms.repoUpdates.length > 0) {
			responseData.repos = [
				...(responseData.repos || []),
				...transforms.repoUpdates
			];
		}

		// add any file streams created for markers
		if (transforms.createdStreamsForMarkers && transforms.createdStreamsForMarkers.length > 0) {
			responseData.streams = transforms.createdStreamsForMarkers.map(stream => stream.getSanitizedObject());
		}

		// add any markers created 
		if (transforms.createdMarkers && transforms.createdMarkers.length > 0) {
			responseData.markers = [
				...(responseData.markers || []),
				...transforms.createdMarkers.map(marker => marker.getSanitizedObject())
			];
		}

		// markers with locations will have a separate markerLocations object
		if (transforms.markerLocations && transforms.markerLocations.length > 0) {
			responseData.markerLocations = transforms.markerLocations;
		}

		await super.handleResponse();
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'codemark-link',
			summary: 'Create a permalink referencing a codemark',
			access: 'Current user must be a member of the team that owns the codemark',
			description: 'Creates a permalink referencing a codemark pointing to code, which creates a link-type codemark with its "invisible" attribute set. Returns the URL for the permalink.',
			input: {
				summary: 'Specify attributes in the body',
				looksLike: {
					'teamId*': '<ID of the @@#team#team@@>',
					'markers*': '<Array of @@#marker objects#marker@@ representing markers to be created for this codemark>',
					'remoteCodeUrl': '<Object referencing a link to the code block references by this codemark in an external provider, contains "name" and "url">',
					'isPublic': '<Indicates if the permalink should be public, requiring no authentication to view the codemark'
				}
			},
			returns: {
				summary: 'Returns the created codemark, and the url to be used as a permalink, along with any repos or streams created on the fly for the codemark',
				looksLike: {
					codemark: '<@@#codemark object#codemark@@> created',
					permalink: '<URL of the permalink>',
					markers: [
						'<@@#marker object#marker@@ > (marker objects associated with quoted markers)',
						'...'
					],
					markerLocations: '<@@#marker locations object#markerLocations@@ > (marker locations for markers associated with quoted markers)',
					streams: [
						'<@@#stream object#stream@@ > (additional streams created on-the-fly for markers)>',
						'...'
					],
					repos: [
						'<@@#repo object#repo@@ > (additional repos created on-the-fly for markers)>',
						'...'
					]
				}
			},
			errors: [
				'parameterRequired',
				'createAuth',
				'notFound'
			]
		};
	}
}

module.exports = CodemarkLinkRequest;
