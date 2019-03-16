// all handling for server-served web pages should be handled through here

'use strict';

const APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module.js');
const Handlebars = require('handlebars');
const Glob = require('glob-promise');
const FS = require('fs');
const Path = require('path');
const AwaitUtils = require(process.env.CS_API_TOP + '/server_utils/await_utils');

const ROUTES = [
	{
		method: 'get',
		path: 'web/finish',
		requestClass: require('./web_finish_request')
	},
	{
		method: 'get',
		path: 'web/login',
		requestClass: require('./web_login_request')
	},
	{
		method: 'get',
		path: '/web/404',
		requestClass: require('./web_404_request')
	},
	{
		method: 'post',
		path: 'web/signin',
		requestClass: require('./web_signin_request')
	},
	{
		method: 'get',
		path: 'web/slack-auth',
		requestClass: require('./web_slack_auth_request')
	},
	{
		method: 'get',
		path: 'web/slack-auth-complete',
		requestClass: require('./web_slack_auth_complete_request')
	},
	{
		method: 'get',
		path: 'web/auth-complete',
		requestClass: require('./web_auth_complete_request')
	},
	{
		method: 'get',
		path: 'web/error',
		requestClass: require('./web_error_request')
	},
	{
		method: 'get',
		path: 'c/:teamId/:id',
		requestClass: require('./link_codemark_request')
	},
	{
		method: 'get',
		path: 'p/:teamId/:id',
		requestClass: require('./link_codemark_request')
	}
];

class Web extends APIServerModule {

	getRoutes () {
		return ROUTES;
	}

	async initialize () {
		this.templates = {};

		let files;
		try {
			files = await Glob(process.env.CS_API_TOP + '/modules/web/templates/*.hbs');
		}
		catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			this.api.warn(`Unable to read web module template directory: ${message}`);
			return;
		}
		await Promise.all(files.map(async file => {
			await this.readAndCompileTemplate(file);
		}));
	}

	async readAndCompileTemplate (file) {
		let contents;
		try {
			contents = await AwaitUtils.callbackWrap(FS.readFile, file, 'utf8');
		}
		catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			this.api.warn(`Unable to read template file ${file}: ${message}`);
			return;
		}

		const name = Path.basename(file, '.hbs');
		try {
			this.templates[name] = Handlebars.compile(contents);
		}
		catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			this.api.warn(`Unable to compile template file ${file}: ${message}`);
		}
	}

	ensureTemplate (name, request) {
		const template = this.templates[name];
		if (!template) {
			this.api.warn(`Could not fulfill request, no template for ${name}`);
			request.response.send(500);
			request.responseIssued = true;
			return;
		}
		return template;
	}

	evalTemplate (request, name, data = {}) {
		const template = this.ensureTemplate(name, request);
		if (!template) return;
		const html = template(data);
		request.response.send(html);
		request.responseHandled = true;
	}
}

module.exports = Web;
