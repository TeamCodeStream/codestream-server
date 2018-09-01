'use strict';

const APIRequest = require(process.env.CS_API_TOP + '/lib/api_server/api_request.js');
const EscapeHtml = require('escape-html');
const DeepClone = require(process.env.CS_API_TOP + '/server_utils/deep_clone');

const RIGHT_TRIANGLE = '&#x25B6;';
const DOWN_TRIANGLE = '&#x25BC;';

class HelpRequest extends APIRequest {

	async authorize () {
		// help is always available!
	}

	async process () {
		if (!this.module.processedRoutes) {
			await this.processRoutes();
		}
		if (!this.module.processedModels) {
			await this.processModels();
		}
		if (!this.module.processedErrors) {
			await this.processErrors();
		}

		if (!this.request.params.tag) {
			await this.serveOverview();
		}
		else {
			const tag = this.request.params.tag.toLowerCase();
			if (tag === 'modules') {
				await this.serveModules();
			}
			else if (tag === 'models') {
				await this.serveModels();
			}
			else if (tag === 'errors') {
				await this.serveErrors();
			}
			else {
				await this.serveByTag(tag);
			}
		}
		this.responseIssued = true;
	}

	async serveOverview () {
		if (!this.module.overview) {
			const overview = await this.evaluateTemplate(this.module.overviewTemplate);
			this.module.overview = this.handleLinks(overview);
		}
		const html = await this.evaluateTemplate(
			this.module.masterTemplate,
			{
				'html!content': this.module.overview
			}
		);
		this.response.send(html);
	}

	async serveByTag (tag) {
		return (
			await this.serveByModule(tag) ||
            await this.serveByRoute(tag) ||
            await this.serveByModel(tag) ||
            await this.serveByError(tag) ||
            this.response.sendStatus(404)
		);
	}

	async serveByModule (tag) {
		const module = Object.keys(this.module.processedRoutes).find(moduleName => {
			return moduleName === tag;
		});
		if (module) {
			await this.serveModule(module, true);
			return true;
		}
	}

	async serveByRoute (tag) {
		let foundRoutes = [];
		Object.keys(this.module.processedRoutes).forEach(moduleName => {
			const moduleRoutes = this.module.processedRoutes[moduleName].routes;
			Object.keys(moduleRoutes).forEach(routeKey => {
				const route = moduleRoutes[routeKey];
				if (route.tag && route.tag.toLowerCase() === tag) {
					foundRoutes.push(route);
				}
			});
		});
		if (foundRoutes.length > 0) {
			await this.serveRoutes(foundRoutes, true);
			return true;
		}
	}

	async serveModule (module) {
		const moduleHtml = await this.renderModule(module);
		const html = await this.evaluateTemplate(
			this.module.masterTemplate,
			{
				'html!content': moduleHtml,
				expanded: true
			}
		);
		this.response.send(html);
	}

	async serveRoutes (routes, expanded) {
		let routesHtml = '';
		for (let route of routes) {
			const oneHtml = await this.renderRoute(route, expanded);
			routesHtml += oneHtml;
		}
		const html = await this.evaluateTemplate(
			this.module.masterTemplate,
			{
				'html!content': routesHtml,
				expanded
			}
		);
		this.response.send(html);
	}

	async serveModels () {
		let modelsHtml = '';
		const models = this.module.processedModels;
		for (let model of models) {
			const oneHtml = await this.renderModel(model);
			modelsHtml += oneHtml;
		}
		const html = await this.evaluateTemplate(
			this.module.masterTemplate,
			{
				'html!content': modelsHtml,
				expanded: false
			}
		);
		this.response.send(html);
	}

	async serveByModel (tag) {
		const model = this.module.processedModels.find(model => {
			return model.name && model.name.toLowerCase() === tag;
		});
		if (!model) { return; }
		const modelHtml = await this.renderModel(model, true);
		const html = await this.evaluateTemplate(
			this.module.masterTemplate,
			{
				'html!content': modelHtml,
				expanded: true
			}
		);
		this.response.send(html);
		return true;
	}

	async serveErrors () {
		let errorsHtml = '';
		const errors = this.module.processedErrors;
		for (let moduleErrors of errors) {
			const oneHtml = await this.renderModuleErrors(moduleErrors);
			errorsHtml += oneHtml;
		}
		const html = await this.evaluateTemplate(
			this.module.masterTemplate,
			{
				'html!content': errorsHtml,
				expanded: false
			}
		);
		this.response.send(html);
	}

	async serveByError (tag) {
		let error;
		if (!this.module.processedErrors.find(moduleErrors => {
			error = moduleErrors.errors.find(error => {
				return error.code && error.code.toLowerCase() === tag;
			});
			return error;
		})) {
			return;
		}
		const errorHtml = await this.renderError(error, true);
		const html = await this.evaluateTemplate(
			this.module.masterTemplate,
			{
				'html!content': errorHtml,
				expanded: true
			}
		);
		this.response.send(html);
		return true;
	}

