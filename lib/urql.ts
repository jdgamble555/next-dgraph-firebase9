import {
    cacheExchange,
    createClient,
    dedupExchange,
    fetchExchange,
    makeOperation,
    subscriptionExchange
} from "urql";
import type { Exchange, Operation } from 'urql';
import ifetch from 'isomorphic-unfetch';
import { SubscriptionClient } from "subscriptions-transport-ws";
import { fromPromise, fromValue, map, mergeMap, pipe } from 'wonka';

export function client({ url, headers, fetch }: { url: string, headers?: () => any | Promise<any>, fetch?: any }) {

    const _url = url.replace(/^https?:\/\//, '');
    const _headers = headers;
    const _fetch = fetch || ifetch;

    // allow for async headers...
    const fetchOptionsExchange = (fn: any): Exchange => ({ forward }) => ops$ => {
        return pipe(
            ops$,
            mergeMap((operation: Operation) => {
                const result = fn(operation.context.fetchOptions);
                return pipe(
                    typeof result.then === 'function' ? fromPromise(result) : fromValue(result) as any,
                    map((fetchOptions: RequestInit | (() => RequestInit)) => {
                        return makeOperation(operation.kind, operation, {
                            ...operation.context,
                            fetchOptions
                        });
                    })
                );
            }),
            forward
        );
    };

    return createClient({
        fetch: _fetch,
        url: `https://${_url}`,
        exchanges: [
            dedupExchange,
            cacheExchange,
            fetchOptionsExchange(async (fetchOptions: any) => {
                return {
                    ...fetchOptions,
                    headers: _headers ? await _headers() : {}
                };
            }),
            subscriptionExchange({
                forwardSubscription(operation) {
                    return new SubscriptionClient(`wss://${_url}`, {
                        reconnect: true,
                        lazy: true,
                        connectionParams: async () => _headers ? await _headers() : {}
                    }).request(operation);
                },
            }),
            fetchExchange
        ]
    });
}
