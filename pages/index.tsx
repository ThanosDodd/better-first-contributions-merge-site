import type { NextPage } from "next";
import Head from "next/head";
import { GetStaticProps } from "next";
import {
  ApolloClient,
  createHttpLink,
  gql,
  InMemoryCache,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

const Home: NextPage = (results) => {
  const returnedData = results;
  console.log(returnedData);

  return (
    <div>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div>Yes</div>
    </div>
  );
};

export default Home;

export const getStaticProps: GetStaticProps = async () => {
  //TODO Hide Token
  const changeThis = process.env.GITHUB_TOKEN;

  const httpLink = createHttpLink({
    uri: "https://api.github.com/graphql",
  });

  const authLink = setContext((_, { headers }) => {
    const token = changeThis;
    return {
      headers: {
        ...headers,
        authorization: `Bearer ${token}`,
      },
    };
  });

  const client = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
  });

  const { data } = await client.query({
    query: gql`
      {
        node(id: "MDEwOlJlcG9zaXRvcnk2ODcyMDg2Nw==") {
          ... on Repository {
            name
            id
            stargazers {
              totalCount
            }
            watchers {
              totalCount
            }
            forks {
              totalCount
            }
            issues(states: OPEN) {
              totalCount
            }
            pullRequests(states: OPEN) {
              totalCount
            }
          }
        }
      }
    `,
  });

  return {
    props: {
      data: data.node,
    },
    revalidate: 10,
  };
};
