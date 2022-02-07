import {
    ApolloClient,
    ApolloLink,
    InMemoryCache,
    split,
    createHttpLink
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from '@apollo/client/link/error';
import { getMainDefinition } from "@apollo/client/utilities";
import { WebSocketLink } from "@apollo/client/link/ws";

export function client({ url, headers }: { url: string, headers?: () => any | Promise<any> }) {

    const _url = url.replace(/^https?:\/\//, '');
    const _headers = headers;

    const errorLink = onError(({ graphQLErrors, networkError }) => {
        if (graphQLErrors) {
            graphQLErrors.map(({ message, locations, path }) =>
                console.log(
                    `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
                )
            );
            if (networkError) {
                console.log(`[Network error]: ${networkError}`);
            }
        }
    });

    const http = ApolloLink.from([
        setContext(async () => {
            return {
                headers: _headers ? await _headers() : {}
            };
        }),
        createHttpLink({
            uri: `https://${_url}`,
        }),
    ]);

    let link: ApolloLink;

    if (typeof window !== 'undefined') {
        const wsl = new WebSocketLink({
            uri: `wss://${_url}`,
            options: {
                reconnect: true,
                lazy: true,
                connectionParams: async () => _headers ? await _headers() : {}
            }
        });
        link = split(
            ({ query }) => {
                const definition = getMainDefinition(query);
                return (
                    definition.kind === "OperationDefinition" &&
                    definition.operation === "subscription"
                );
            },
            wsl,
            http
        );
    } else {
        link = http;
    }

    return new ApolloClient({
        link: errorLink.concat(link),
        cache: new InMemoryCache(),
    }) as any;
};





