import { useEffect, SetStateAction, useState, Key, ReactElement, ReactFragment, ReactPortal, JSXElementConstructor } from 'react'
import styles from '../../styles/Singletx.module.css'
import { useWallet } from '@meshsdk/react';
import { Transaction } from '@meshsdk/core';
import type { Asset } from '@meshsdk/core';
import { useRouter } from 'next/router'
import axios from 'axios';

function Singletx() {

  //const tickerAPI = 'http://localhost:3000/api/tickers'
  const tickerAPI = 'https://community-treasury-dapp.netlify.app/api/tickers'
  
  const router = useRouter();
  const { connected, wallet } = useWallet();
  const [assets, setAssets] = useState<null | any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<'' | any>('')
  const [doneTxHash, setDoneTxHash] = useState<'' | any>('')
  const [walletTokens, setWalletTokens] = useState<[] | any>([])
  const [walletTokenUnits, setWalletTokenUnits] = useState<[] | any>([])
  const [tokenRates, setTokenRates] = useState<{} | any>({})
  const [tokens, setTokens] = useState<[] | any>([{"id":"1","name":"ADA","amount":0.00,"unit":"lovelace","decimals": 6}])

  useEffect(() => {
    if (connected) {
      assignTokens()
    } else {setTokens([{"id":"1","name":"ADA","amount":0.00,"unit":"lovelace","decimals": 6}]);}
  }, [connected]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  async function assignTokens() {
    let tokenNames: string[] = []
    let tokenFingerprint: any[] = []
    let tokenAmounts: any[] = []
    let finalTokenAmount = 0
    let tokenUnits: any[] = []
    let tickerDetails = await axios.get(tickerAPI)
    console.log("tickerDetails",tickerDetails.data.tickerApiNames)
    let walletBalance = await wallet.getBalance();
    const assets = await wallet.getAssets();
    let totalAmount = parseFloat(walletBalance[0].quantity).toFixed(6)
    let finalamount = (parseFloat(totalAmount)/1000000).toFixed(6)
    let tokens = [{"id":"1","name":"ADA","amount":parseFloat(finalamount).toFixed(6),"unit":"lovelace", "decimals": 6, "fingerprint":""}]
    assets.map(asset => {
      if (asset.quantity > 1) {
        tokenNames.push((asset.assetName).slice(0,4))
        tokenFingerprint.push(asset.fingerprint)
        tokenUnits.push(asset.unit)
        if (asset.fingerprint === tickerDetails.data.tickerFingerprints[asset.assetName]) {
          console.log("asset.assetName",asset.assetName)
          finalTokenAmount = asset.quantity/(10**tickerDetails.data.tickerDecimals[asset.assetName])
        } else {
          finalTokenAmount = (parseFloat(asset.quantity)/1000000)
        }
        tokenAmounts.push((finalTokenAmount).toFixed(6))
      }
    })
    setWalletTokenUnits(tokenUnits);
    if (tokenNames.includes("gimbal")) {
      const index = tokenNames.indexOf("gimbal");
      tokenNames[index] = "GMBL";
    }
    tokenNames.map((name, index) => {
      tokens.push(JSON.parse(`{"id":"${index+2}","name":"${name}","amount":${tokenAmounts[index]}, "unit":"${tokenUnits[index]}", "fingerprint":"${tokenFingerprint[index]}"}`))
    })
    setWalletTokens(tokens);
    console.log("walletBalance", walletBalance[0].quantity, tokens)
    await getAssetDetails(tokens);
    await getEchangeRate(tokens);
  }

  async function getAssetDetails(tokens: { id: string; name: string; amount: string; unit: string; decimals: number; fingerprint: string; }[]) {
    let updatedTokens = tokens
    const usedAddresses = await wallet.getUsedAddresses();
    try {
      await axios.get(`https://pool.pm/wallet/${usedAddresses[0]}`).then(response => {
        const details = response.data;
        console.log("AssestDetails",details);
        for (let i in response.data.tokens) {
          if (response.data.tokens[i].decimals) {
            for (let j in updatedTokens) {
              if (tokens[j].fingerprint == response.data.tokens[i].fingerprint) {
                updatedTokens[j]['name'] = response.data.tokens[i].metadata.ticker
                updatedTokens[j]['decimals'] = 0;
                updatedTokens[j]['decimals'] = response.data.tokens[i].metadata.decimals;
              }
            }
          }
        }
        });
      // continue with the signed transaction
    } catch (error) {
      console.error('An error occurred while signing the transaction:', error);
      //try api
      await axios.get(tickerAPI).then(response => {
        const details = response.data;
        console.log("AssestDetails",details);
        for (let i in response.data.tickerApiNames) {
            for (let j in updatedTokens) {
              if (tokens[j].fingerprint == response.data.tickerFingerprints[i]) {
                updatedTokens[j]['name'] = i;
                updatedTokens[j]['decimals'] = 0;
                updatedTokens[j]['decimals'] = response.data.tickerDecimals[i];
              } else {
                updatedTokens[j]['decimals'] = 6;
              }
            }
        }
        });
      // handle the error as appropriate
    }
    
    console.log("New Token Details", updatedTokens)
    setWalletTokens(updatedTokens);
  }
  async function getAssets() {
    if (wallet) {
      setLoading(true);
      const _assets = await wallet.getAssets();
      setAssets(_assets);
      setLoading(false);
    }
  }
  
  async function buildTx(addr: any, sendAssets: Asset[], adaAmount: string, metadata: unknown) {
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
    try {
      txHash = await wallet.submitTx(signedTx);
      // continue with the signed transaction
      
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

  async function executeTransaction(addr: any, sendAssets: any[], adaAmount: number, metadata: string) {
    console.log("executeTransaction",addr, sendAssets, adaAmount, metadata)
    const txid = await buildTx(addr, sendAssets, `${adaAmount}`, metadata);
    setDoneTxHash(txid)
    console.log("txid",txid, "doneTxHash", doneTxHash)
    return txid;
  }

  function handleOptionChange(event: { target: { value: SetStateAction<string>, id: SetStateAction<any> }; }) {
    let token = tokens
    setSelectedOption(event.target.value)
    token[event.target.id-1].name = event.target.value
    for (let i in walletTokens) {
      if (walletTokens[i].name == event.target.value) {
        token[event.target.id-1].unit = walletTokens[i].unit
        token[event.target.id-1].decimals = walletTokens[i].decimals
      }
    }
    setTokens(token);
    console.log("Selected option:", event.target.value , event.target.id, tokens)
    // Call your function here based on the selected option
  }

  function handleTokenChange(event: { target: { value: string; id: any }; }) {
    const token = tokens[event.target.id - 1];
    token.amount = parseFloat((event.target.value).replace(/\s/g, '').replace(/,/g, '.'));
    setTokens([...tokens]); // create a new array with updated values to trigger a re-render
  }

  async function addToken() {
    if (tokens.length < walletTokens.length) {
      const newToken = {"id": `${tokens.length + 1}`, "name": "ADA", "amount": 0, "decimals": 6, "fingerprint":""};
      setTokens([...tokens, newToken]);
      console.log("Adding Token", tokens);
    }
  }

  function getValue(name: string){
    let element: HTMLElement | any
    element = document.getElementById(name)
    return element.value
  }

  async function getEchangeRate(wallettokens: { id: string; name: string; amount: string; unit: string; decimals: number; fingerprint: string; }[]) {
    let currentXchangeRate = ""
    console.log("Exchange Rate wallet tokens", wallettokens)
    let tickerDetails = await axios.get(tickerAPI)
    console.log("tickerDetails",tickerDetails.data.tickerApiNames)
    let tickers = tickerDetails.data.tickerApiNames;
    let tokenExchangeRates: any
    tokenExchangeRates = {}
    for (let i in wallettokens) {
      if (wallettokens[i].name == "ADA") {
        axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${tickers[wallettokens[i].name]}&vs_currencies=usd`).then(response => {
        const rate = response.data[tickers[wallettokens[i].name]].usd;
        let exchangeToken: any;
        exchangeToken = wallettokens[i].name
        tokenExchangeRates[exchangeToken] = 0.00
        tokenExchangeRates[exchangeToken] = parseFloat(rate).toFixed(3)
        let xrates: HTMLElement | any
        xrates = document.getElementById('xrate')
        xrates.value = parseFloat(rate).toFixed(3);
        currentXchangeRate = parseFloat(rate).toFixed(3);
        console.log("exchangeAda",rate);
        });
      } else if (wallettokens[i].name != "GMBL") {
        axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${tickers[wallettokens[i].name]}&vs_currencies=usd`).then(response => {
        const rate = response.data[tickers[wallettokens[i].name]].usd;
        let exchangeToken: any;
        exchangeToken = wallettokens[i].name
        tokenExchangeRates[exchangeToken] = 0.00
        tokenExchangeRates[exchangeToken] = parseFloat(rate).toFixed(3)
        console.log("exchangeAda",rate);
        });
      }
    }
    setTokenRates(tokenExchangeRates)
    console.log("tokenExchangeRates",tokenExchangeRates)
  }

  async function getTotalTokens(results: [] | any) {
    let totalTokensPrep = ""
    for (let i in results) {
      if (results[i].name != "GMBL") {
        let gmblNumber: any
        let gmblNumber2: any
        gmblNumber = parseFloat(results[i].amount)
        gmblNumber2 = (gmblNumber * tokenRates[results[i].name]).toFixed(3)
        totalTokensPrep = `${totalTokensPrep}
      "${gmblNumber2} USD in ${results[i].amount} ${results[i].name}",`
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
    const sendAssets: any[] = []
    let adaAmount = 0
    let results: any[]
    results = Object.values(tokens.reduce((acc: { [x: string]: { amount: any; id: any; name: any; unit: any; decimals: any;}; }, { id, name, amount, unit, decimals }: any) => {
      if (!acc[name]) {
        acc[name] = { id, name, amount, unit, decimals };
      } else {
        acc[name].amount += amount;
      }
      return acc;
    }, {}));
    console.log(results, tokens)
    //setTokens(result);
    results.map(token => {
      let x = 0
      if (token.decimals) {
        x = 10 ** token.decimals
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
    let thash = await executeTransaction(addr, sendAssets, adaAmount, copyData)
    console.log("Getting user input", tokens, id, addr, label, description, thash)
    console.log("thash",thash)
    setTimeout(function() {
      router.push(`/transactions/${thash}`)
    }, 1000); // 3000 milliseconds = 3 seconds
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
                <span className={styles.placeholder}>Your Organization or Project&apos;s name</span>
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
              {tokens.map((token: { id: Key | any | undefined; name: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | ReactFragment | ReactPortal | null | undefined; }) => {
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
                          {walletTokens.map((token: { id: Key | any | undefined; name: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | ReactFragment | any | undefined; }) => {
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
            {walletTokens.map((token: { id: Key | null | undefined; name: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | ReactFragment | ReactPortal | null | undefined; amount: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | ReactFragment | ReactPortal | null | undefined; }) => {
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