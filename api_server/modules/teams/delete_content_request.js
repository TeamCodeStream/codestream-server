// handle the 'PUT /delete-content' request, to delete recent content ... for demo purposes

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');

const WHITELISTED_EMAILS = [];

class DeleteContentRequest extends RestfulRequest {

	async authorize () {
        // this is a special privileged api call, available only to codestream staff and
        // other whitelisted emails as needed
        const email = this.user.get('email');
        if (
            !email.match(/@codestream\.com$/) &&
            !WHITELISTED_EMAILS.includes(email)
        ) {
            throw this.errorHandler.error('updateAuth', { reason: 'nice try' });
        }
        if (typeof this.request.body.teamId !== 'string') {
            throw this.errorHandler.error('parameterRequired', { info: 'teamId' });
        }
        const authorized = await this.user.authorizeTeam(this.request.body.teamId.toLowerCase());
        if (!authorized) {
            throw this.errorHandler.error('updateAuth', { reason: 'must be on team' });
        }
	}

	async process () {
        await this.require();
        await this.deleteContent();
	}

	// these parameters are required for the request
	async require () {
        if (this.request.body.newerThan) {
            this.newerThan = parseInt(this.request.body.newerThan, 10);
        }
		await this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['teamId']
				},
				optional: {
                    'number': ['newerThan'],
                    'boolean': ['includeStreams']
				}
			}
		);
	}

    // delete the content for this team, we delete markers and posts
    async deleteContent () {
        await this.deleteMarkers();
        await this.deletePosts();
        await this.deleteStreams();
    }

    // delete the markers in this team, with optional time cutoff
    async deleteMarkers () {
        const query = {
            teamId: this.request.body.teamId.toLowerCase()
        };
        if (this.newerThan) {
            query.createdAt = { $gt: this.newerThan };
        }
        await this.data.markers.databaseCollection.deleteByQuery(query, { requestId: this.request.id });
    }

    // delete the posts in this team, with optional time cutoff
    async deletePosts () {
        const query = {
            teamId: this.request.body.teamId.toLowerCase()
        };
        if (this.newerThan) {
            query.createdAt = { $gt: this.newerThan };
        }
        await this.data.posts.databaseCollection.deleteByQuery(query, { requestId: this.request.id });
    }

    // optionally delete the streams in this team, with optional time cutoff
    async deleteStreams () {
        if (!this.request.body.includeStreams) {
            return;
        }
        const query = { 
            teamId: this.request.body.teamId.toLowerCase()
        };
        if (this.newerThan) {
            query.createdAt = { $gt: this.newerThan };
        }
        await this.data.streams.databaseCollection.deleteByQuery(query, { requestId: this.request.id });
    }
}

module.exports = DeleteContentRequest;
