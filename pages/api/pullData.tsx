import {
  ApolloClient,
  createHttpLink,
  gql,
  InMemoryCache,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

import type { NextApiRequest, NextApiResponse } from "next";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  async function run() {
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

    const { data } = await client.query({
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

    return data.node;
  }

  if (req.method === "POST") {
    const results = await run();

    res.status(200).json({ results: results });
  }
};
