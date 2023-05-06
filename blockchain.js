var web3js = null;
if (typeof ethereum !== "undefined") {
  web3js = new Web3(Web3.givenProvider);
}
var price_mv = String(1e6) + "0".repeat(18); // 選択中のlandの値段

async function exposeAccount() {
  if (typeof ethereum === "undefined") {
    return false;
  }

  if (!accountExposed()) {
    try {
      await ethereum.request({ method: "eth_requestAccounts" });
    } catch (e) {
      return false;
    }
  }
  return true;
}

function accountExposed() {
  if (typeof ethereum === "undefined") return false;
  return !!ethereum.selectedAddress;
}

async function onPolygon() {
  if (!accountExposed()) return false;
  const expected_net_id = land_env[land_env_key].net_id;
  const net_id = await web3js.eth.net.getId();
  return net_id == expected_net_id;
}

function mvContract() {
  const mv_addr = land_env[land_env_key].mv_addr;
  return new web3js.eth.Contract(erc20_abi, mv_addr);
}

const land_env_key = "production";
const land_env = {
  development: {
    mv_addr: "0xEAd0DCAdD8A7E6F9FC61F0F419C3005B80683378",
    spender_addr: "0x861d0636b02B239b7a8f5bEF39F305cbF938cBd4",
    base_url: "http://localhost:50080/",
    net_id: 80001,
  },
  production: {
    mv_addr: "0xcf0C122c6b73ff809C693DB761e7BaeBe62b6a2E",
    spender_addr: "0x861d0636b02B239b7a8f5bEF39F305cbF938cBd4",
    base_url: "",
    net_id: 1,
  },
};

const web3Modal = new Web3Modal.default({
  network: "mainnet", // 接続するネットワークの指定
  cacheProvider: true, // プロバイダーをキャッシュするかどうかの指定
});
const connectWalletButton = document.getElementById("connect-wallet-button");

connectWalletButton.addEventListener("click", async () => {
  // ウォレットのプロバイダーを取得する
  const provider = await web3Modal.connect();

  // Web3.jsのインスタンスを作成する
  const web3 = new Web3(provider);

  // 以降、web3を使用してDAppとブロックチェーンとのやり取りを行う
});

const erc20_abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
    ],
    name: "allowance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

async function approve() {
  if (!accountExposed() && !(await exposeAccount())) {
    alert("Please connect wallet before.");
    return;
  }

  if (await onPolygon()) {
  } else {
    alert("Please connect to ethereum mainnet.");
    return;
  }

  const mv_addr = land_env[land_env_key].mv_addr;
  const spender_addr = land_env[land_env_key].spender_addr;

  mvContract()
    .methods.approve(spender_addr, Web3.utils.toBN(price_mv))
    .send(
      {
        to: mv_addr,
        from: ethereum.selectedAddress,
      },
      async function (error, transactonHash) {
        console.log("Submitted transaction with hash: ", transactonHash);
        transactionReceipt = null;
        while (transactionReceipt == null) {
          transactionReceipt = await web3js.eth.getTransactionReceipt(
            transactonHash
          );
          await function () {
            return new Promise((resolve) => setTimeout(resolve, 5000));
          };
        }
        if (transactionReceipt.status) {
          await logger();
        }
      }
    )
    .catch(() => {});
}

async function logger() {
  const base_url = land_env[land_env_key].base_url;
  axios
    .post(base_url + "api/metadata", {
      address: ethereum.selectedAddress,
    })
    .then(function (res) {})
    .catch(function (error) {});
}
