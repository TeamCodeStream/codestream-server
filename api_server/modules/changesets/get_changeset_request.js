// handle a GET /changesets/:id request to fetch a single changeset

'use strict';

const GetRequest = require(process.env.CS_API_TOP + '/lib/util/restful/get_request');

class GetChangesetRequest extends GetRequest {

	// describe this route for help
	static describe (module) {
		const description = GetRequest.describe(module);
		description.access = 'User must have access to the review associated with this changeset';
		description.description = 'Returns the changeset';
		description.returns.summary = 'A changeset object',
		Object.assign(description.returns.looksLike, {
			changeset: '<the fetched @@#changeset object#changeset@@>'
		});
		return description;
	}
}

module.exports = GetChangesetRequest;
