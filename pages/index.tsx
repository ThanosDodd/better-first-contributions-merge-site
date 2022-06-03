import { GetStaticProps, InferGetStaticPropsType } from "next";
import type { NextPage } from "next";
import Head from "next/head";

import {
  ApolloClient,
  createHttpLink,
  gql,
  InMemoryCache,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

import { useSession, signIn, signOut } from "next-auth/react";

//GetStaticProps Result Type
type Result = {
  node: object;
};

const Home: NextPage = ({
  queryResults,
}: InferGetStaticPropsType<typeof getStaticProps>) => {
  //TODO useEffect for getStaticProps
  const returnedData = queryResults;
  console.log("Got Static Props");

  //NextAuth
  const { data: session } = useSession();

  //API fetcher
  const fetcher = () =>
    fetch("/api/pullData", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({ userName: session?.user?.name }),
    })
      .then((res) => res.json())
      .then((json) => {
        //No Pull Requests
        if (json.results === 0) {
          alert("Empty");
        }

        console.log("json results");
      });

  return (
    <div>
      <Head>
        <title>Better First Contributions</title>
        <meta
          name="description"
          content="Learn how to contribute to Open Source without the fear of failure"
        />
        {/* <link rel="icon" href="/favicon.ico" /> */}
      </Head>

      {session ? (
        <button onClick={() => signOut()}>Sign Out</button>
      ) : (
        <button onClick={() => signIn()}>Sign In</button>
      )}

      {session ? <button onClick={fetcher}>Merge!</button> : <div></div>}

      <div>Yes</div>
    </div>
  );
};

export default Home;

//GetStaticProps
export const getStaticProps: GetStaticProps = async () => {
  const authToken = process.env.GITHUB_TOKEN;

  const httpLink = createHttpLink({
    uri: "https://api.github.com/graphql",
  });

  const authLink = setContext((_, { headers }) => {
    const token = authToken;
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

  const badData = await client.query({
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

  const goodData = await client.query({
    query: gql`
      {
        node(id: "R_kgDOHZB9Vg") {
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

  const queryResults: Result[] = [badData.data, goodData.data];

  return {
    props: {
      queryResults,
    },
    revalidate: 10,
  };
};
