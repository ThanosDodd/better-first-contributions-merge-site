import type { NextPage } from "next";
import Head from "next/head";

import { useSession } from "next-auth/react";

import styles from "../../styles/Home.module.css";

const AdminPage: NextPage = () => {
  //NextAuth
  const { data: session } = useSession();

  //API fetcher
  const fetcher = () =>
    fetch("/api/adminClose", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({ userName: session?.user?.name }),
    })
      .then((res) => res.json())
      .then((json) => {
        alert(json.results);
      });

  return (
    <>
      <Head>
        <title>Better First Contributions Admin</title>
        <meta
          name="description"
          content="Learn how to contribute to Open Source without the fear of failure"
        />
        {/* <link rel="icon" href="/favicon.ico" /> */}
      </Head>

      {session?.user?.name === "ThanosDodd" ? (
        <button className={styles.buttonClass} onClick={() => fetcher()}>
          Do the stuff
        </button>
      ) : (
        <h1>You are not an admin</h1>
      )}
    </>
  );
};

export default AdminPage;
