import produce from 'immer';
import Actions from '../actions/installation';

export default (state = null, action) =>
	produce(state, (draft) => {
		// console.debug(`reducer(installation): ${action.type}`);
		switch (action.type) {
		}
	});
