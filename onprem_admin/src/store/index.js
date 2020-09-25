
// This module exports a store factory

import { createStore, applyMiddleware } from 'redux';
import Actions from './actions';
import Reducer from './reducers';
import thunk from 'redux-thunk';

// teaching moment...redux Middleware
// Report any general messages to the console
const consoleMessages = store => next => action => {
	console.debug('Middleware(consoleMessages): before dispatch');

	// report unknown actions
	if(! action.type.startsWith("@@redux/") && !(action.type in Actions) ) {
		console.warn(`reducer(config/apiServer): unhandled type ${action.type}`);
	}
	let result = next(action);	// dispatch the action
	console.debug('consoleMessages(after dispatch): state = ', store.getState());
	return result;
};

const StoreFactory = (initialState={}) => {
	return createStore(Reducer, initialState, applyMiddleware(thunk, consoleMessages));
	// return createStore(Reducer, initialState);
};
export default StoreFactory;
