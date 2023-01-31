const { Blockchain, Transaction } = require('./blockchain');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const myKey = ec.keyFromPrivate('537520fa9394e02eb63856f0154f6ca9d258e0d7bb344178ed9860af794bc8d4');
const myWalletAddress = myKey.getPublic('hex');


let DegenChain = new Blockchain();

const txn1 = new Transaction(myWalletAddress, 'pub key', 10);
txn1.signTransaction(myKey);
DegenChain.addTransaction(txn1);

console.log('mining first batch of txns... ');
DegenChain.minePendingTransactions(myWalletAddress);
//console.log(JSON.stringify(DegenChain, null, 4));
console.log(DegenChain.getAddressBalance(myWalletAddress));

console.log('mining second batch of txns... ');
DegenChain.minePendingTransactions(myWalletAddress);
console.log(DegenChain.getAddressBalance(myWalletAddress));