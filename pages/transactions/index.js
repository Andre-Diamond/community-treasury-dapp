import Link from 'next/link'
import axios from 'axios';
import { useEffect, SetStateAction, useState } from 'react'
import { useWallet } from '@meshsdk/react';

function TransactionsList() {

  const { connected, wallet } = useWallet();
  const [txs, setTxs] = useState([])

  useEffect(() => {
    if (connected) {
      getDandelion()
    }
  }, [connected]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  async function getDandelion() {
    const usedAddresses = await wallet.getUsedAddresses();
    /*await axios.get('https://postgrest-api.mainnet.dandelion.link')
      .then(response => {
        console.log(response.data);
      })
      .catch(error => {
        console.log(error);
      });*/
    const data = {
      "data": {
        "addresses" : [usedAddresses[0]]
      }
    };
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    await axios.post('https://postgrest-api.mainnet.dandelion.link/rpc/get_tx_history_for_addresses', data, {headers})
      .then(response => {
        console.log(response.data);
        setTxs(response.data.slice(0, 10))
      })
      .catch(error => {
        console.log(error);
      });
  }
  
  return (
    <>
      <h1>List of TX Ids</h1>
      {txs.map(tx => {
        return (
          <div key={tx.tx_hash}>
            <Link href={`transactions/${tx.tx_hash}`}>
              <h2>
                {tx.tx_hash}
              </h2>
            </Link>
            <hr />
          </div>
        )
      })}
    </>
  )
}

export default TransactionsList