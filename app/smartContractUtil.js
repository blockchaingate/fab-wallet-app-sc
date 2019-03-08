var bitcoinjs = require('bitcoinjs-lib')
var BigNumber = require('bignumber.js')
var OPS = require('qtum-opcodes')
var Buffer = require('safe-buffer').Buffer
var reverseInplace = require("buffer-reverse/inplace")

/**
 * This is a function for selecting QTUM utxos to build transactions
 * the transaction object takes at least 3 fields, value(unit is 1e-8 QTUM) , confirmations and isStake
 *
 * @param [transaction] unspentTransactions
 * @param Number amount(unit: QTUM)
 * @param Number fee(unit: QTUM)
 * @returns [transaction]
 */
function selectTxs(unspentTransactions, amount, fee) {
    //sort the utxo
    var matureList = []
    var immatureList = []
    for(var i = 0; i < unspentTransactions.length; i++) {
        if(unspentTransactions[i].confirmations >= 500 || unspentTransactions[i].isStake === false) {
            matureList[matureList.length] = unspentTransactions[i]
        }
        else {
            immatureList[immatureList.length] = unspentTransactions[i]
        }
    }
    matureList.sort(function(a, b) {return a.value - b.value})
    immatureList.sort(function(a, b) {return b.confirmations - a.confirmations})
    unspentTransactions = matureList.concat(immatureList)

    var value = new BigNumber(amount).plus(fee).times(1e8)
    var find = []
    var findTotal = new BigNumber(0)
    for (var i = 0; i < unspentTransactions.length; i++) {
        var tx = unspentTransactions[i]
        findTotal = findTotal.plus(tx.value)
        find[find.length] = tx
        if (findTotal.greaterThanOrEqualTo(value)) break
    }
    if (value.greaterThan(findTotal)) {
        throw new Error('You do not have enough QTUM to send')
    }
    return find
}

/**
 * This is a helper function to build a pubkeyhash transaction
 * the transaction object takes at least 5 fields, value(unit is 1e-8 QTUM), confirmations, isStake, hash and pos
 *
 * @param bitcoinjs-lib.KeyPair keyPair
 * @param String to
 * @param Number amount(unit: QTUM)
 * @param Number fee(unit: QTUM)
 * @param [transaction] utxoList
 * @returns String the built tx
 */
function buildPubKeyHashTransaction(keyPair, to, amount, fee, utxoList) {
    var from = keyPair.getAddress()
    var inputs = selectTxs(utxoList, amount, fee)
    var tx = new bitcoinjs.TransactionBuilder(keyPair.network)
    var totalValue = new BigNumber(0)
    var value = new BigNumber(amount).times(1e8)
    var sendFee = new BigNumber(fee).times(1e8)
    for (var i = 0; i < inputs.length; i++) {
        tx.addInput(inputs[i].hash, inputs[i].pos)
        totalValue = totalValue.plus(inputs[i].value)
    }
    tx.addOutput(to, new BigNumber(value).toNumber())
    if (totalValue.minus(value).minus(sendFee).toNumber() > 0) {
        tx.addOutput(from, totalValue.minus(value).minus(sendFee).toNumber())
    }
    for (var i = 0; i < inputs.length; i++) {
        tx.sign(i, keyPair)
    }
    return tx.build().toHex()
}

/**
 * This is a helper function to build a create-contract transaction
 * the transaction object takes at least 5 fields, value(unit is 1e-8 QTUM), confirmations, isStake, hash and pos
 *
 * @param bitcoinjs-lib.KeyPair keyPair
 * @param String code The contract byte code
 * @param Number gasLimit
 * @param Number gasPrice(unit: 1e-8 QTUM/gas)
 * @param Number fee(unit: QTUM)
 * @param [transaction] utxoList
 * @returns String the built tx
 */
function buildCreateContractTransaction(masterNode, changeKeyPair, code, gasLimit, gasPrice, fee, utxoList) {
    var from = changeKeyPair.getAddress(); // scChangeKeyPair.getAddress();
    var amount = 0;
    fee = new BigNumber(gasLimit).times(gasPrice).div(1e8).add(fee).toNumber();
    var inputs = utxoList;// selectTxs(utxoList, amount, fee);
    var tx = new bitcoinjs.TransactionBuilder(changeKeyPair.network);
    var totalValue = new BigNumber(0);
    var sendFee = new BigNumber(fee).times(1e8);
    for (var i = 0; i < inputs.length; i++) {
        tx.addInput(inputs[i].txid, inputs[i].txidx);
        totalValue = totalValue.plus(inputs[i].amount)
    }
    var contract =  bitcoinjs.script.compile([
        OPS.OP_4,
        number2Buffer(gasLimit),
        number2Buffer(gasPrice),
        hex2Buffer(code),
        OPS.OP_CREATE
    ]);
    totalValue = totalValue.times(1e8);
    tx.addOutput(contract, 0);
    if (totalValue.minus(sendFee).toNumber() > 0) {
        tx.addOutput(from, totalValue.minus(sendFee).toNumber())
    }

    let keypair;
    let utxo;
    changeNode = masterNode.derivePath('m/44/0\'/0\'/1');
    receiveNode = masterNode.derivePath('m/44/0\'/0\'/0'); // 0 is for receive address

    for (let k = inputs.length - 1; k >= 0; k--) {
        utxo = inputs[k];

        if (utxo.type === 'change') {
            keypair = changeNode.derive(utxo.addressIndex).keyPair;
        } else if (utxo.type === 'receive') {
            keypair = receiveNode.derive(utxo.addressIndex).keyPair;
        }

        tx.sign(k, keypair);
    }

    // for (var i = 0; i < inputs.length; i++) {
    //     tx.sign(i, keyPair)
    // }
    return tx.build().toHex()
}

