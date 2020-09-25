
import produce from 'immer';
import Actions from '../actions/__template';

// 'produce' creates a mutable object called 'draft' which you can consider a
// deep copy of the state. 'draft' should be modified to reflect the next state.
// The 'produce' function should not return anything. 'draft' is used as the
// next state.

// Reducers only see a 'reduced' state
export default (state=null, action) => produce(state, draft => {
	// console.debug(`reducer(__template): ${action.type}`);
	switch (action.type) {
		case Actions.__TEMPLATE_:
			return;
	}
});
