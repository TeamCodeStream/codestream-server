'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import setupSocketClientHandler from './lib/socketIOClient';

import StringifySortReplacer from '../../shared/server_utils/stringify_sort_replacer';
import StoreFactory from './store';
import Actions from './store/actions';
import App from './components/App';


// see lib/serverRenderApp.js for initialization of the state.
const Store = StoreFactory({
	...window.__PRELOADED_STATE__,
	// for reverting unsaved changes to the config
	originalConfig: Object.assign({}, window.__PRELOADED_STATE__.config),
});
delete window.__PRELOADED_STATE__;

// convenient during development
window._Store = Store;

// On each event, compare the config to the originalConfig to determine if it
// has changed, at which point we can inform the user. There is a flaw in this
// algorythm in that some properties may not exist (value of null) and have an
// effective equivilent to false, for example, so if the user enables it (sets
// it to true), then disables it (sets it to false), the new value (false) will
// not equal the original config's value (null) so it will think there are
// unsaved changes even though, effectively, there really aren't.
Store.subscribe(() => {
	const { config, originalConfig, status } = Store.getState();
	const configJson = JSON.stringify(config, StringifySortReplacer, 2);
	const originalConfigJson = JSON.stringify(originalConfig, StringifySortReplacer, 2);
	const configUpdated = (configJson !== originalConfigJson);
	// console.debug('configJson: ', configJson);
	// console.debug('originalConfigJson:', originalConfigJson);
	console.debug(`updateConfig: configUpdated = ${configUpdated}, unsavedChanges = ${status.unsavedChanges}`);
	if (status.unsavedChanges === null) {
		console.debug('dispatching Actions.STATUS_SET_UNSAVED_CHANGES:', configUpdated);
		Store.dispatch({ type: Actions.STATUS_SET_UNSAVED_CHANGES, payload: configUpdated });
	}
	else if (configUpdated && !status.unsavedChanges) {
		console.debug('dispatching Actions.STATUS_SET_UNSAVED_CHANGES: true');
		Store.dispatch({ type: Actions.STATUS_SET_UNSAVED_CHANGES, payload: true });
	}
	else if (!configUpdated && status.unsavedChanges) {
		console.debug('dispatching Actions.STATUS_SET_UNSAVED_CHANGES: false');
		Store.dispatch({ type: Actions.STATUS_SET_UNSAVED_CHANGES, payload: false });
	}
});


// each client creates a socketIO connection to the admin server and receives
// regular updates of the system status as a heart beat
const socket = setupSocketClientHandler(Store);

// https://stackoverflow.com/questions/46865880/react-16-warning-expected-server-html-to-contain-a-matching-div-in-div-due
// console.log(`module.hot: ${module.hot}`);
// const renderMethod = module.hot ? ReactDOM.render : ReactDOM.hydrate;
ReactDOM.render(
	<Provider store={Store}>
		<App socket={socket} />
	</Provider>,
	document.getElementById('root')
);

// create-react-app has this guy - makes the app a little more modern and
// compatible with mobile devices ??
// registerServiceWorker();
