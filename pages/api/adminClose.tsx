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

    //*Close Request
    async function closePullRequest(id: string) {
      const pullRequestId = id;
      const mutation = gql`
        mutation closePullRequest($input: ClosePullRequestInput!) {
          closePullRequest(input: $input) {
            pullRequest {
              closed
              closedAt
              state
              url
            }
          }
        }
      `;
      const closeRequestVariables = {
        input: {
          pullRequestId: pullRequestId,
        },
      };
      const attemptClose = await client.mutate({
        mutation: mutation,
        variables: closeRequestVariables,
      });
      if (attemptClose.data.closePullRequest.pullRequest.closed === true) {
        console.log("A Pull Request has been closed!");
      } else {
        console.log("Something went wrong, please try again");
      }
    }
    //*Merge Request
    async function mergeRequest(id: string) {
      const pullRequestId = id;
      const mutation = gql`
        mutation mergePullRequest($input: MergePullRequestInput!) {
          mergePullRequest(input: $input) {
            pullRequest {
              merged
              mergedAt
              state
              url
            }
          }
        }
      `;
      const mergeRequestVariables = {
        input: {
          pullRequestId: pullRequestId,
        },
      };
      const attemptMerge = await client.mutate({
        mutation: mutation,
        variables: mergeRequestVariables,
      });
      if (attemptMerge.data.mergePullRequest.pullRequest.merged === true) {
        console.log("Your Pull Request has been Merged!");
      } else {
        console.log("Something went wrong, please try again");
      }
    }

    //*Search for first 100 open pull requests
    const searchPullRequests = await client.query({
      query: gql`
        {
          search(
            query: "repo:ThanosDodd/better-first-contributions type:pr is:open"
            type: ISSUE
            first: 100
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
    const pullRequestsResults = searchPullRequests.data.search.edges;
    console.log("here");

    //*No pull requests - return
    if (pullRequestsResults.length === 0) {
      return "No pull requests";
    }

    type userElement = {
      node: {
        author: {
          login: string;
        };
        id: string;
      };
    };

    //*Check that there hasn't been a merged pull request from the same user
    async function checkAlreadyContributed(element: userElement) {
      const repoFilesTree = await client.query({
        query: gql`
          query RepoFiles(
            $owner: String!
            $name: String!
            $branchName: String!
          ) {
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
          owner: "ThanosDodd",
          name: "better-first-contributions",
          branchName: "main:",
        },
      });
      const repoEntries = repoFilesTree.data.repository.object.entries;
      const repoFilesFolderEntries = repoEntries.find(
        (e: any) => e.name === "Your Files My Children"
      ).object.entries;
      const refinedRepoFilesFolderEntries = repoFilesFolderEntries.map(
        (e: { name: any }) => e.name.replace(/\..+/, "")
      );
      if (
        refinedRepoFilesFolderEntries.find(
          (e: string) => e === element.node.author.login
        ) === element.node.author.login
      ) {
        closePullRequest(element.node.id);
      } else {
        userNotAlreadyContributed(element);
      }
    }

    async function userNotAlreadyContributed(element: userElement) {
      //*Find the branch name of a pull request
      const findPullRequestBranchName = await (
        await client.query({
          query: gql`
        {
          repository(
            owner: "${element.node.author.login}"
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
          query RepoFiles(
            $owner: String!
            $name: String!
            $branchName: String!
          ) {
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
          owner: element.node.author.login,
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

      //*Check that the file has the same name as the user
      const userNamedFile = refinedFilesFolderEntries.filter(
        (e: string) => e === element.node.author.login
      ).length;
      if (userNamedFile === 0) {
        closePullRequest(element.node.id);
      } else {
        checkFileSize(element);
      }

      //*Check that the file is 1 byte in size
      function checkFileSize(element: userElement) {
        const fileByteSize = filesFolderEntries.filter(
          (e: { name: string }) =>
            e.name.replace(/\..+/, "") === element.node.author.login
        )[0].object.byteSize;
        if (fileByteSize !== 1) {
          closePullRequest(element.node.id);
        } else {
          mergeRequest(element.node.id);
        }
      }
    }

    //*There are pull requests
    pullRequestsResults.array.forEach((element: userElement) => {
      checkAlreadyContributed(element);
    });
  }

  //Check that user is logged in before making an API call
  const session = await getSession({ req });
  if (session && req.method === "POST" && req.body.userName === "ThanosDodd") {
    try {
      const results = await run();

      res.status(200).json({ results: results });
    } catch (err) {
      res.status(500).json({ results: "failed to do stuff" });
    }
  }
};
