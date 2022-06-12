import type { NextApiRequest, NextApiResponse } from "next";

import {
  ApolloClient,
  createHttpLink,
  gql,
  InMemoryCache,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

import { getSession } from "next-auth/react";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  //Das Function
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

    //*Search for an open pull request by the logged in user
    const searchUserPullRequest = await client.query({
      query: gql`
        {
          search(
            query: "repo:ThanosDodd/better-first-contributions type:pr is:open author:${mergeAuthor}"
            type: ISSUE
            first: 1
          ) {
            issueCount
            edges {
              node {
                ... on PullRequest {
                  author {
                    login
                  }
                  id
                }
              }
            }
          }
        }
      `,
    });
    const userPullRequestResults = searchUserPullRequest.data.search.edges;

    //*No pull requests - return
    if (userPullRequestResults.length === 0) {
      return 0;
    }

    //*There is a pull request
    //*Find the user's branch name for the pull request
    const findPullRequestBranchName = await (
      await client.query({
        query: gql`
        {
          repository(
            owner: "${mergeAuthor}"
            name: "better-first-contributions"
          ) {
            refs(first: 1, refPrefix: "refs/heads/") {
              edges {
                node {
                  name
                }
              }
            }
          }
        }
      `,
      })
    ).data.repository.refs.edges[0].node.name;
    //add a colon
    const branchNameWithColon = `${findPullRequestBranchName}:`;

    //*Get the filenames
    const pullRequestFilesTree = await client.query({
      query: gql`
        query RepoFiles($owner: String!, $name: String!, $branchName: String!) {
          repository(owner: $owner, name: $name) {
            object(expression: $branchName) {
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
      variables: {
        owner: mergeAuthor,
        name: "better-first-contributions",
        branchName: branchNameWithColon,
      },
    });
    const prEntries = pullRequestFilesTree.data.repository.object.entries;
    const filesFolderEntries = prEntries.find(
      (e: any) => e.name === "Your Files My Children"
    ).object.entries;
    const refinedFilesFolderEntries = filesFolderEntries.map(
      (e: { name: any }) => e.name.replace(/\..+/, "")
    );

    //*Check that the file has the same name as the user (hasn't-> return with message, has-> continue)
    const userNamedFile = refinedFilesFolderEntries.filter(
      (e: string) => e === mergeAuthor
    ).length;
    if (userNamedFile === 0) {
      return "No user-named file found";
    }

    //TODO Check that there hasn't been a merged pull request from the same user (has-> close request, return with message, hasn't-> continue)
    //TODO Check that the file is 1 byte in size (isn't-> return with message, is-> continue)
    //TODO Merge Request
    //TODO Only latest branch will be considered - Inform the community

    return userPullRequestResults;
  }

  //Check that user is logged in before making an API call
  const session = await getSession({ req });

  if (session && req.method === "POST") {
    const userRequestingMerge = req.body.userName;

    const results = await run(userRequestingMerge);

    res.status(200).json({ results: results });
    //TODO Failure message 403 or whatever it is
  }
};
