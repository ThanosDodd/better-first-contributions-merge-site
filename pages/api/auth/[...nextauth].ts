import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";

export default NextAuth({
  providers: [
    GithubProvider({
      clientId: process.env.BFC_GITHUB_ID,
      clientSecret: process.env.BFC_GITHUB_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
});
