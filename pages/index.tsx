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

  const [messageToUser, setmessageToUser] = useState("");
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
        setmessageToUser(json.results);
        alert(json.results);
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

  return (
    <>
      <Head>
        <title>Better First Contributions</title>
        <meta
          name="description"
          content="Learn how to contribute to Open Source without the fear of failure"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <a
        href="https://github.com/ThanosDodd/better-first-contributions"
        target="_blank"
        rel="noreferrer"
      >
        <img src="/github.svg" className={styles.gitHub}></img>
      </a>

      <h1>
        Merge your own{" "}
        <a
          href="https://github.com/ThanosDodd/better-first-contributions"
          target="_blank"
          rel="noreferrer"
        >
          {" "}
          better-first-contributions{" "}
        </a>
        pull request
      </h1>

      {session ? (
        <button className={styles.buttonClass} onClick={() => signOut()}>
          Sign Out
        </button>
      ) : (
        <button className={styles.buttonClass} onClick={() => signIn()}>
          Sign In
        </button>
      )}
      {session ? (
        <button
          className={`${styles.buttonClass} ${styles.buttonMerge}`}
          onClick={fetcher}
        >
          Merge!
        </button>
      ) : (
        " "
      )}

      <h2>{messageToUser.replace(/(?<= - ).+/, "").replace(/ - /, "")}</h2>
      <h3>{messageToUser.replace(/.+(?= - )/, "").replace(/ - /, "")}</h3>

      <h1>Where we excel</h1>
      <ResponsiveContainer width="90%" aspect={3}>
        <BarChart
          style={{ fontFamily: "monospace" }}
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
          <Tooltip
            cursor={{ stroke: "red", strokeWidth: 7, fill: "#70ffffe3" }}
          />
          <Legend />
          <Bar dataKey="us" fill="#ff5bb0" />
          <Bar dataKey="them" fill="#9a460aab" />
        </BarChart>
      </ResponsiveContainer>

      <h1 style={{ marginTop: "4%" }}>Where we go</h1>
      <ResponsiveContainer width="90%" aspect={3}>
        <BarChart
          style={{ fontFamily: "monospace" }}
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
          <Tooltip
            cursor={{ stroke: "red", strokeWidth: 7, fill: "#70ffffe3" }}
          />
          <Legend />
          <Bar dataKey="us" fill="#ff5bb0" />
          <Bar dataKey="them" fill="#9a460aab" />
        </BarChart>
      </ResponsiveContainer>
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
