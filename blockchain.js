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

const land_env_key = "development";
const land_env = {
  development: {
    mv_addr: "0xEAd0DCAdD8A7E6F9FC61F0F419C3005B80683378", // MVのトークンアドレステスト用
    spender_addr: "0x0F33BFeF7cf01AE494F72ea01C0C47fdBa4Db672", // AWS上のウォレットアドレス
    network: "mumbai",
    land_addr: "0x9F113275624153ca030525f96C840D0621129C53",
    base_url: "http://localhost:50080/",
    net_id: 80001, // polygon testnet のnetwork ID
  },
  production: {
    mv_addr: "0xcf0C122c6b73ff809C693DB761e7BaeBe62b6a2E", // MVのトークンアドレス
    spender_addr: "0x0F33BFeF7cf01AE494F72ea01C0C47fdBa4Db672", // AWS上のウォレットアドレス
    network: "matic",
    land_addr: "0x5cbc94a38b793EF1756BF6a0CdA91A1382b60aE6",
    base_url: "https://api01.genso.game/",
    net_id: 137, // polygon のnetwork ID
  },
};

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