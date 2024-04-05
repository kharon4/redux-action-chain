# redux-action-chain
#### Write redux sequential logic easily.

### Objectives
- Write easy sequential logic.
- Synchronous logic should remain synchronous. Should not introduce any promises or any micro event queue events. (This is the main motivation for this lib AsyncThunk is not able to accomplish this.)
- Allow inter slice dependency.
- Wrap actions with dispatch for the store (similar to `connect`).
- Wrap selectors with getState for the store (similar to `connect`).

### Usage

```JS
// configure store with middleware
import { configureStore } from "@reduxjs/toolkit";

import {reduxActionChain, createActionChain} from 'redux-action-chain';


export const store = configureStore({
    reducer: {
        [slice1Name]: slice1Reducer,
        [slice2Name]: slice2Reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(reduxActionChain)
});

// create actionChain
const [action, removeActionFromMem] = createActionChain((store, action: {type, payload}, {selector1, selector2}, {action1, action2}) => {
    // get state
    const selector1Value = selector1();
    // take actions
    action1(payload1);
    action2(payload2);

}, ?{
    name?: 'actionName', // this will later be prefixed before the action id
    selectors?: {
        selector1, // return from createSelector or a function of the form (state) => value
        selector2,
    },
    actions?: {
        action1, // actions not linked with dispatch
        action2,
    }
});


// fire action
store.dipatch(action('some payload available inside of the chain action callback'));

// remove action
removeActionFromMem(); // remove this action from mem. So the middleware will no longer be able to call this function

```
