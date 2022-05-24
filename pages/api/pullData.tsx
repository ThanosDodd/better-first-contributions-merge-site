import {
  ApolloClient,
  createHttpLink,
  gql,
  InMemoryCache,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

import type { NextApiRequest, NextApiResponse } from "next";

export default (req: NextApiRequest, res: NextApiResponse) => {
  async function run() {
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

    return data.node;
  }

  if (req.method === "POST") {
    const results = run();

    res.status(200).json({ name: "John Doe", results: results });
  }
};