	async processRoutes () {
		this.module.processedRoutes = {};
		await Promise.all(this.api.documentedRoutes.map(async route => {
			await this.processRoute(route);
		}));
	}

	async processRoute (route) {
		const routes = this.module.processedRoutes;
		routes[route.module] = routes[route.module] || {};
		routes[route.module].routes = routes[route.module].routes || {};
		routes[route.module].routes[route.route] = route;
	}

	async processModels () {
		this.module.processedModels = DeepClone(this.api.documentedModels);
		this.module.processedModels.sort((a, b) => {
			return a.name.localeCompare(b.name);
		});
		await Promise.all(this.module.processedModels.map(async model => {
			await this.processModel(model);
		}));
	}

	async processModel (model) {
		Object.keys(model.attributes).forEach(attributeName => {
			const attribute = model.attributes[attributeName];
			if (
				attribute.ignoreDescribe ||
				(
					attribute.serverOnly &&
					!attribute.forMe
				)
			) {
				delete model.attributes[attributeName];
			}
		});
	}

	async processErrors () {
		const errors = DeepClone(this.api.documentedErrors);
		this.module.processedErrors = [];
		Object.keys(errors).forEach(module => {
			this.module.processedErrors.push({
				module, 
				errors: errors[module]
			});
		});
		this.module.processedErrors.sort((a, b) => {
			return a.module.localeCompare(b.module);
		});
		await Promise.all(this.module.processedErrors.map(async moduleErrors => {
			await this.processModuleErrors(moduleErrors);
		}));
	}

	async processModuleErrors (moduleErrors) {
		moduleErrors.errors = moduleErrors.errors.filter(error => !error.internal);
		moduleErrors.errors.sort((a, b) => {
			return a.code.localeCompare(b.code);
		});
	}

	async serveModules () {
		if (!this.module.masterHtml) {
			const modulesHtml = await this.renderModules();
			this.module.masterHtml = await this.evaluateTemplate(
				this.module.masterTemplate,
				{
					'html!content': modulesHtml,
					expanded: false
				}
			);
		}
		this.response.send(this.module.masterHtml);
	}

	async renderModules () {
		let html = '';
		const modules = Object.keys(this.module.processedRoutes);
		modules.sort();
		for (let module of modules) {
			const oneHtml = await this.renderModule(module);
			html += oneHtml;
		}
		return html;
	}

	async renderModule (moduleName) {
		const module = this.module.processedRoutes[moduleName];
		if (!module.html) {
			const routesHtml = await this.renderRoutes(this.module.processedRoutes[moduleName].routes);
			module.html = await this.evaluateTemplate(
				this.module.moduleTemplate, 
				{
					module: moduleName,
					tag: moduleName,
					'html!routes': routesHtml
				}
			);
		}
		return module.html;
	}

	async renderRoutes (routes) {
		let html = '';
		for (let routeKey in routes) {
			const route = routes[routeKey];
			const oneHtml = await this.renderRoute(route);
			html += oneHtml;
		}
		return html;
	}

	async renderRoute (route, expanded) {
		if (route.htmlExpanded && expanded) {
			return route.htmlExpanded;
		}
		else if (route.htmlCompressed && !expanded) {
			return route.htmlCompressed;
		}
		const preparedRoute = await this.prepareRoute(route, expanded);
		const html = await this.evaluateTemplate(this.module.requestTemplate, preparedRoute);
		if (expanded) {
			route.htmlExpanded = html;
		}
		else {
			route.htmlCompressed = html;
		}
		return html;
	}

	async prepareRoute (route, expanded) {
		let preparedRoute = DeepClone(route);
		preparedRoute['html!description'] = this.handleLinks(preparedRoute.description);
		await this.prepareRouteStructure(preparedRoute, 'input', expanded);
		await this.prepareRouteStructure(preparedRoute, 'returns', expanded);
		await this.prepareRouteStructure(preparedRoute, 'publishes', expanded);
		preparedRoute['html!triangle'] = expanded ? DOWN_TRIANGLE : RIGHT_TRIANGLE;
		preparedRoute.showDetails = expanded ? '' : 'display:none';
		preparedRoute.showPublishes = route.publishes ? '' : 'display:none';
		if (route.errors) {
			route.errors.sort();
			preparedRoute['html!errors'] = await this.prepareErrors(route.errors, route.tag);
		}
		else {
			preparedRoute['html!errors'] = '';
		}
		return preparedRoute;
	}

