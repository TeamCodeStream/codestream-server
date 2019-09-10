'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');
const Partials = require('./partials');

class WebRequestBase extends RestfulRequest {
	constructor(options) {
		super(options);
	}

	async render(templateName, viewModel) {
		if (!templateName) throw 'templateName is required';

		viewModel = viewModel || {};
		const partials = new Partials(this.data);

		this.module.evalTemplate(this, templateName, Object.assign(viewModel, {
			partial_menu_model: await partials.getMenu(this.user, viewModel.teamName),
			partial_html_head_model: {
				version: this.module.versionInfo()
			}
		}));
	}
}

module.exports = WebRequestBase;