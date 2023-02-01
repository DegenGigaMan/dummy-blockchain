// if a new block breaks the chain we need a mechanism to roll back the changes to a correct state
//this is lacking many features such as:
//  proof of work (completed!),
//  peer-to-peer network to communicate with other miners,
//  checking if user has enough funds to make a transaction

const SHA256 = require("crypto-js/sha256");
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

//a transaction stores to and from address and the amount send
//to stop anyone from creating txns from addresses that arent theirs,
//we need to make it mandatory to sign txns with a public and private key,
//that way you can only spend coins in a wallet if you have the private key.
class Transaction {
  constructor(fromAddress, toAddress, amount) {
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.amount = amount;
  }

  //use private key to sign the hash of the txn, not signing all the txn data
  calculateHash() {
    return SHA256(this.fromAddress + this.toAddress + this.amount).toString();
  }

  //valid key pair to sign txn
  signTransaction(signingKey) {
    if (signingKey.getPublic("hex") !== this.fromAddress) {
      throw new Error("You cannot sign transactions for other wallets!");
    }
    const hashTx = this.calculateHash(); //creating a hash for the txn
    const signature = signingKey.sign(hashTx, "base64"); //signing the hash of transaction with keypair obj built in method
    this.signature = signature.toDER("hex"); //storing signature in the txn class
  }

  //this method is going to verify if the txn has been correctly signed
  isValid() {
    if(this.fromAddress === null) return true;

    if(!this.signature || this.signature.length === 0) {
      throw new Error('No signature in this transaction');
    }

    //verify that the sig was signed by the correct key
    const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
    return publicKey.verify(this.calculateHash(), this.signature);
  }
}

// When we create a block, we pass along parameters and it will calculate the hash of our block.
// It also stores the hash of the previous block, the first block is the genesis block.
// need to add mining reward
// need new method to mine a new block for the pending transactions
class Block {
  constructor(timestamp, transactions, previousHash = "") {
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
    this.nonce = 0;
  }

  calculateHash() {
    return SHA256(
      this.index +
        this.previousHash +
        this.timestamp +
        JSON.stringify(this.data) +
        this.nonce
    ).toString();
  }

  // this method adds proof-of-work when a block is mined.
  mineBlock(difficulty) {
    while (
      this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")
    ) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    console.log("Block mined: " + this.hash);
  }

  //verify txns in the block
  hasValidTransactions(){
    for(const tx of this.transactions){
      if(!isValid()){
        return false;
      }
    }

    return true;
  }
}

// a Blockchain is an array of blocks, with methods to retrieve and add blocks
class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 2;
    this.pendingTransactions = [];
    this.miningReward = 100;
  }

  // returns the first block of the chain upon creation of Blockchain class
  createGenesisBlock() {
    return new Block("01/30/2023", "Genesis Degen Block", "0");
  }

  // returns the most recently mined blocked
  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  // adds a new block to the end of the blockchain array
  // addBlock(newBlock) {
  //   newBlock.previousHash = this.getLatestBlock().hash;
  //   newBlock.mineBlock(this.difficulty);
  //   this.chain.push(newBlock);
  // }

  // sends reward to address after successfully mining the transactions in a block to the chain.
  //since a btc block cannot exceed 1 megabyte, miners have to pick the transactions they want to include. not the case here.
  minePendingTransactions(miningRewardAddress) {
    let block = new Block(Date.now(), this.pendingTransactions);
    block.mineBlock(this.difficulty);

    console.log("Block successfully mined!");
    this.chain.push(block);
    this.pendingTransactions = [
      new Transaction(null, miningRewardAddress, this.miningReward),
    ];
  }

  //receives a txn and adds it to the pending txns array
  addTransaction(transaction) {

    //check if from and to addresses were provided
    if(!transaction.fromAddress || !transaction.toAddress){
      throw new Error('Transaction must include from and to address.');
    }

    //check if txn is valid
    if(!transaction.isValid()){
      throw new Error('Cannot add invalid transaction to chain.')
    }

    this.pendingTransactions.push(transaction);
  }

  //method that checks the balance of an address.
  //  when you send btc to someone, it doesn't move away from your wallets balance to someone elses balance. in reality, you don't really have a balance.
  //  the txn is just stored on the blockchain, checking your balance means going through all the txns that involve an address and calculate it
  getAddressBalance(address) {
    let balance = 0;

    for (const block of this.chain) {
      for (const txn of block.transactions) {
        if (txn.toAddress === address) {
          balance += txn.amount;
        }
        if (txn.fromAddress === address) {
          balance -= txn.amount;
        }
      }
    }
    return balance;
  }

  // returns false if the chain had its data changed. Blocks on the chain are meant to be immutable.
  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if(!currentBlock.hasValidTransactions()){
        return false;
      }
      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }

      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }
    return true;
  }
}

module.exports.Blockchain = Blockchain;
module.exports.Transaction = Transaction;
