import type { configureStore, Middleware } from '@reduxjs/toolkit'

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


type GenericFunction = (...params: any) => any;

type ActionsObject<T extends Record<string, GenericFunction>> = {
    [K in keyof T]: T[K];
}

type SelectorsObject<T extends Record<string, GenericFunction>> = {
    [K in keyof T]: T[K];
}

export type ChainActionCallback<P, S extends Record<string, GenericFunction>, A extends Record<string, GenericFunction>> = (
    store: ReturnType<typeof configureStore>,
    action: {type: string, payload: P},
    selectors: {
        [K in keyof S]: () => ReturnType<S[K]>;
    },
    actions: {
        [K in keyof A]: (...args: Parameters<A[K]>) => ReturnType<typeof configureStore>["dispatch"];
    }
) => any

export type ChainActionProps<S extends Record<string, GenericFunction>, A extends Record<string, GenericFunction>> = {
    name?: string;
    selectors?: SelectorsObject<S>
    actions?: ActionsObject<A>
}

export type CreateActionChain<P, S extends Record<string, GenericFunction>, A extends Record<string, GenericFunction>> = 
    (callback: ChainActionCallback<P, S, A>, props?: ChainActionProps<S, A>) => [
        (payload: P) => ({type: string, payload: {actionChainId: string, payloadInternal: P}}),
        () => boolean
    ]

const generateHash = (string) => {
    let hash = 0;
    if (string.length === 0) return hash;
    for (let i = 0; i < string.length; i++) {
      const chr = string.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash.toString(16);
}

let nonce = 0;

export const createActionChain = <P, S extends Record<string, GenericFunction>, A extends Record<string, GenericFunction>>(callback: ChainActionCallback<P, S, A>, props: ChainActionProps<S, A> = {} ) => {
    const actionChainId = (props.name || '') + '-' + generateHash((props.name || '') + '-' + nonce.toString(10));
    nonce++;

    actionMap.set(actionChainId, {
        selectors: props.selectors || {},
        actions: props.actions || {},
        callback
    });

    return [(payload: P) => ({
        type: REDUX_ACTION_CHAIN_TYPE,
        payload: {
            actionChainId,
            payloadInternal: payload,
        }
    }), () => actionMap.delete(actionChainId)];
}