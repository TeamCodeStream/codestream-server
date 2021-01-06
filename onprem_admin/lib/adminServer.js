'use strict';

// import http from 'http';
// import socketIo from 'socket.io';
import express from 'express';
// import bodyParser from 'body-parser';
import Api from '../api';
import ServerRenderApp from '../lib/serverRenderApp';

// serves the main page with a root element and initial data
// at which point the client fires up and loads the App component.
async function displayApp(req, res) {
	try {
		// FIXME: why doesn't this work - Logger is defined!!!??
		// console.log(Object.keys(GlobalData), GlobalData.Logger);
		// GlobalData.Logger.info('displayApp req url ', req.originalUrl);
		console.log('displayApp req url ', req.originalUrl);

		// give the client something to display while the app is starting up
		const { initialAppHtml, initialState } = await ServerRenderApp(req.originalUrl);
		res.render('index', {	// render with views/index.js
			content: initialAppHtml,
			initialState
		});
	}
	catch (error) {
		console.error(`Failed to render initial content: ${error}`);
	}
}

const adminServer = express();

// --- templating engine

// ejs defaults to 'views' directory for templates
adminServer.set('view engine', 'ejs');

// --- middleware

// we shall be uploading data in json form, so let's have it nicely parsed for us
adminServer.use(express.json());
adminServer.use(express.urlencoded({ extended: true }));

// --- server routing

// admin api
adminServer.use('/api', Api);

// static files - /s/* routes are read from directory public/
adminServer.use('/s', express.static('public'));
adminServer.use('/s/jquery', express.static('node_modules/jquery/dist'));
adminServer.use('/s/bootstrap', express.static('node_modules/bootstrap/dist'));

// All possible entry points into the app (bookmark-able) call the same function
const EntryRoutes = [
	'/status',
	'/configuration/topology',
	'/configuration/general',
	'/configuration/email',
	'/configuration/integrations',
	'/configuration/history',
	'/updates',
	'/support',
	'/license',
];
EntryRoutes.forEach((route) => adminServer.get(route, (req, res) => displayApp(req, res)));

// --- Redirects

const RedirectRoutes = {
	'/': '/status',
	'/configuration': '/configuration/topology',
};
for (const [route, to] of Object.entries(RedirectRoutes)) {
	adminServer.get(route, (req, res) => res.redirect(to));
}

// --- Last resort

// uh oh!  Any other routes fail with 'bad url'
adminServer.get('*', (req, res) => res.send(`bad url: ${req.url}`));

export default adminServer;
