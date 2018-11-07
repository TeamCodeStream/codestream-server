// handle a GET /streams/:id request to fetch a single stream

'use strict';

const GetRequest = require(process.env.CS_API_TOP + '/lib/util/restful/get_request');

class GetStreamRequest extends GetRequest {

	// authorize this request
	async authorize () {
		// for public streams, users who are on the team but are not members of the stream
		// can still fetch the stream
		const stream = await this.data.streams.getById(this.request.params.id.toLowerCase());
		if (!stream) {
			throw this.errorHandler.error('notFound', { info: 'stream' });
		}
		if (stream.get('privacy') === 'public' && this.user.hasTeam(stream.get('teamId'))) {
			return true;
		}
		return await super.authorize();
	}

	// handle the response to the request
	async handleResponse () {
		if (this.gotError) {
			return await super.handleResponse();
		}

		// if the user preferences indicate the stream is closed for them, then add an isClosed flag
		const closedStreams = (this.user.get('preferences') || {}).closedStreams || {};
		if (closedStreams[this.model.id]) {
			this.responseData.stream.isClosed = true;
		}
		super.handleResponse();
	}

	// describe this route for help
	static describe (module) {
		const description = GetRequest.describe(module);
		description.access = 'For streams public to a team, current user must be a member of the team; otherwise for private streams, user must be a member of the stream';
		return description;
	}
}

module.exports = GetStreamRequest;
