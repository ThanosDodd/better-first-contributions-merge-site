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

    const searchUserPullRequests = await client.query({
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
    });

    const userPullRequestsResults = searchUserPullRequests.data.search.edges;

    //No Pull Requests
    if (userPullRequestsResults.length === 0) {
      return 0;
    }

    //TODO Find Branch Name
    // {
    //   repository(owner: "WrathOfThanos", name: "better-first-contributions") {
    //     refs(first: 1, refPrefix: "refs/heads/") {
    //       edges {
    //         node {
    //           name
    //         }
    //       }
    //     }
    //   }
    // }

    const searchUserPullRequestFileSize = await client.query({
      query: gql`
        query RepoFiles($owner: String!, $name: String!) {
          repository(owner: $owner, name: $name) {
            object(expression: "HEAD:") {
              ... on Tree {
                entries {
                  name
                  type
                  object {
                    ... on Blob {
                      byteSize
                    }
                    ... on Tree {
                      entries {
                        name
                        type
                        object {
                          ... on Blob {
                            byteSize
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `,
      variables: { owner: "ThanosDodd", name: "better-first-contributions" },
    });

    //One+ Pull Request
    //TODO Check that there haven't been any merged pull requests from the same user (are-> close all requests, return with message, aren't-> continue)
    //TODO Check that the file has the same name as the user (has-> return with message, hasn't-> continue)
    //TODO Check that hte file is 1 byte in size (is-> return with message, isn't-> continue)
    //TODO Merge Request
    //TODO Close all subsequent Pull Requests (Inform the community)

    return userPullRequestsResults;
  }

  const session = await getSession({ req });

  if (session && req.method === "POST") {
    const userRequestingMerge = req.body.userName;

    const results = await run(userRequestingMerge);

    res.status(200).json({ results: results });

    //TODO Failure message
  }
};
