import { useEffect, SetStateAction, useState } from 'react'
import styles from '../../styles/Singletx.module.css'
import { useWallet } from '@meshsdk/react';
import { Transaction } from '@meshsdk/core';
import type { Asset } from '@meshsdk/core';
import { useRouter } from 'next/router'
import axios from 'axios';

function Singletx() {

  const router = useRouter();
  const { connected, wallet } = useWallet();
  const [assets, setAssets] = useState<null | any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState('')
  const [doneTxHash, setDoneTxHash] = useState('')
  const [walletTokens, setWalletTokens] = useState([])
  const [walletTokenUnits, setWalletTokenUnits] = useState([])
  const [tokenRates, setTokenRates] = useState({})
  const [tokens, setTokens] = useState([{"id":"1","name":"ADA","amount":0,"unit":"lovelace"}])

  useEffect(() => {
    if (connected) {
      assignTokens()
    } else {setTokens([{"id":"1","name":"ADA","amount":0,"unit":"lovelace"}]);}
  }, [connected]);

  async function assignTokens() {
    let tokenNames = []
    let tokenAmounts = []
    let finalTokenAmount = 0
    let tokenUnits = []
    let walletBalance = await wallet.getBalance();
    const assets = await wallet.getAssets();
    let tokens = [{"id":"1","name":"ADA","amount":parseFloat(walletBalance[0].quantity/1000000).toFixed(6),"unit":"lovelace"}]
    assets.map(asset => {
      if (asset.quantity > 1) {
        tokenNames.push(asset.assetName)
        tokenUnits.push(asset.unit)
        if (asset.assetName === 'AGIX') {
          console.log("asset.assetName",asset.assetName)
          finalTokenAmount = asset.quantity/100000000
        } else {
          finalTokenAmount = asset.quantity/1000000
        }
        tokenAmounts.push(parseFloat(finalTokenAmount).toFixed(6))
      }
    })
    setWalletTokenUnits(tokenUnits);
    if (tokenNames.includes("gimbal")) {
      const index = tokenNames.indexOf("gimbal");
      tokenNames[index] = "GMBL";
    }
    tokenNames.map((name, index) => {
      tokens.push(JSON.parse(`{"id":"${index+2}","name":"${name}","amount":${tokenAmounts[index]}, "unit":"${tokenUnits[index]}"}`))
    })
    setWalletTokens(tokens);
    console.log("walletBalance", walletBalance[0].quantity, tokens)
    await getEchangeRate(tokens)
  }

  async function getAssets() {
    if (wallet) {
      setLoading(true);
      const _assets = await wallet.getAssets();
      setAssets(_assets);
      setLoading(false);
    }
  }
  
  async function buildTx(addr, sendAssets, adaAmount, metadata) {
    let txHash = ""
    if (parseInt(adaAmount) > 0) {
      const tx = new Transaction({ initiator: wallet })
        .sendLovelace(
          addr,
          adaAmount
        )
        .sendAssets(
          addr,
          sendAssets
        )
      tx.setMetadata(674, metadata);;
      let unsignedTx = ""
      try {
        unsignedTx = await tx.build();
        // continue with the signed transaction
      } catch (error) {
        console.error('An error occurred while signing the transaction:', error);
        //router.push('/cancelwallet')
        window.location.reload();
        // handle the error as appropriate
      }
      let signedTx = ""
      try {
        signedTx = await wallet.signTx(unsignedTx);
        // continue with the signed transaction
      } catch (error) {
        console.error('An error occurred while signing the transaction:', error);
        //router.push('/cancelwallet')
        window.location.reload();
        // handle the error as appropriate
      }
    txHash = await wallet.submitTx(signedTx);
    console.log("txHash",txHash)
    } else {
      const tx = new Transaction({ initiator: wallet })
        .sendAssets(
          addr,
          sendAssets
        )
      tx.setMetadata(674, metadata);
    let unsignedTx = ""
    try {
      unsignedTx = await tx.build();
      // continue with the signed transaction
    } catch (error) {
      console.error('An error occurred while signing the transaction:', error);
      //router.push('/cancelwallet')
      window.location.reload();
      // handle the error as appropriate
    }
    let signedTx = ""
    try {
      signedTx = await wallet.signTx(unsignedTx);
      // continue with the signed transaction
    } catch (error) {
      console.error('An error occurred while signing the transaction:', error);
      //router.push('/cancelwallet')
      window.location.reload();
      // handle the error as appropriate
    }
    
    //txHash = await wallet.submitTx(signedTx);
    let txHash = ""
    try {
      txHash = await wallet.submitTx(signedTx);
      // continue with the signed transaction
      router.push(`/${txHash}`)
    } catch (error) {
      console.error('An error occurred while signing the transaction:', error);
      //router.push('/cancelwallet')
      router.push('/error')
      // handle the error as appropriate
    }
    console.log("txHash",txHash)
    }
    
    return txHash;
  }

  async function executeTransaction(addr, sendAssets, adaAmount, metadata) {
    console.log("executeTransaction",addr, sendAssets, adaAmount, metadata)
    const txid = await buildTx(addr, sendAssets, `${adaAmount}`, metadata);
    setDoneTxHash(txid)
    console.log("txid",txid, "doneTxHash", doneTxHash)
  }

  function handleOptionChange(event: { target: { value: SetStateAction<string>; }; }) {
    let token = tokens
    setSelectedOption(event.target.value)
    token[event.target.id-1].name = event.target.value
    for (let i in walletTokens) {
      if (walletTokens[i].name == event.target.value) {
        token[event.target.id-1].unit = walletTokens[i].unit
      }
    }
    setTokens(token);
    console.log("Selected option:", event.target.value , event.target.id, tokens)
    // Call your function here based on the selected option
  }

  function handleTokenChange(event: { target: { value: string; id: string }; }) {
    const token = tokens[event.target.id - 1];
    token.amount = parseFloat((event.target.value).replace(/\s/g, '').replace(/,/g, '.'));
    setTokens([...tokens]); // create a new array with updated values to trigger a re-render
  }

  async function addToken() {
    if (tokens.length < walletTokens.length) {
      const newToken = {"id": `${tokens.length + 1}`, "name": "ADA", "amount": 0};
      setTokens([...tokens, newToken]);
      console.log("Adding Token", tokens);
    }
  }

  function getValue(name){
    return document.getElementById(name).value
  }

  async function getEchangeRate(wallettokens) {
    let currentXchangeRate = ""
    console.log("Exchange Rate wallet tokens", wallettokens)
    let tickers = {"ADA":"cardano",
      "AGIX":"singularitynet",
      "NTX":"nunet",
      "COPI":"cornucopias"}
    let tokenExchangeRates = {}
    for (let i in wallettokens) {
      if (wallettokens[i].name == "ADA") {
        axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${tickers[wallettokens[i].name]}&vs_currencies=usd`).then(response => {
        const rate = response.data[tickers[wallettokens[i].name]].usd;
        tokenExchangeRates[wallettokens[i].name] = parseFloat(rate).toFixed(3)
        let xrates = document.getElementById('xrate')
        xrates.value = parseFloat(rate).toFixed(3);
        currentXchangeRate = parseFloat(rate).toFixed(3);
        console.log("exchangeAda",rate);
        });
      } else if (wallettokens[i].name != "GMBL") {
        axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${tickers[wallettokens[i].name]}&vs_currencies=usd`).then(response => {
        const rate = response.data[tickers[wallettokens[i].name]].usd;
        tokenExchangeRates[wallettokens[i].name] = parseFloat(rate).toFixed(3)
        console.log("exchangeAda",rate);
        });
      }
    }
    setTokenRates(tokenExchangeRates)
    console.log("tokenExchangeRates",tokenExchangeRates)
  }

  async function getTotalTokens(results) {
    let totalTokensPrep = ""
    for (let i in results) {
      if (results[i].name != "GMBL") {
        totalTokensPrep = `${totalTokensPrep}
      "${parseFloat(results[i].amount * tokenRates[results[i].name]).toFixed(3)} USD in ${results[i].amount} ${results[i].name}",`
      } else if (results[i].name == "GMBL") {
        totalTokensPrep = `${totalTokensPrep}
      "0 USD in ${results[i].amount} ${results[i].name}",`
      }
    }
    return totalTokensPrep;
  }

  async function getValues() {
    const taskCreator = getValue('id');
    const addr = getValue('addr');
    const id = addr.slice(-6)
    //const addr = 'addr1q9lvrl7rwv9ypn8zdm3yek525m03walucyysx6ghk3zn845rdcnj6lwu3zw854y76snq07kauuw4uj3s3hz2v6k4t5gq7zxn7j';
    const sendAssets = []
    let adaAmount = 0
    const results = Object.values(tokens.reduce((acc, { id, name, amount, unit }) => {
      if (!acc[name]) {
        acc[name] = { id, name, amount, unit };
      } else {
        acc[name].amount += amount;
      }
      return acc;
    }, {}));
    console.log(results, tokens)
    //setTokens(result);
    results.map(token => {
      let x = 0
      if (token.name == 'AGIX') {
        x = 100000000
      } else { x = 1000000 }
      if (token.name != 'ADA') {
        sendAssets.push(JSON.parse(`{"unit":"${token.unit}","quantity":"${token.amount * x}"}`))
      } else if (token.name == 'ADA') {
        if (token.amount > 0) {
          adaAmount = adaAmount + token.amount * x
        } else { 
          adaAmount = 0
        }
      }
    })
    const label = getValue('label');
    const xrate = getValue('xrate');
    const description = (getValue('description')).replace(/,/g, '.');
    let descript = JSON.stringify((description).replace(/.{50}\S*\s+/g, "$&@").split(/\s+@/));

    for (let i = 0; i < descript.length; i++) {
      if (descript[i] == `[`) {
        descript = descript.slice(0, (i+1)) + "\n" + descript.slice(i+1);
      }
      if (descript[i] == `,`) {
        descript = descript.slice(0, (i+1)) + "\n" + descript.slice(i+1);
      }
      if (descript[i] == `]`) {
        descript = descript.slice(0, (i)) + "\n" + descript.slice(i);
        i++
      }
    }
    //let x = wallet.getBalance();
    //let metadata = {"Test":"1"}
    let tok3 = [];
    for (let i in results) {
      if (results[i].amount > 0) {
        tok3.push(`"${results[i].name}": "${results[i].amount}"`);
      }
    }
    let ideaJ = ""
    let totalTokens = await getTotalTokens(results);
    let metadata = `{
      "mdVersion": ["1.4"],
      "msg": [
      "Single Transaction",
      "Ideascale: ${ideaJ}",
      "Recipients: 1",${totalTokens}
      "Exchange rate - ${xrate}",
      "https://www.treasuryguild.io/"
      ],
      "contributions": [
        {
          "taskCreator": "${taskCreator}",
          "label": "${label}",
          "description": ${descript},  
          "contributors": {
            "${id}": {${tok3}}
          }
        }
      ]
      }
      `
      var copyData = (metadata);
      copyData = JSON.parse(copyData)
      copyData = JSON.stringify(copyData, null, 2)
      copyData = JSON.parse(copyData)
      console.log("fileText",copyData)
    await executeTransaction(addr, sendAssets, adaAmount, copyData)
    console.log("Getting user input", tokens, id, addr, label, description)
  }
  
    return (
      <>
      <div className={styles.main}>
        <div className={styles.heading}>
          <h1>Single transaction Builder</h1>
        </div>
        <div className={styles.body}>
          <div className={styles.form}>
            <div className={styles.formitem}>
              <label className={styles.custom}> 
                <input
                    type='text'
                    id='id'
                    name='id'
                    autoComplete="off"
                    required
                />
                <span className={styles.placeholder}>Your Organization or Project's name</span>
                <span className={styles.tag}>Task Creator</span>
              </label>
            </div>
            <div className={styles.formitem}>
              <label className={styles.custom}> 
                <input
                    type='text'
                    id='addr'
                    name='addr'
                    autoComplete="off"
                    required
                />
                <span className={styles.placeholder}>wallet address of recipient</span>
                <span className={styles.tag}>ADA wallet address</span>
              </label>
            </div>
            <div className={styles.formitem}>
              <label className={styles.custom}> 
                <input
                    type='text'
                    id='xrate'
                    name='xrate'
                    autoComplete="off"
                    required
                />
                <span className={styles.placeholder}>Ex. 0.3</span>
                <span className={styles.tag}>Exchange Rate</span>
              </label>
            </div>
            <div className={styles.formitem}>
              <label className={styles.custom}> 
                <input
                    type='text'
                    id='label'
                    name='label'
                    autoComplete="off"
                    required
                />
                <span className={styles.placeholder}>Label</span>
                <span className={styles.tag}>Task Type</span>
              </label>
            </div>
            <div className={styles.formitem}>
              <label className={styles.custom}> 
                <textarea
                    id='description'
                    name='description'
                    autoComplete="off"
                    required
                />
                <span className={styles.tag}>Description</span>
              </label>
            </div>
          </div>
          {connected && (
            <>
              <div className={styles.tokens}>
              {tokens.map(token => {
                return (
                  <div className={styles.token} key={token.id}>
                    <div className={styles.tokenitem}>
                      <label className={styles.custom3}> 
                      <input
                        type='text'
                        id={token.id}
                        name='amount'
                        autoComplete="off"
                        required
                        onChange={handleTokenChange}
                      />
                        <span className={styles.placeholder}>Amount</span>
                        <span className={styles.tag}>{token.name}</span>
                      </label>
                      <select name="" id={token.id} className={styles.selecttoken} onChange={handleOptionChange}>
                          {walletTokens.map(token => {
                            return (                
                              <option key={token.id} value={token.name}>{token.name}</option>
                            )
                          })}
                      </select>
                    </div>
                  </div>
                )
              })}
              <div className={styles.addtoken}>
                <button className={styles.but} 
                  type="button"
                  onClick={() => addToken()}
                  >
                  +
                </button>
              </div>
          </div>
            </>
          )}
          <div className={styles.balances}>
            <div><h2>Token Balances</h2></div>
            <div>
            {walletTokens.map(token => {
              return (                
                <p key={token.id}>{token.name} {token.amount}</p>
              )
            })}
            </div>
          </div>
        </div> 
        <div className={styles.submit}>
          <div>
            <button className={styles.submitbut}
              type="button"
              onClick={() => getValues()}
              >Build
            </button>
          </div>
        </div>
      </div>
      </>
    )
  }
  
  export default Singletx