import { useRouter } from 'next/router'
import { useEffect, SetStateAction, useState } from 'react'
import { useWallet } from '@meshsdk/react';
import axios from 'axios'

function Post({ post }) {
  const router = useRouter()
  const { txId } = router.query
  const { connected, wallet } = useWallet();

  useEffect(() => {
    if (connected) {
      console.log("pid",txId)
      testDandelion();
    }
  }, [connected]);

  if (router.isFallback) {
    return <div>Loading...</div>
  }

  async function testDandelion() {
    await axios.get('https://postgrest-api.mainnet.dandelion.link')
      .then(response => {
        console.log(response.data);
      })
      .catch(error => {
        console.log(error);
      });
    await axios.get('https://postgrest-api.mainnet.dandelion.link/Asset', {
      params: {
          assetId: 'eq.\\x2b0a04a7b60132b1805b296c7fcb3b217ff14413991bf76f72663c3067696d62616c',
          select: 'decimals, policyId, name, ticker, fingerprint, assetName, url, metadataHash, logo'
          }
      }).then(response => {
          console.log( 'tx', response.data ) 
      }).catch(error => {
          console.log(error);
      });
  }

  return (
    <>
      <h2>
        Test
      </h2>
      <p>{txId}</p>
    </>
  )
}

export default Post