/**
 * This is a helper function to build a send-to-contract transaction
 * the transaction object takes at least 5 fields, value(unit is 1e-8 QTUM), confirmations, isStake, hash and pos
 *
 * @param bitcoinjs-lib.KeyPair keyPair
 * @param String contractAddress The contract address
 * @param String encodedData The encoded abi data
 * @param Number gasLimit
 * @param Number gasPrice(unit: 1e-8 FAB/gas or Lius/gas)
 * @param Number fee(unit: FAB)
 * @param [transaction] utxoList
 * @param amount The amount in Fabcoins to send
 * @returns String the built tx
 */
function buildSendToContractTransaction(masterNode, changeKeyPair, contractAddress, encodedData, gasLimit, gasPrice,
                                        fee, utxoList, amount) {
    var from = changeKeyPair.getAddress();
    amount =  new BigNumber(amount).times(1e8);
    fee = new BigNumber(gasLimit).times(gasPrice).div(1e8).add(fee).toNumber()
    var inputs = utxoList; // selectTxs(utxoList, amount, fee)
    var tx = new bitcoinjs.TransactionBuilder(changeKeyPair.network); // todo fix
    var totalValue = new BigNumber(0)
    var sendFee = new BigNumber(fee).times(1e8);
    for (var i = 0; i < inputs.length; i++) {
        tx.addInput(inputs[i].txid, inputs[i].txidx);
        totalValue = totalValue.plus(inputs[i].amount)
    }
    var contract = bitcoinjs.script.compile([
        OPS.OP_4,
        number2Buffer(gasLimit),
        number2Buffer(gasPrice),
        hex2Buffer(encodedData),
        hex2Buffer(contractAddress),
        OPS.OP_CALL
    ])
    totalValue = totalValue.times(1e8);
    tx.addOutput(contract, amount);
    if (totalValue.minus(sendFee).toNumber() > 0) {
        tx.addOutput(from, totalValue.minus(sendFee).toNumber())
    }

    let keypair;
    let utxo;
    changeNode = masterNode.derivePath('m/44/0\'/0\'/1');
    receiveNode = masterNode.derivePath('m/44/0\'/0\'/0'); // 0 is for receive address

    for (let k = inputs.length - 1; k >= 0; k--) {
        utxo = inputs[k];

        if (utxo.type === 'change') {
            keypair = changeNode.derive(utxo.addressIndex).keyPair;
        } else if (utxo.type === 'receive') {
            keypair = receiveNode.derive(utxo.addressIndex).keyPair;
        }

        tx.sign(k, keypair);
    }

    return tx.build().toHex()
}

function getContractAddress(txId, vouts) {
    let txIdBuffer = Buffer.from(txId, 'hex');
    reverseInplace(txIdBuffer);

    let voutBuffer = Buffer.alloc(4); // 32 bits / 4 bytes for vout
    let voutNum = 0;
    // append vout index of contract to txId
    for (let vout of vouts) {
        if (hasOpCreate(vout)) {
            voutBuffer.writeInt32LE(voutNum);
            break;
        }
        voutNum ++;
    }
    let txIdAndVout = Buffer.concat([txIdBuffer, voutBuffer]);

    let sha256vout =  bitcoinjs.crypto.sha256(txIdAndVout);
    let scAddress =  bitcoinjs.crypto.ripemd160(sha256vout);

    return scAddress.toString('hex');
}

function hasOpCreate(vout){
    return vout.scriptPubKey.asm.indexOf('OP_CREATE') !== -1;
}

function number2Buffer(num) {
    var buffer = []
    var neg = (num < 0)
    num = Math.abs(num)
    while(num) {
        buffer[buffer.length] = num & 0xff
        num = num >> 8
    }

    var top = buffer[buffer.length - 1]
    if (top & 0x80) {
        buffer[buffer.length] = neg ? 0x80 : 0x00
    }
    else if (neg) {
        buffer[buffer.length - 1] = top | 0x80;
    }
    return Buffer.from(buffer)
}

function hex2Buffer(hexString) {
    var buffer = []
    for (var i = 0; i < hexString.length; i += 2) {
        buffer[buffer.length] = (parseInt(hexString[i], 16) << 4) | parseInt(hexString[i+1], 16)
    }
    return Buffer.from(buffer)
}


exports.selectTxs= selectTxs,
exports.buildPubKeyHashTransaction= buildPubKeyHashTransaction,
exports.buildCreateContractTransaction= buildCreateContractTransaction,
exports.buildSendToContractTransaction= buildSendToContractTransaction,
exports.getContractAddress= getContractAddress
