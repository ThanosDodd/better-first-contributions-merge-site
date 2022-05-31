import "../styles/globals.css";
import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}

export default MyApp;

//TODO Search Pull requests under username

//TODO Only one pull request per user

//TODO Simplify Queries
//TODO Success or failure toasts
//TODO useEffect for initial repositories data

// User does his thing and makes a pull request
//TODO User goes to the website and requests a merge (something I should be able to do for multiple)
//TODO If it's his first and only request AND is mergeable -> merge (message)
//TODO If he has already contributed close the request (message)
