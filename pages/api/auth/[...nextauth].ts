import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";

export default NextAuth({
  providers: [
    GithubProvider({
      clientId: process.env.G_HUB_ID,
      clientSecret: process.env.G_HUB_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
});
