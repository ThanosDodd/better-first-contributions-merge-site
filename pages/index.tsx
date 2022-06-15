import { GetStaticProps, InferGetStaticPropsType } from "next";
import type { NextPage } from "next";
import Head from "next/head";

import React, { useEffect, useState } from "react";

import {
  ApolloClient,
  createHttpLink,
  gql,
  InMemoryCache,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

import { useSession, signIn, signOut } from "next-auth/react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import styles from "../styles/Home.module.css";

//GetStaticProps Result Type
type Result = {
  node: object;
};

const Home: NextPage = ({
  queryResults,
}: InferGetStaticPropsType<typeof getStaticProps>) => {
  const [propData, setpropData] = useState<any>(queryResults);

  useEffect(() => {
    setpropData(queryResults);
  }, [propData]);

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
        if (json.results === 0) {
          alert("No Pull Requests by this user");
        } else {
          alert(json.results);
        }
      });

  const foo = [
    {
      name: "issues",
      us: propData[1].node.issues.totalCount,
      them: propData[0].node.issues.totalCount,
    },
    {
      name: "pullRequests",
      us: propData[1].node.pullRequests.totalCount,
      them: propData[0].node.pullRequests.totalCount,
    },
  ];

  const bar = [
    {
      name: "stargazers",
      us: propData[1].node.stargazers.totalCount,
      them: propData[0].node.stargazers.totalCount,
    },
    {
      name: "watchers",
      us: propData[1].node.watchers.totalCount,
      them: propData[0].node.watchers.totalCount,
    },
    {
      name: "forks",
      us: propData[1].node.forks.totalCount,
      them: propData[0].node.forks.totalCount,
    },
  ];

  const [superWidth, setSuperWidth] = useState(500);
  useEffect(() => {
    window.addEventListener("resize", () => setSuperWidth(window.innerWidth));
  }, []);

  return (
    <>
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
      {session ? <button onClick={fetcher}>Merge!</button> : " "}

      <div style={{ width: superWidth, height: "80vh" }}>
        <div className={styles.questionContainer}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={foo}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="us" fill="#8884d8" />
              <Bar dataKey="them" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>

          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={bar}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="us" fill="#8884d8" />
              <Bar dataKey="them" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
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

  const firstContr = await client.query({
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

  const firstContrBetter = await client.query({
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

  const queryResults: Result[] = [firstContr.data, firstContrBetter.data];

  return {
    props: {
      queryResults,
    },
    revalidate: 10,
  };
};