	async prepareRouteStructure (route, structure) {
		if (route[structure] && typeof route[structure] === 'string') {
			route[`${structure}Summary`] = route[structure];
			route[`${structure}TriangleShow`] = 'display:none';
			route[`${structure}ClickableClass`] = '';
		}
		else if (route[structure] && typeof route[structure] === 'object') {
			route[`${structure}Summary`] = route[structure].summary;
			if (typeof route[structure].looksLike === 'object') {
				const escapedLooksLike = EscapeHtml(JSON.stringify(route[structure].looksLike, undefined, 5))
					.replace(/\n/g, '<br/>')
					.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
					.replace(/ /g, '&nbsp;')
					.replace(/&quot;&lt;/g, '< ')
					.replace(/&gt;&quot;/g, ' >')
					.replace(/&quot;\.\.\.&quot;:&nbsp;&quot;\.\.\.&quot;/g, '...')
					.replace(/&quot;\.\.\.&quot;/g, '...')
					.replace(/&quot;(.+?)\*&quot;/g, (match, name) => {
						return `&quot;${name}&quot;<span class=required>(req)</span>`;
					})
					.replace(/&quot;/g, '');
				route[`html!${structure}LooksLike`] = this.handleLinks(escapedLooksLike);
				route[`${structure}TriangleShow`] = '';
				route[`${structure}ClickableClass`] = 'clickable';
			}
		}
	}

	async prepareErrors (errors, tag) {
		let html = '';
		let sortedErrors = [];
		errors.forEach(error => {
			let foundError;
			this.module.processedErrors.find(moduleErrors => {
				foundError = moduleErrors.errors.find(moduleError => {
					return moduleError.name === error;
				});
				return foundError;
			});
			if (foundError) {
				sortedErrors.push(foundError);
			}
		});
		sortedErrors.sort((a, b) => {
			return a.code.localeCompare(b.code);
		});
		for (let error of sortedErrors) {
			const oneHtml = await this.renderErrorForRequest(error, tag);
			html += oneHtml;
		}
		return html;
	}

	async renderModel (model, expanded) {
		if (model.htmlExpanded && expanded) {
			return model.htmlExpanded;
		}
		else if (model.htmlCompressed && !expanded) {
			return model.htmlCompressed;
		}
		const attributesHtml = await this.renderAttributes(model);
		const html = await this.evaluateTemplate(
			this.module.modelTemplate, 
			{
				name: model.name,
				tag: model.name,
				summary: model.description,
				'html!attributes': attributesHtml,
				showAttributes: expanded ? '' : 'display:none',
				'html!triangle': expanded ? DOWN_TRIANGLE : RIGHT_TRIANGLE    
			}
		);
		if (expanded) {
			model.htmlExpanded = html;
		}
		else {
			model.htmlCompressed = html;
		}
		return html;
	}

	async renderAttributes (model) {
		let html = '';
		for (let attributeName in model.attributes) {
			const attribute = model.attributes[attributeName];
			const attributeHtml = await this.renderAttribute(attributeName, attribute, model.name);
			html += attributeHtml;
		}
		return html;
	}

	async renderAttribute (attributeName, attribute, modelName) {
		if (!attribute.html) {
			attribute.html = await this.evaluateTemplate(
				this.module.attributeTemplate,
				{
					tag: modelName,
					name: attributeName,
					type: attribute.type,
					'html!description': this.handleLinks(attribute.description)
				},
			);
		}
		return attribute.html;
	}

	async renderModuleErrors (moduleErrors) {
		if (!moduleErrors.html) {
			const errorsHtml = await this.renderErrors(moduleErrors.errors);
			moduleErrors.html = await this.evaluateTemplate(
				this.module.moduleErrorsTemplate, 
				{
					module: moduleErrors.module,
					tag: moduleErrors.module,
					'html!errors': errorsHtml
				}
			);
		}
		return moduleErrors.html;
	}

	async renderErrors (errors) {
		let html = '';
		for (let error of errors) {
			const oneHtml = await this.renderError(error);
			html += oneHtml;
		}
		return html;
	}

	async renderError (error, expanded) {
		if (error.htmlExpanded && expanded) {
			return error.htmlExpanded;
		}
		else if (error.htmlCompressed && !expanded) {
			return error.htmlCompressed;
		}
		const html = await this.evaluateTemplate(
			this.module.errorTemplate, 
			Object.assign({}, error, {
				tag: error.code,
				'html!triangle': expanded ? DOWN_TRIANGLE : RIGHT_TRIANGLE,
				showDescription: expanded ? '' : 'display:none'
			})
		);
		if (expanded) {
			error.htmlExpanded = html;
		}
		else {
			error.htmlCompressed = html;
		}
		return html;
	}

	async renderErrorForRequest (error, tag) {
		return await this.evaluateTemplate(
			this.module.errorForRequestTemplate,
			Object.assign({}, error, { tag })
		);
	}

	async evaluateTemplate (template, data = {}) {
		Object.keys(data).forEach(key => {
			let value = key.match(/^html!/) ? data[key] : EscapeHtml(data[key]);
			const regex = new RegExp(`{{${key}}}`, 'g');
			template = template.replace(regex, value);
		});
		return template;
	}

	handleLinks (value) {
		if (typeof value === 'string') {
			return value.replace(/@@#(.+?)#(.*?)@@/g, function(match, text, link) {
				return `<a href="/help/${link}">${text}</a>`;
			});
		}
		else if (typeof value === 'object') {
			Object.keys(value).forEach(key => {
				value[key] = this.handleLinks(value[key]);
			});
		}
	}
}

module.exports = HelpRequest;
