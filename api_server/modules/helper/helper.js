'use strict';

const APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module');
const HelpRequest = require('./help_request');
const FS = require('fs');
const Path = require('path');

const ROUTES = [
	{
		method: 'get',
		path: 'help',
		requestClass: HelpRequest
	},
	{
		method: 'get',
		path: 'help/:tag',
		requestClass: HelpRequest
	}
];

class Helper extends APIServerModule {

	getRoutes () {
		return ROUTES;
	}

	initialize () {
		const root = process.env.CS_API_TOP + '/modules/helper';
		[
			'request',
			'module',
			'model',
			'attribute',
			'error',
			'errorForRequest',
			'moduleErrors',
			'master',
			'overview'
		].forEach(type => {
			let path = Path.join(root, `/${type}.html`);
			this[`${type}Template`] = FS.readFileSync(path, { encoding: 'utf8' });
		});
	}
}

module.exports = Helper;
