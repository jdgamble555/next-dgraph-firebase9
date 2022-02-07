import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { getToken } from '../lib/firebase';

// apollo client
//import { ApolloProvider } from '@apollo/client';
//import { client } from '../lib/apollo';

// urql client
import { client } from '../lib/urql';
import { Provider } from 'urql';


function MyApp({ Component, pageProps }: AppProps) {

  // urql version
  const urql = client({
    url: process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT as string,
    headers: async () => ({ "X-Auth-Token": await getToken() }),
  });

  return <Provider value={urql}><Component {...pageProps} /></Provider>

  // apollo version
  /*const apollo = client({
    url: process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT as string,
    headers: async () => ({ "X-Auth-Token": await getToken() }),
  });

  return <ApolloProvider client={apollo}><Component {...pageProps} /></ApolloProvider>;*/

}

export default MyApp
