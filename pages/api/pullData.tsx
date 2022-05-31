import {
  ApolloClient,
  createHttpLink,
  gql,
  InMemoryCache,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { getSession } from "next-auth/react";
import type { NextApiRequest, NextApiResponse } from "next";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  async function run(mergeAuthor: string) {
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
      // query: gql`
      //   query RepoFiles($owner: String!, $name: String!) {
      //     repository(owner: $owner, name: $name) {
      //       object(expression: "HEAD:") {
      //         ... on Tree {
      //           entries {
      //             name
      //             type
      //             object {
      //               ... on Blob {
      //                 byteSize
      //               }
      //               ... on Tree {
      //                 entries {
      //                   name
      //                   type
      //                   object {
      //                     ... on Blob {
      //                       byteSize
      //                     }
      //                   }
      //                 }
      //               }
      //             }
      //           }
      //         }
      //       }
      //     }
      //   }
      // `,
      query: gql`
        {
          search(
            query: "repo:ThanosDodd/better-first-contributions type:pr is:open author:${mergeAuthor}"
            type: ISSUE
            first: 2
          ) {
            issueCount
            edges {
              node {
                ... on PullRequest {
                  author {
                    login
                  }
                }
              }
            }
          }
        }
      `,
      // variables: { owner: "ThanosDodd", name: "better-first-contributions" },
    });

    return data;
  }

  const session = await getSession({ req });

  if (session && req.method === "POST") {
    const userRequestingMerge = req.body.userName;

    const results = await run(userRequestingMerge);

    res.status(200).json({ results: results });
  }
};
