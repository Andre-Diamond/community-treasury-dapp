import { useWallet } from '@meshsdk/react';
import { useState } from "react";
import type { NextPage } from "next";
import Link from 'next/link'
import { useRouter } from 'next/router'
import styles from '../styles/Home.module.css'

const Home: NextPage = () => {
  const router = useRouter()

  const { connected, wallet } = useWallet();
  const [assets, setAssets] = useState<null | any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  async function getAssets() {
    if (wallet) {
      setLoading(true);
      const _assets = await wallet.getAssets();
      setAssets(_assets);
      setLoading(false);
    }
  }

  return (
    <>
    <div className={styles.main}>
      <div className={styles.body}>
        <div>
          {connected && (
            <>
              <h1>Get Wallet Assets</h1>
              {assets ? (
                <pre>
                  <code className="language-js">
                    {JSON.stringify(assets, null, 2)}
                  </code>
                </pre>
              ) : (
                <button
                  type="button"
                  onClick={() => getAssets()}
                  disabled={loading}
                  style={{
                    margin: "8px",
                    backgroundColor: loading ? "orange" : "grey",
                  }}
                >
                  Get Wallet Assets
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default Home;