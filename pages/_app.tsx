import "../styles/globals.css";
import type { AppProps } from "next/app";

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp;

//TODO Authenticate User with GitHub
//TODO Merge OR Login button
//TODO Send request to API with username
//TODO Only one pulled request per user (Can close pull request with graphql?)
//TODO Success or failure toasts
//TODO
