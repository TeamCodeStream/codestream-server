'use strict';

import express from 'express';
import { v4 as uuid } from 'uuid';
import session from 'express-session';
import connectMongo from 'connect-mongo';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';

import Api from '../api';
import ServerRenderApp from '../lib/serverRenderApp';
import { Logger, MongoClient, AdminConfig } from '../config/globalData';
import adminAccess from './adminAccess';

// use mongo for storing express-session data in the 'sessions' collection
const MongoStore = connectMongo(session);

// serves the SPA along with initial data (redux Store) using a root element
// inside a server-side rendering. The initial state will be devoid of sensitive
// data if the user fetching the page is not authorized at which point the app
// will render the Login component.
async function displayApp(req, res) {
	try {
		Logger.log(`displayApp req url ${req.originalUrl}, isAuthenticated: ${req.isAuthenticated()}`);
		// give the client an initial rendering to display while the app is starting up
		const { initialAppHtml, initialState } = await ServerRenderApp(req);
		res.render('index', {	// render with views/index.ejs
			content: initialAppHtml,
			initialState
		});
	}
	catch (error) {
		Logger.error(`Failed to render initial content: ${error}`);
	}
}

// block all requsets which do not match the whitelist if user is not authenticated
const authenticationMiddleware = (whiteList) => (req, res, next) => {
	if (whiteList.find(route => req.originalUrl.startsWith(route))) {
		return next();
	}
	if (req.isAuthenticated()) {
		return next();
	}
	res.status(401).send(`Not authorized`);
};

// We have to create the express app at runtime (not during import) since the session
// store requires an active mongo connection.
export default async function () {
	// the AdminAccess object provides a means to store & retrieve user data
	// and hash & validate passwords.
	const AdminAccess = new adminAccess(MongoClient, { logger: Logger });

	// given the provided login data, the LocalStrategy object does the work
	// of finding the matching user object and validating the login attempt
	passport.use(
		new LocalStrategy({ usernameField: 'id' }, async (id, password, done) => {
			Logger.log(`inside local strategy callback. id:${id}, password:${password}`);
			let user;
			try {
				user = await AdminAccess.retrieve({ id });
			} catch (error) {
				const msg = `retrieve user id ${id} failed with ${error}`;
				Logger.error(msg);
				return done(null, false, { message: msg });
			}
			if (!user) {
				return done(null, false, { message: `User ${id} not found` });
			}
			if (AdminAccess.validate(user, password)) {
				Logger.log(`user ${id} logged in successfully`);
				return done(null, user);
			}
			Logger.log(`user ${id} login failed`);
			return done(null, false, { message: `bad credentials. login failed` });
			// axios.get(`http://localhost:5000/users?email=${email}`)
			// 	.then(res => {
			// 		const user = res.data[0]
			// 		if (!user) {
			// 			// the 3rd arg is passed to the authenticate() call back if we fail to auth
			// 			return done(null, false, { message: 'User does not exist\n' });
			// 		}
			// 		if (!bcrypt.compareSync(password, user.password)) {
			// 			// the 3rd arg is passed to the authenticate() call back if we fail to auth
			// 			return done(null, false, { message: 'Bad password\n' });
			// 		}
			// 		return done(null, user);
			// 	})
			// 	.catch(error => done(error));
			// ---------------------------------------------
		})
	);

	// https://stackoverflow.com/questions/27637609/understanding-passport-serialize-deserialize
	//
	// serializeUser is called by the login() function, before its callback
	//
	// serializeUser determines which attributes of the user object should be
	// stored in the session. The result of the serializeUser method is attached
	// to the session as req.session.passport.user = {}
	passport.serializeUser((user, done) => {
		// determine which prop should be saved in the session store so we can find this user later
		// Logger.log(`inside passport.serializeUser callback. saving user id to session file store here`);
		done(null, user.id);
	});

	// deserializeUser callback matches our session id to the session store and
	// retrieves our key (id) - the property of the user object stored in the
	// session store.
	//
	// The first argument of deserializeUser corresponds to the key of the user
	// object that was given to the done function above. So your whole object is
	// retrieved with help of that key. That key here is the user id (key can be any
	// key of the user object i.e. name,email etc). In deserializeUser that key is
	// matched with the in memory array / database or any data resource. The fetched
	// object is attached to the request object as req.user
	passport.deserializeUser(async (id, done) => {
		// find and proceed with the user object found by using the key (id)
		// Logger.log(`inside passport.deserializeUser(). The key stored in the session file is id=${id}`);
		try {
			const user = await AdminAccess.retrieve({ id });
			done(null, user || false);
		} catch (error) {
			done(error, false);
		}
		// axios.get(`http://localhost:5000/users/${id}`)
		// .then(res => done(null, res.data))
		// .catch(error => done(error, false));
		// ---------------------------------------------
		// const user = users[0].id === id ? users[0] : false;
		// done(null, user);
	});

	const adminServer = express();

	// --- templating engine

	// ejs defaults to 'views' directory for templates
	adminServer.set('view engine', 'ejs');

	// --- middleware (order is important)

	// parsers
	adminServer.use(express.json());
	adminServer.use(express.urlencoded({ extended: true }));

	// session management
	adminServer.use(
		session({
			genid: (req) => {
				const sessionID = uuid();
				Logger.log(`express-session middleware assigned session ID: ${sessionID}`);
				return sessionID; // use uuid's for session id's
			},
			store: new MongoStore({
				client: MongoClient,
				// ttl: 14 * 24 * 60 * 60, // = 14 days. Default
				// autoRemove: 'native', // Default
			}),
			secret: AdminConfig.getPreferredConfig().sharedSecrets.cookie,
			resave: false,
			saveUninitialized: true,
		})
	);

	// All possible entry points into the app (bookmark-able) call the same function
	// and must be declared here
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

	// authentication - must follow express-session middleware as passport sits on top of it
	adminServer.use(passport.initialize());
	adminServer.use(passport.session());
	const whiteList = ['/api/no-auth'];
	adminServer.use(authenticationMiddleware([...whiteList, ...EntryRoutes, '/']));

	// --- server routing

	// admin api
	adminServer.use('/api', Api);

	// static files - /s/* routes are read from directory public/
	adminServer.use('/s', express.static('public'));
	adminServer.use('/s/jquery', express.static('node_modules/jquery/dist'));
	adminServer.use('/s/bootstrap', express.static('node_modules/bootstrap/dist'));

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

	return adminServer;
}
