// handles the POST request to track an event on apiweb

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request.js');

const ALLOWED_EVENTS = [
	'codestream/ide_redirect displayed',
	'codestream/ide_redirect failed',
	'codestream/ide selected'
];

class WebTrackRequest extends RestfulRequest {

	constructor (options) {
		super(options);
	}

	async authorize () {
		// anyone can access this
	}

	async requireAndAllow () {
		await this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['event'],
					object:['properties']
				},
				optional: {
					string: ['nrUserId']
				}
			}
		);

		const { event } = this.request.body;
		if (!ALLOWED_EVENTS.includes(event)) {
			throw this.errorHandler.error('invalidParameter', { info: 'not a valid event' });
		}
	}

	async process () {
		await this.requireAndAllow();

		const { event, properties, nrUserId } = this.request.body;
		const options = { request: this };
		if (nrUserId) {
			options.nrUserId = nrUserId;
		}
		this.api.services.analytics.track(event, properties, options);
	}
}

module.exports = WebTrackRequest;
