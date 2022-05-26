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
          repository(owner: "ThanosDodd", name: "better-first-contributions") {
            pullRequests(first: 1, states: [OPEN]) {
              nodes {
                title
                id
                number
                additions
                changedFiles
                deletions
                mergeable
                author {
                  url
                }
              }
            }
          }
        }
      `,
    });

    return data;
  }

  if (req.method === "POST") {
    console.log(req.body);

    const results = await run();

    res.status(200).json({ results: results });
  }
};
