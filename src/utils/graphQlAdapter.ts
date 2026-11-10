import { ApolloClient, InMemoryCache } from '@apollo/client';

const client = new ApolloClient({
  uri: process.env.NEXT_PUBLIC_SERVER_URL ? process.env.NEXT_PUBLIC_SERVER_URL + '/api/graphql' : 'http://localhost:3000/api/graphql', // Fallback URL if the env variable is not set
  cache: new InMemoryCache(),
});

export default client;
