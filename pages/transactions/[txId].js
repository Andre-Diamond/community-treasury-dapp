import { useRouter } from 'next/router'
import { useEffect, SetStateAction, useState } from 'react'
import { useWallet } from '@meshsdk/react';

function Post({ post }) {
  const router = useRouter()
  const { txId } = router.query
  const { connected, wallet } = useWallet();

  useEffect(() => {
    if (connected) {
      console.log("pid",txId)
    }
  }, [connected]);

  if (router.isFallback) {
    return <div>Loading...</div>
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
