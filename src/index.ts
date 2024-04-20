import type { configureStore, Middleware } from '@reduxjs/toolkit'
import { v4 as uuidv4 } from 'uuid';

const REDUX_ACTION_CHAIN_TYPE = '[REDUX_ACTION_CHAIN]';

const actionMap: Map<string, any> = new Map;

export const reduxActionChain: Middleware = ((store: ReturnType<typeof configureStore>) => next => (action: any) => {
    const {type, payload} = action;
    if(type !== REDUX_ACTION_CHAIN_TYPE){
        return next(action);
    }

    const {payloadInternal, actionChainId} = payload;

    const {selectors, actions, callback} = actionMap.get(actionChainId);

    const autoSelectors = {};
    Object.keys(selectors).forEach(selectorName => {
        autoSelectors[selectorName] = () => {
            const state = store.getState();
            return selectors[selectorName](state)
        }
    });

    const autoActions = {};
    Object.keys(actions).forEach(actionName => {
        autoActions[actionName] = (payload) => {
            store.dispatch(actions[actionName](payload));
        }
    })

    return callback(store, {type: actionChainId, payload: payloadInternal}, autoSelectors, autoActions);
}) as any;

export type ChainActionCallback<P> = (
    store: ReturnType<typeof configureStore>,
    action: {type: string, payload: P},
    selectors: {
        [selectorName: string]: Function
    },
    actions: {
        [actionName: string]: Function
    }
) => any

export type ChainActionProps = {
    name?: string;
    selectors?: {
        [selectorName: string]: Function
    },
    actions?: {
        [actionName: string]: Function
    }
}

export type CreateActionChain<P> = (callback: ChainActionCallback<P>, props?: ChainActionProps) => [
    (payload: P) => ({type: string, payload: {actionChainId: string, payloadInternal: P}}),
    () => boolean
]

export const createActionChain: CreateActionChain<unknown> = (callback, props = {}) => {
    const actionChainId = (props.name || '') + uuidv4();
    actionMap.set(actionChainId, {
        selectors: props.selectors || {},
        actions: props.actions || {},
        callback
    });

    return [(payload: any) => ({
        type: REDUX_ACTION_CHAIN_TYPE,
        payload: {
            actionChainId,
            payloadInternal: payload,
        }
    }), () => actionMap.delete(actionChainId)];
}