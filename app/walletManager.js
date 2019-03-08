const nsExit = require("nativescript-exit")
const globalVars = require("./globalVars")
const sqlite = require("nativescript-sqlite")
const dataManager = require("./dataManager")
const bip39 = require("bip39")
const Btc = require("bitcoinjs-lib")
const crypto = require("crypto-js")
const httpModule = require("http")
const connectivityModule = require("tns-core-modules/connectivity")
const dialogs = require("tns-core-modules/ui/dialogs");
const axios = require("axios")
const dashboard = require("./views/dashboard/dashboard")
const sendPage = require("./views/sendFabcoins/sendFabcoins")
const receivePage = require("./views/receiveFabcoins/receiveFabcoins")
const txHistoryPage = require("./views/transactionHistory/transactionHistory")

var insomnia = require("nativescript-insomnia");
const platform = require("tns-core-modules/platform")

const abi = require("web3-eth-abi")
const scUtil = require("./smartContractUtil");
var BigNumber = require('bignumber.js')
var OPS = require('qtum-opcodes')
var Buffer = require('safe-buffer').Buffer
var reverseInplace = require("buffer-reverse/inplace")
const bs58 = require("bs58");

var currentChangeIndex = 0;
var currentReceiveIndex = 0;

var fee = 0.00003000; //this is to keep things simple for the first version. It will be calculated dynamically in the later versions
var feePerVin = 0.00000300;

var currentBalance = 0

var myUtxo = new Array()
var myTxHistory = new Array() //it may be advisable to only keep 100 latest transactions in the memory
var mySpentBuffer = new Array()
var myTokens = new Array();

var currentBalance = 0
var synchronizeActive = true;

var idleTime = 0
var isInitialized = false

var myConnection = false;

var myApiEndPoint;

var getCurrentApiEndpoint = function () {
    return myApiEndPoint;
}

var getUtxoCount = function () {
    return myUtxo.length;
}

var wait = (ms) => {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

var getFlatFee = function () {
    return fee;
}

var getFeePerVin = function () {
    return feePerVin;
}

var utxoObj = function (type, addrIdx, txid, txidx, amount, height, confirmations, id) {

    this.Id = id;
    this.Type = type;
    this.AddressIndex = addrIdx;
    this.TxId = txid;
    this.TxIdx = txidx;
    this.Amount = amount;
    this.Height = height;
    this.Confirmations = confirmations;
}

var spentBufferObject = function (type, addrIdx, txid, utxoTxId, txidx, amount, height, confirmations, id) {
    this.Id = id;
    this.Type = type;
    this.AddressIndex = addrIdx;
    this.TxId = txid;
    this.UtxoTxId = utxoTxId;
    this.TxIdx = txidx;
    this.Amount = amount;
    this.Height = height;
    this.Confirmations = confirmations;
}

var txHistoryObj = function (type, date, amount, txFee, txId, sentTo, confirmations, comment, id) {

    this.Id = id;
    this.Type = type;
    this.Date = date;
    this.Amount = amount;
    this.TxFee = txFee;
    this.TxId = txId;
    this.SentTo = sentTo;
    this.Confirmations = confirmations;
    this.Comment = comment;
}


var tokenObj = function (contractAddress, localWalletAddress, name, symbol, balance) {
    this.ContractAddress = contractAddress;
    this.LocalWalletAddress = localWalletAddress;
    this.Name = name;
    this.Symbol = symbol;
    this.Balance = balance;
}

class TokenHistory {

    constructor(tokenName, tokenAmount, fabcoinAmount, type, txId, toAddress, time, confirmations) {
        this.TokenName = tokenName;
        this.Type = type;
        this.TokenAmount = tokenAmount;
        this.ToAddress = toAddress;
        this.TxId = txId;
        this.Time = time;
        this.Confirmations = confirmations;
        this.FabcoinAmount = fabcoinAmount;
    }
}

var init = function () {

    if (isInitialized) return

    isInitialized = true;


    insomnia.keepAwake()

    //testing purposes only 
    // dataManager.clearTable(globalVars.databaseObjects.myTokensTable.name)
    // dataManager.clearTable(globalVars.databaseObjects.tokenHistoryTable.name)

    //testing purposes only
    // clearTable(globalVars.databaseObjects.utxoTable.name)
    //    / dataManager.showTable(globalVars.databaseObjects.utxoTable.name)

    readUtxoFromDatabase();
    readMyTokensFromDatabase();
    readSpentBufferFromDatabase()
    readTxHistoryFromDatabase();

    updateCurrentBalance();
    setChangeAndReceiveIndex()

    synchronizeActive = false;

    //check interval every minute
    setInterval(exitTest, 60000)

    setCurrentApiEndpoint()

}

var setCurrentApiEndpoint = async function () {


    //testing purposes only
    //remove after testing is completed 
    myApiEndPoint = "";
    return;


    let p = globalVars.apiEndPoints;
    //Math.random returns a number between 0 and 1  
    let s = Math.floor(Math.random() * 100) % p.length;

    let r = await getApiEndpointAvailability(p[s])

    if (r === true) {
        myApiEndPoint = p[s]
    }
    else if (r === false) {

        for (let i = 0; i < p.length; i++) {

            let res = await getApiEndpointAvailability(p[i])
            if (res === true) {
                myApiEndPoint = p[i]

                break;
            }
        }
    }

    async function getApiEndpointAvailability(apiEndpoint) {

        let isConnected = false;
        axios.default.get(apiEndpoint + globalVars.apiExistAddress + getAddress(globalVars.addressType.receive, 0)).then(function (res) {
            isConnected = true
        }).catch(function (e) {
            isConnected = false;
        })

        //3 senconds is the maximum time within which the response should be received
        await wait(3000)
        return isConnected
    }
}

var isPositiveNumber = function (s) {
    let p = String(s);

    if (Number(p) !== NaN && isFinite(Number(p)) && Number(p) > 0) return true
    return false
}

//refresh idle time
var setIdleTime = function () {
    idleTime = 0;
}

//exit after 30 minutes of inactivity
function exitTest() {
    idleTime = idleTime + 1;
    if (idleTime > 29) {
        exit()
    }
}

var readUtxoFromDatabase = function () {

    myUtxo = []
    currentBalance = 0;
    new sqlite(globalVars.databaseObjects.name, function (err, db) {
        db.all("SELECT * FROM " + globalVars.databaseObjects.utxoTable.name, function (err, rows) {
            rows.forEach(row => {
                //  myUtxo.push(new utxoObj(row[0], row[1], row[2], row[3], row[4], row[5], row[6]));
                myUtxo.push(new utxoObj(row[1], row[2], row[3], row[4], row[5], row[6], row[7], row[0]));
                currentBalance += Number(row[5]);
            })
        })
    })
}

var readMyTokensFromDatabase = function () {

    myTokens = [];

    new sqlite(globalVars.databaseObjects.name, function (err, db) {

        db.all("SELECT * FROM " + globalVars.databaseObjects.myTokensTable.name, function (err, rows) {

            if (rows.length === 0) return;
            rows.forEach(row => {
                myTokens.push(new tokenObj(row[1], row[2], row[3], row[4], row[5]))
            })
        })
    })
    // console.log(myTokens)
}

exports.getMyTokens = function () {
    return myTokens;
}


var readSpentBufferFromDatabase = function () {

    mySpentBuffer = []
    new sqlite(globalVars.databaseObjects.name, function (err, db) {
        db.all("SELECT * FROM " + globalVars.databaseObjects.spentBufferTable.name, function (err, rows) {
            rows.forEach(row => {
                mySpentBuffer.push(new spentBufferObject(row[1], row[2], row[3], row[4], row[5], row[6], row[7], row[8], row[0]));
            })
        })
    })
}

var readTxHistoryFromDatabase = function () {
    myTxHistory = []
    new sqlite(globalVars.databaseObjects.name, function (err, db) {
        db.all("SELECT * FROM " + globalVars.databaseObjects.TransactionHistoryTable.name, function (err, rows) {
            rows.forEach(row => {
                //console.log(row)
                myTxHistory.unshift(new txHistoryObj(row[1], row[2], row[3], row[4], row[5], row[6], row[7], row[8]))
            })
        })
    })
}

var getTokenHistoryFromDatabase = function () {

    let tokenHistory = [];

    new sqlite(globalVars.databaseObjects.name, function (err, db) {
        db.all("SELECT * FROM " + globalVars.databaseObjects.tokenHistoryTable.name, function (err, rows) {
            rows.forEach(row => {
                // console.log(row)
                tokenHistory.unshift(new TokenHistory(row[1], row[2], row[3], row[4], row[5], row[6], row[7], -1))
            })
        })
    })

    return tokenHistory;

}

var setChangeAndReceiveIndex = function () {

    if (dataManager.tableExists(globalVars.databaseObjects.addressIndexTable.name)) {
        new sqlite(globalVars.databaseObjects.name, function (err, db) {
            //0 is for change index
            db.get("SELECT idx FROM AddressIndex WHERE id = 0", function (err, elem) {
                currentChangeIndex = Number(elem)
            })
            //1 is for receive index
            db.get("SELECT idx FROM AddressIndex WHERE id = 1", function (err, elem) {
                currentReceiveIndex = Number(elem)

            })
        })
    }
}

var checkLastReceiveAddressesForReceiptOfFunds = async function () {

    let startIndex = 0;
    let maxUtxoIndex = 0;
    let val = 0;

    if (currentReceiveIndex > 100) {
        startIndex = currentReceiveIndex - 98;
    }


    let c = await checkAddressesForUtxo(globalVars.addressType.receive, startIndex, 100)


    //this function will need to be called multiple times or the 
    //worlflow to get the fabcoin balance for the addresses associated 
    // with the tokens will need to be updated
    //this is required because when the last addresses that are being 
    //checked in the function above does not include addresses associated 
    // with the tokens
    //We are using first 5 addresses to be able to receive tokens 

  /*  let tokenAddressBalance = await getLatestAddressBalance(getAddress(globalVars.addressType.receive, 0));
    tokenAddressBalance += await getLatestAddressBalance(getAddress(globalVars.addressType.receive, 1));
    tokenAddressBalance += await getLatestAddressBalance(getAddress(globalVars.addressType.receive, 2));
    tokenAddressBalance += await getLatestAddressBalance(getAddress(globalVars.addressType.receive, 3));
    tokenAddressBalance += await getLatestAddressBalance(getAddress(globalVars.addressType.receive, 4));*/

    let tokenAddressBalance =  0

    //if start index is 0, the addresses are already accounted for in the previous call
    if(startIndex > 0) tokenAddressBalance = await checkAddressesForUtxo(globalVars.addressType.receive,0,5);

    // console.log(tokenAddressBalance)
    val = c.value + (tokenAddressBalance > 0) ? tokenAddressBalance : 0; 

    if (val > 0) {
        dialogs.alert({ title: globalVars.messageObjects.fabcoinsReceived, message: globalVars.messageObjects.youHaveReceived + val + globalVars.messageObjects.fabcoins, okButtonText: globalVars.messageObjects.Ok })
        txHistoryPage.resetTxHistory()
    }
}

var exit = function () {
    //all the exit action related actions may be performed here
    nsExit.exit()
}

var getReceiveAddress = async function () {

    let rAddress;
    if (dataManager.tableExists(globalVars.databaseObjects.addressIndexTable.name)) {
        await new sqlite(globalVars.databaseObjects.name, function (err, db) {
            db.get("SELECT idx FROM AddressIndex WHERE id = 1", function (err, elem) {
                let r = Number(elem)
                db.get("SELECT Address FROM ReceiveAddressList WHERE Idx = " + r, function (err, elem) {
                    rAddress = elem[0]
                })
            })
        })
        return rAddress;
    }
}

var askForPassword = async function () {


    let r = await dialogs.prompt({
        title: globalVars.messageObjects.showMnemonics,
        message: globalVars.messageObjects.kindlyEnterPasswordToCompleteThisAction,
        okButtonText: globalVars.messageObjects.confirm,
        cancelButtonText: globalVars.messageObjects.cancel,
        inputType: dialogs.inputType.password
    })

    let b = verifyUserPassword(r.text);
    r.text = "**********************"
    return b;

}

var getChangeObject = async function () {

    let cAddress;
    let idx = 0;
    if (dataManager.tableExists(globalVars.databaseObjects.addressIndexTable.name)) {
        await new sqlite(globalVars.databaseObjects.name, function (err, db) {
            db.get("SELECT idx FROM AddressIndex WHERE id = 0", function (err, elem) {

                let r = Number(elem)
                db.get("SELECT Address FROM ChangeAddressList WHERE Idx = " + r, function (err, elem) {

                    cAddress = {
                        addrIndex: r,
                        address: elem[0]
                    }
                })
            })
        })
        return cAddress;
    }
}

var getReceiveObject = async function () {

    let rAddress;
    let idx = 0;
    if (dataManager.tableExists(globalVars.databaseObjects.addressIndexTable.name)) {
        await new sqlite(globalVars.databaseObjects.name, function (err, db) {
            db.get("SELECT idx FROM AddressIndex WHERE id = 1", function (err, elem) {
                let r = Number(elem)
                db.get("SELECT Address FROM ReceiveAddressList WHERE Idx = " + r, function (err, elem) {
                    rAddress = {
                        addrIndex: r,
                        address: elem[0]
                    }
                })
            })
        })
        return rAddress;
    }
}

//to be tested
var getAddress = function (addressType, idx) {

    //if the index is more then the available addresses, return the last address
    let p = getMaxAvailableAddressIndex(addressType);

    if (p < idx) idx = p - 1

    let address;

    if (addressType === globalVars.addressType.change) {

        new sqlite(globalVars.databaseObjects.name, function (err, db) {

            db.get("SELECT Address FROM ChangeAddressList WHERE Idx = " + idx, function (err, elem) {
                address = elem[0]
                if (elem == null) address = false
            })

        })
        return address;

    }
    else if (addressType === globalVars.addressType.receive) {
        new sqlite(globalVars.databaseObjects.name, function (err, db) {

            db.get("SELECT Address FROM ReceiveAddressList WHERE Idx = " + idx, function (err, elem) {
                address = elem[0]
                if (elem == null) address = false
            })

        })
        return address;
    }
}



var generateChangeAddresses = function (mn) {

    let seed = bip39.mnemonicToSeed(mn)
    mn = "*******************************************************************"
    let masterNode = Btc.HDNode.fromSeedBuffer(seed, globalVars.currentNetwork);
    let changeNode = masterNode.derivePath("m/44/0'/0'/1") //1 is for change address


    new sqlite(globalVars.databaseObjects.name, function (err, db) {

        let b;
        db.get("SELECT COUNT(*) FROM ChangeAddressList", function (err, elem) {
            b = elem[0]
        })

        let k = b + 100
        for (let i = b; i < k; i++) {
            let c = changeNode.derive(i).getAddress()
            db.execSQL("INSERT INTO ChangeAddressList (Idx, Address, IsUsed) VALUES (?,?,?)", [i, c, 0], function (err, id) {
                if (err) throw (err)

            })
        }
    })

    seed = "******************************************************"
    masterNode = "******************************************************"
    changeNode = "******************************************************"

    return 0
}

var generateReceiveAddresses = function (mn) {

    let seed = bip39.mnemonicToSeed(mn)
    mn = "*******************************************************************"
    let masterNode = Btc.HDNode.fromSeedBuffer(seed, globalVars.currentNetwork);
    let receiveNode = masterNode.derivePath("m/44/0'/0'/0") // 0 is for receive address 

    new sqlite(globalVars.databaseObjects.name, function (err, db) {

        let b;
        db.get("SELECT COUNT(*) FROM ReceiveAddressList", function (err, elem) {
            b = elem[0]
        })


        let k = b + 100
        for (let i = b; i < k; i++) {

            let r = receiveNode.derive(i).getAddress()
            db.execSQL("INSERT INTO ReceiveAddressList (Idx, Address, IsUsed) VALUES (?,?,?)", [i, r, 0], function (err, id) {
                if (err) throw (err)
            })
        }
    })

    seed = "******************************************************"
    masterNode = "******************************************************"
    receiveNode = "******************************************************"


    return 0
}

var saveMnemonics = async function (mn, pd) {


    if (await dataManager.tableExists(globalVars.databaseObjects.MnemonicTable.name)) {
        await dataManager.dropTable(globalVars.databaseObjects.MnemonicTable.name)
    }


    await new sqlite(globalVars.databaseObjects.name, function (err, db) {
        db.execSQL("CREATE TABLE Mnemonics (id INTEGER PRIMARY KEY, mnemonic TEXT)", [], function (err) {
            let k = crypto.PBKDF2(pd, getUuid(), { keySize: 32, iterations: 1500 })
            let encMn = crypto.AES.encrypt(mn, k.toString())

            //let encMn = crypto.AES.encrypt(mn, pd) //encrypted Mnemonic
            db.execSQL("INSERT INTO Mnemonics (mnemonic) VALUES (?)", [encMn], function (err, id) {

            })
        })
    })

    mn = "*************"
    pd = "*************"


    return 0
}


var savePin = async function (pin) {

    if (await dataManager.tableExists(globalVars.databaseObjects.PinTable.name)) {
        await dataManager.dropTable(globalVars.databaseObjects.PinTable.name)
    }


    await new sqlite(globalVars.databaseObjects.name, function (err, db) {
        db.execSQL("CREATE TABLE Pin (id INTEGER PRIMARY KEY, pin TEXT)", [], function (err) {

            let h = new crypto.PBKDF2(pin, 'fabcoin', { keySize: 32, iterations: 500 }) //encrypted Mnemonic
            db.execSQL("INSERT INTO Pin (pin) VALUES (?)", [h], function (err, id) {

                h = "*********************************************"
                pin = "*************************************"
            })
        })
    })
}

var setUuid = function () {

    if (dataManager.tableExists(globalVars.databaseObjects.uuidTable.name)) {
        dataManager.dropTable(globalVars.databaseObjects.uuidTable.name)
    }

    new sqlite(globalVars.databaseObjects.name, function (err, db) {
        db.execSQL("CREATE TABLE Uuid (id INTEGER PRIMARY KEY, uuid TEXT)", [], function (err) {
            let uuid = platform.device.uuid;
            db.execSQL("INSERT INTO Uuid (uuid) VALUES (?)", [uuid], function (err, id) {

            })
        })
    })
}

var getUuid = function () {
    let uuid;
    new sqlite(globalVars.databaseObjects.name, function (err, db) {
        db.get("SELECT uuid FROM Uuid WHERE id = 1", function (err, element) {
            uuid = element[0]
        })
    })

    return uuid;
}

var getSpendableBalance = function (deductFeeFromSendAmount) {


    let spendableBalance = 0;
    let flatFee = fee;
    // let feePerVin = 0.00000100
    let count = 0;
    let maxCount = 100;

    if (deductFeeFromSendAmount) {

        while (count < maxCount && count < myUtxo.length) {
            spendableBalance += Number(myUtxo[count].Amount)
            count++;
        }

    }
    else {

        spendableBalance -= flatFee;
        balancePlusFee = spendableBalance;
        let currentUtxoTotal = 0
        let cBalance = getCurrentBalance()

        while (count < maxCount) {
            if (count < myUtxo.length && spendableBalance < cBalance) {
                spendableBalance = spendableBalance + Number(myUtxo[count].Amount) - feePerVin
                count++;

            }
            else {
                break;
            }

        }
    }

    return Number(spendableBalance.toFixed(8));
}

var sendFabcoins = async function (receiversAddress, amount, deductFeeFromSendAmount, comment) {



    checkInternetConnection()
    await wait(3000);

    let t1 = new Date().getTime()
    let inputTx = new Array()

    //let mySendAmount = Number(amount);
    let mySendAmount = convertToLiu(amount)
    let currentUtxoTotal = Number(0);
    //    let myTxFee = Number(fee);
    let myTxFee = convertToLiu(fee);
    let myVinCount = 0;
    let myChangeAmount = 0;



    if (deductFeeFromSendAmount) {

        while (currentUtxoTotal < mySendAmount) {

            //exception handling
            if (myVinCount === myUtxo.length) break;
            // console.log(myUtxo[myVinCount])

            //this means that the utxo is a coinbase transaction and was not mature at the time of synchronization.
            if (myUtxo[myVinCount].Confirmations < 0) { // this means - confirmation of -1.

                //check here if the transaction is matured yet
                let x = await isUtxoSpendable(myUtxo[myVinCount])
                //  console.log(x)
                if (!x) {
                    // console.log("not spendable")
                    // console.log(myUtxo[myVinCount])
                    myVinCount++;
                    continue;
                }
            }

            // console.log("Spendable")
            // console.log(myUtxo[myVinCount])

            inputTx.push(myUtxo[myVinCount])
            // currentUtxoTotal += Number(myUtxo[myVinCount].Amount)
            currentUtxoTotal += convertToLiu(myUtxo[myVinCount].Amount)
            myVinCount++;
            //myTxFee += Number(feePerVin.toFixed(8))
            myTxFee += convertToLiu(feePerVin.toFixed(8))
            //  console.log(myVinCount, myTxFee, mySendAmount, currentUtxoTotal)

            /*
            if (!x) {
                console.log("not spendable")
                console.log(myUtxo[myVinCount])
                myVinCount++;
                continue;
            }
            else {
                inputTx.push(myUtxo[myVinCount])
                // currentUtxoTotal += Number(myUtxo[myVinCount].Amount)
                currentUtxoTotal += convertToLiu(myUtxo[myVinCount].Amount)
                myVinCount++;
                //myTxFee += Number(feePerVin.toFixed(8))
                myTxFee += convertToLiu(feePerVin.toFixed(8))
                //  console.log(myVinCount, myTxFee, mySendAmount, currentUtxoTotal)
            }
            */

        }
    }
    else {

        //myTxFee += feePerVin
        while (currentUtxoTotal < (mySendAmount + myTxFee)) {


            //exception handling
            if (myVinCount === myUtxo.length) break;

            // console.log("brfore", myVinCount, myTxFee, mySendAmount, currentUtxoTotal, (mySendAmount + myTxFee))



            //this means that the utxo is a coinbase transaction and was not mature at the time of synchronization.
            if (myUtxo[myVinCount].Confirmations < 0) { // this means - confirmation of -1.

                //check here if the transaction is matured yet
                let x = await isUtxoSpendable(myUtxo[myVinCount])
                //  console.log(x)
                if (!x) {
                    //console.log("not spendable")
                    //console.log(myUtxo[myVinCount])
                    myVinCount++;
                    continue;
                }
            }

            // console.log("Spendable")
            // console.log(myUtxo[myVinCount])

            inputTx.push(myUtxo[myVinCount])
            // currentUtxoTotal += Number(myUtxo[myVinCount].Amount)
            currentUtxoTotal += convertToLiu(myUtxo[myVinCount].Amount)
            myVinCount++;
            //myTxFee += Number(feePerVin.toFixed(8))
            myTxFee += convertToLiu(feePerVin.toFixed(8))




            /* let x = await isUtxoSpendable(myUtxo[myVinCount])
             console.log(x)
 
             if (!x) {
                 console.log("not spendable")
                 console.log(myUtxo[myVinCount])
                 myVinCount++;
                 continue;
             }
             else {
                 inputTx.push(myUtxo[myVinCount])
                 //  console.log(1)
                 //  currentUtxoTotal += Number(myUtxo[myVinCount].Amount)
                 currentUtxoTotal += convertToLiu(myUtxo[myVinCount].Amount)
                 myVinCount++;
                 // myTxFee += Number(feePerVin.toFixed(8))
                 myTxFee += convertToLiu(feePerVin)
                 //  console.log(myVinCount, myTxFee, mySendAmount, currentUtxoTotal, (mySendAmount + myTxFee))
             }*/
        }
    }

    //console.log("input transactions")
    // console.log(inputTx)
    //  / return

    //here, give error if the current utxo total is less then the amount to be sent
    // as it may be less then ideal to check the spendable balance every time the user tries to send fabcoins.
    //after the warning, return.
    if ((deductFeeFromSendAmount && currentUtxoTotal < mySendAmount) ||
        (!deductFeeFromSendAmount && currentUtxoTotal < (mySendAmount + myTxFee))) {

        let amount = (deductFeeFromSendAmount) ? currentUtxoTotal : currentUtxoTotal - myTxFee;

        dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.internalUtxoAreCoinbaseNotMature_YouCanSpend + " " + (convertLiuToFabcoin(amount)) + " " + globalVars.messageObjects.FABAsOfNow, okButtonText: globalVars.messageObjects.Ok })
        //console.log("here error")  
        return;
    }


    //currentUtxoTotal = Number(currentUtxoTotal.toFixed(8))


    let Transaction = new Btc.TransactionBuilder(globalVars.currentNetwork)

    /*    for (let k = 0; k < inputTx.length; k++) {
            Transaction.addInput(myUtxo[k].TxId, myUtxo[k].TxIdx)
        }
    */

    for (let k = 0; k < inputTx.length; k++) {
        Transaction.addInput(inputTx[k].TxId, inputTx[k].TxIdx)
    }

    let changeObj = await getChangeObject();


    let changeAddress = changeObj.address
    let changeAddressIndex = changeObj.addrIndex

    if (deductFeeFromSendAmount) {

        // myChangeAmount = convertToLiu(Number(currentUtxoTotal - mySendAmount))
        myChangeAmount = currentUtxoTotal - mySendAmount
        // Transaction.addOutput(receiversAddress, convertToLiu(mySendAmount - myTxFee))
        Transaction.addOutput(receiversAddress, (mySendAmount - myTxFee))
    }
    else {

        // myChangeAmount = convertToLiu(Number(currentUtxoTotal - mySendAmount - myTxFee))
        myChangeAmount = (currentUtxoTotal - mySendAmount - myTxFee)
        //Transaction.addOutput(receiversAddress, convertToLiu(mySendAmount))
        Transaction.addOutput(receiversAddress, mySendAmount)
    }






    //let amtForDisplay = (deductFeeFromSendAmount) ? (mySendAmount - myTxFee).toFixed(8) : mySendAmount.toFixed(8)

    let amtForDisplay = (deductFeeFromSendAmount) ? (mySendAmount - myTxFee) : mySendAmount
    amtForDisplay = convertLiuToFabcoin(amtForDisplay)

    // console.log(myChangeAmount,globalVars.minimumThresholdAmount)
    // return;
    //must convert to liu in order to get the correct change amount
    if (myChangeAmount > convertToLiu(globalVars.minimumThresholdAmount)) {
        Transaction.addOutput(changeAddress, myChangeAmount)
    }

    let r = await dialogs.prompt({
        title: globalVars.messageObjects.sendFabcoin,
        message: globalVars.messageObjects.kindlyCheckTxDetailsAndEnterPassword + "\n" + globalVars.messageObjects.to + " : " + receiversAddress + "\n" + globalVars.messageObjects.amount + " : " + amtForDisplay + "\n" + globalVars.messageObjects.transactionFee + " : " + convertLiuToFabcoin(myTxFee),
        okButtonText: globalVars.messageObjects.confirm,
        cancelButtonText: globalVars.messageObjects.cancel,
        inputType: dialogs.inputType.password
    })



    //user clicked cancel
    if (r.result === false) return

    //console.log(mySendAmount, myTxFee, myVinCount, currentUtxoTotal, myChangeAmount, amtForDisplay)



    if (!verifyPasswordHash(crypto.PBKDF2(r.text, getUuid(), { keySize: 32, iterations: 1000 }))) {
        //show warning and return
        dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.passwordIncorrect, okButtonText: globalVars.messageObjects.Ok });
        return
    }
    else {

        let encMn = getElementFromTable("Mnemonics", "mnemonic", "id", "1")
        let k = crypto.PBKDF2(r.text, getUuid(), { keySize: 32, iterations: 1500 })
        // let mn = crypto.AES.decrypt(encMn, r.text).toString(crypto.enc.Utf8);
        let mn = crypto.AES.decrypt(encMn, k.toString()).toString(crypto.enc.Utf8);

        let seed = bip39.mnemonicToSeed(mn)
        let masterNode = Btc.HDNode.fromSeedBuffer(seed, globalVars.currentNetwork);
        let changeNode = masterNode.derivePath("m/44/0'/0'/1") //1 is for change address
        let receiveNode = masterNode.derivePath("m/44/0'/0'/0") // 0 is for receive address 

        for (let k = inputTx.length - 1; k >= 0; k--) {

            let utxo = inputTx[k]

            let keypair = 0;

            if (utxo.Type === globalVars.addressType.change) {
                keypair = changeNode.derive(utxo.AddressIndex).keyPair;
            }
            else if (utxo.Type === globalVars.addressType.receive) {
                keypair = receiveNode.derive(utxo.AddressIndex).keyPair;
            }

            // let keypair = getKeypair(utxo.Type, utxo.AddressIndex)
            Transaction.sign(k, keypair)

        }
    }

    r.text = "**************"

    let TxHex = Transaction.build().toHex();
    let TxId = Transaction.build().getId();

    //the transaction is now ready to be broadcast
    //send the transaction out and update utxo,history and balance accordingly

    //TESTIING - Remove/alter after testing is completed

    //  console.log(TxId);
    // console.log(TxHex)

    // return;

    let t2 = new Date().getTime()

    // console.log((t2 - t1) + " ms for signing");

    //send the transaction using the POST method and handle appropriate response/error
    // await axios.post("http://fabexplorer.info:9001/fabapi/sendrawtransaction", { txhex: TxHex }).then(function (response) {

    //console.log(myApiEndPoint + globalVars.apiSendTx+TxHex)

    //testing purposes only
    myApiEndPoint = globalVars.apiEndPoints[0]

    // console.log(globalVars.apiSendTx)
    // console.dir(TxHex)
    //  console.log(myApiEndPoint + globalVars.apiSendTx + TxHex)
    // await axios.post(myApiEndPoint + globalVars.apiSendTx, { txhex: TxHex }).then(function (response) {

    console.log(globalVars.apiSendTx)
    console.log(TxHex)

    await axios.post(globalVars.apiSendTx, { txhex: TxHex }).then(function (response) {
        //console.log("reseponse")
        //console.log(response.data)
        //This is the txid - console.log(response.data)
        //AT this point, The transaction was successful
        //increase the change index so that a new change address can be used for next transaction
        //remove the spent utxos from the UTXOTable and move it to Spentbuffer      

        for (let k = 0; k < inputTx.length; k++) {
            removeFromUtxo(inputTx[k].TxId, inputTx[k].TxIdx)

            //here, also add the same to the spent buffer
            addToSpentBuffer(inputTx[k].Type, inputTx[k].AddressIndex, TxId, inputTx[k].TxId, inputTx[k].TxIdx, inputTx[k].Amount, inputTx[k].Height, inputTx[k].confirmations)

        }

        // console.log(myChangeAmount, convertToLiu(globalVars.minimumThresholdAmount))
        //add the change address utxo to the database

        if (myChangeAmount > convertToLiu(globalVars.minimumThresholdAmount)) {
            // addToUtxo(globalVars.addressType.change, changeAddressIndex, TxId, 1, Number((myChangeAmount * 1e-8).toFixed(8)), 1, 1)
            addToUtxo(globalVars.addressType.change, changeAddressIndex, TxId, 1, convertLiuToFabcoin(myChangeAmount), 1, 1)
            increaseChangeIndex()
        }

        // add to the transaction history
        if (deductFeeFromSendAmount) {
            //addToTxHistory(globalVars.addressType.send, getCurrentTimeStamp(), (mySendAmount - myTxFee), myTxFee, TxId, receiversAddress, 1, comment);
            addToTxHistory(globalVars.addressType.send, getCurrentTimeStamp(), convertLiuToFabcoin(mySendAmount - myTxFee), convertLiuToFabcoin(myTxFee), TxId, receiversAddress, 1, comment);
        }
        else {
            // addToTxHistory(globalVars.addressType.send, getCurrentTimeStamp(), (mySendAmount), myTxFee, TxId, receiversAddress, 1, comment);
            addToTxHistory(globalVars.addressType.send, getCurrentTimeStamp(), convertLiuToFabcoin(mySendAmount), convertLiuToFabcoin(myTxFee), TxId, receiversAddress, 1, comment);
        }
        //update utxo
        readUtxoFromDatabase()
        //update balance
        updateCurrentBalance()

        let t3 = new Date().getTime()
        //   console.log((t3 - t2) + " ms for sending.")
        dialogs.alert({ title: globalVars.messageObjects.fabcoinsSent, message: globalVars.messageObjects.sendTransactionSubmitted, okButtonText: globalVars.messageObjects.Ok })



    }).catch(function (error) {
        // console.log(error)
        //show appropriate alert
        dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.sendErrorMessage + "\n" + error, okButtonText: globalVars.messageObjects.Ok })
    })
}

var convertToLiu = function (amount) {
    return Math.round(amount * 1e8) // Math.floor(amount * 1e8)
}

var convertLiuToFabcoin = function (amount) {
    return Number(Number(amount * 1e-8).toFixed(8))
}


var removeFromUtxo = function (txid, txidx) {

    new sqlite(globalVars.databaseObjects.name, function (err, db) {
        let qry = "DELETE FROM UtxoTable WHERE TxId = '" + txid + "' AND TxIdx = " + txidx
        db.execSQL(qry, function (err) {

        })
    })
}

var removeFromSpentBuffer = function (txid) {
    new sqlite(globalVars.databaseObjects.name, function (err, db) {
        let qry = "DELETE FROM " + globalVars.databaseObjects.spentBufferTable.name + " WHERE TxId = '" + txid + "'"

        db.execSQL(qry, function (err) {

        })

    })

    readSpentBufferFromDatabase()
}

var addToSpentBuffer = function (type, addrIdx, txid, utxoTxId, txidx, amount, height, confirmations) {

    mySpentBuffer.push(new spentBufferObject(type, addrIdx, txid, utxoTxId, txidx, amount, height, confirmations))
    // also add to database
    new sqlite(globalVars.databaseObjects.name, function (err, db) {
        db.execSQL("INSERT INTO SpentBufferTable (Type,AddressIndex,TxId,UtxoTxId,TxIdx,Amount,Height,Confirmations) VALUES (?,?,?,?,?,?,?,?)", [type, addrIdx, txid, utxoTxId, txidx, amount, height, confirmations], function (err) {

        })
    })
}

var increaseReceiveIndex = function () {

    currentReceiveIndex += 1;

    if (tableExists(globalVars.databaseObjects.addressIndexTable.name)) {
        new sqlite(globalVars.databaseObjects.name, function (err, db) {
            //1 is for recive index
            let qryString = "UPDATE AddressIndex SET idx = " + currentReceiveIndex + " WHERE id = 1"
            db.execSQL(qryString, function (err, id) {

            })
        })
    }
}

var increaseChangeIndex = function () {

    currentChangeIndex += 1;

    //testing only
    //currentChangeIndex = 0


    if (tableExists(globalVars.databaseObjects.addressIndexTable.name)) {
        new sqlite(globalVars.databaseObjects.name, function (err, db) {

            //0 is for change index

            let qryString = "UPDATE AddressIndex SET idx = " + currentChangeIndex + " WHERE id = 0"

            db.execSQL(qryString, function (err, id) {

            })
        })
    }
}


var addToTxHistory = function (type, date, amount, txFee, txId, sentTo, confirmations, comment) {

    myTxHistory.unshift(new txHistoryObj(type, date, amount, txFee, txId, sentTo, confirmations, comment))
    new sqlite(globalVars.databaseObjects.name, function (err, db) {

        db.execSQL("INSERT INTO TransactionHistory (Type,Date,Amount,TxFee,TxId,SentTo,Confirmations,Comment) VALUES (?,?,?,?,?,?,?,?)", [type, date, amount, txFee, txId, sentTo, confirmations, comment], function (err) {

            // showTxHistory()
        })
    })
}

var addToTokenHistory = function (tokenName, txType, tokenAmount, toAddress, txId, time, confirmations, fabcoinAmount) {

    console.log(tokenName, txType, txId, tokenAmount, time, confirmations)
    new sqlite(globalVars.databaseObjects.name, function (err, db) {
        db.execSQL("INSERT INTO TokenHistory (TokenName, TxType, TokenAmount, FabcoinAmount, ToAddress,TxId, Time) VALUES (?,?,?,?,?,?,?)", [tokenName, txType, tokenAmount, fabcoinAmount, toAddress, txId, time], function (err) { if (err) { console.log(err); throw err; } })
        if (err) { console.log(err); throw err; }
    })
}

var getElementFromTable = function (tableName, reqColumnName, rowName, rowId) {

    var result
    let queryString = "SELECT " + reqColumnName + " FROM " + tableName + " WHERE " + rowName + " = " + rowId

    new sqlite("fabPass.db", function (err, db) {
        db.all(queryString, function (err, element) {

            //sHash = element
            if (err !== null) {
                result = err
            }
            else {
                result = element[0][0]

            }
        })
    })
    return result
}

var verifyUserPassword = function (userPassword) {


    var uHash = new crypto.PBKDF2(userPassword, getUuid(), { keySize: 32, iterations: 1000 })
    var sHash;

    var isValid = false

    new sqlite("fabPass.db", function (err, db) {
        db.get("SELECT pass FROM Pass WHERE id = 1", function (err, element) {

            sHash = element
        })
    })

    if (String(uHash) === String(sHash)) isValid = true


    userPassword = "*******************"

    return isValid
}

var verifyPasswordHash = function (pHash) {

    let isValid = false
    let sHash = ""

    new sqlite("fabPass.db", function (err, db) {
        db.get("SELECT pass FROM Pass WHERE id = 1", function (err, element) {
            sHash = element
        })
    })

    if (String(pHash) === String(sHash)) isValid = true

    pHash = "*******************"

    return isValid

}

var verifyUserPin = function (userPin) {

    let u = getUuid()

    var uHash = new crypto.PBKDF2(userPin, u, { keySize: 32, iterations: 500 })

    var sHash;

    var isValid = false

    new sqlite("fabPass.db", function (err, db) {
        db.get("SELECT pin FROM Pin WHERE id = 1", function (err, element) {
            sHash = element
        })
    })


    if (String(uHash) === String(sHash)) isValid = true

    userPin = "*******************"

    return isValid
}

//If the difference between available addresses and used addresses is less then 100, new addresses will need to be generated. In this case, the password is required
var areNewReceiveAddressesRequired = async function () {

    let isRequired = false
    let maxReceiveIndex = 0

    if (getMaxAvailableAddressIndex(globalVars.addressType.receive) === 0) {
        return true;
    }

    await new sqlite(globalVars.databaseObjects.name, function (err, db) {
        db.get("SELECT * FROM ReceiveAddressList WHERE Idx = (SELECT MAX(Idx) FROM ReceiveAddressList)", function (err, row) {
            maxReceiveIndex = Number(row[0]) - 20 //first element of the row is Index

        })

        db.get("SELECT IsUsed FROM ReceiveAddressList WHERE Idx = " + maxReceiveIndex, function (err, row) {


            let tmp = row[0]

            if (tmp === 0) {
                isRequired = false
            }
            else {
                isRequired = true
            }
        })
    })


    return isRequired

}

//If the difference between available change addresses and used addresses is less then 100, new addresses will need to be generated. In this case, the password is required
var areNewChangeAddressesRequired = async function () {

    let isRequired = false
    let maxChangeIndex = 0

    if (getMaxAvailableAddressIndex(globalVars.addressType.change) === 0) {
        return true;
    }

    await new sqlite(globalVars.databaseObjects.name, function (err, db) {
        db.get("SELECT * FROM ChangeAddressList WHERE Idx = (SELECT MAX(Idx) FROM ChangeAddressList)", function (err, row) {
            maxChangeIndex = Number(row[0]) - 20 //first element of the row is Index
        })


        db.get("SELECT IsUsed FROM ChangeAddressList WHERE Idx = " + maxChangeIndex, function (err, row) {


            let tmp = row[0]


            if (tmp === 0) {
                isRequired = false
            }
            else {
                isRequired = true
            }
        })
    })



    return isRequired

}


var checkInternetConnection = async function () {

    myConnection = false;
    let connectionType = connectivityModule.getConnectionType();
    if (connectionType === connectivityModule.connectionType.none) {
        return -1; //no internet
    }
    else {
        let cAddress = await getAddress(globalVars.addressType.change, 0)
        //  let res = await httpModule.request({ url: globalVars.configURLExistAddress + cAddress, method: 'GET', timeout: 2000 }).then(response => {
        let res = await httpModule.request({ url: myApiEndPoint + globalVars.apiExistAddress + cAddress, method: 'GET', timeout: 2000 }).then(response => {
            let ll = response.content
            if (Boolean(ll) === true || Boolean(ll) === false) {
                // internet is working
                myConnection = true;
                return 1
            }
            else return 0 //connection timed out
        }, (e) => {
            return 0 //api malfunction
        })
        return res;
    }
}


var addToken = function (contractAddress, localWalletAddress, name, symbol, balance) {

    let isTokenPresent = false;
    myTokens.forEach(function (token) {
        // console.log(token)
        if (token.ContractAddress === contractAddress) {
            isTokenPresent = true;
        }
    })

    //  console.log(contractAddress, name, symbol, balance, isTokenPresent)


    if (isTokenPresent) return;

    myTokens.push(new tokenObj(contractAddress, localWalletAddress, name, symbol, balance))

    new sqlite(globalVars.databaseObjects.name, function (err, db) {

        db.execSQL("INSERT INTO MyTokens (ContractAddress, LocalWalletAddress, TokenName,TokenSymbol,Balance) VALUES (?,?,?,?,?)", [contractAddress, localWalletAddress, name, symbol, balance], function (err) {
            throw (err)
        })
    })
}


var setAddressUsed = function (addressType, addressIndex) {

    let qry;

    if (addressType === globalVars.addressType.change) {
        qry = "UPDATE ChangeAddressList SET IsUsed = 1 WHERE Idx = " + addressIndex
    }
    else if (addressType === globalVars.addressType.receive) {
        qry = "UPDATE ReceiveAddressList SET IsUsed = 1 WHERE Idx = " + addressIndex
    }

    new sqlite(globalVars.databaseObjects.name, function (err, db) {
        db.execSQL(qry, function (err, id) {

        })
    })

}


var checkAddressesForUtxo = async function (addressType, startIndex, numAddresses) {

    let maxUtxoIndex = 0;
    let val = 0;
    let addressArray = new Array();
    let qry;
    let utxoPresent = false;

    if (addressType === globalVars.addressType.change) {
        qry = "SELECT Address FROM ChangeAddressList WHERE Idx >= " + startIndex + " AND Idx < " + (startIndex + numAddresses)
    }
    else if (addressType === globalVars.addressType.receive) {
        qry = "SELECT Address FROM ReceiveAddressList WHERE Idx >= " + startIndex + " AND Idx < " + (startIndex + numAddresses)
    }

    new sqlite(globalVars.databaseObjects.name, function (err, db) {
        db.all(qry, function (err, rows) {
            rows.forEach(function (el, idx) {
                addressArray.push({
                    idx: Number(idx + startIndex),
                    address: el[0]
                })
            })
        })
    })

    //let mUrl = "http://fabtest.info:8666/transactions?"
    //let mUrl = globalVars.configURLUtxo
    // let mUrl = myApiEndPoint + globalVars.apiUtxo


    let mUrl = globalVars.apiUtxo
    for (let i = 0; i < numAddresses; i++) {
        if (i === 0) mUrl += "address=" + addressArray[i].address
        else mUrl += "&address=" + addressArray[i].address
    }

    let response = await axios.default.get(mUrl)


    let latestBlockHeight = 0;
    //this call gives the latest blockchain height. 
    // latestBlockHeight = (await axios.default.get("http://192.168.1.183:9001/fabapi/getblockchaininfo")).data.blocks;
    latestBlockHeight = (await axios.default.get("http://fabtest.info:9001/fabapi/getblockchaininfo")).data.blocks;
    //  console.log("latest block height : "+ latestBlockHeight)

    //here, check if the transaction is a coinbase transaction
    //the coinbase transaction is unspendable until it has at least 800 confirmations.
    // check here for all the transactions that has less then 800 confirmations if they are coinbase transactions
    // if they are coinbase transaction, set the confirmations to be -1. that way it can be identified as a transaction that is immature and cannot be spent

    


    let mUtxo = new Array()
    mUtxo = response.data.result
    //console.log(mUtxo)

    for (let i = 0; i < mUtxo.length; i++) {
        if (mUtxo[i].utxos.length > 0) {
            utxoPresent = true
            for (j = 0; j < mUtxo[i].utxos.length; j++) {

                let utxo = mUtxo[i].utxos[j]
                let utxoIndex = findIndex(mUtxo[i].address, i)

                maxUtxoIndex = utxoIndex;

                let confirmations = latestBlockHeight - utxo.block + 1;

                if (confirmations < 801) {

                    let spendable = true;
                    let tx = await axios.default.get(globalVars.apiGetTx + utxo.txid + "/true")
                    let isCoinBase = tx.data.vin[0].hasOwnProperty('coinbase')
                    if (isCoinBase) spendable = false;

                    // console.log("utxo spendable : " , spendable)

                    if (!spendable) {
                        confirmations = -1;
                    }
                }

                let utxoPresentInLocalDatabase = isUtxoPresent(addressType, utxoIndex, utxo.txid, utxo.sequence, utxo.value, utxo.block, confirmations)

                if (!utxoPresentInLocalDatabase) {
                    val += utxo.value
                }
            }
        }
    }

 
    function findIndex(address, idx) {
        if (addressArray[idx].address === address) {
            return addressArray[idx].idx
        }
        else {
            for (let i = 0; i < addressArray.length; i++) {
                if (addressArray[i].address === address) {
                    return addressArray[i].idx
                }
            }
        }
    }


    let newReceiveIndex = 0
    let newChangeIndex = 0;
    if (addressType === globalVars.addressType.receive) {

        newReceiveIndex = maxUtxoIndex + 1

        if (newReceiveIndex > currentReceiveIndex) {
            setReceiveIndex(newReceiveIndex)
        }
    }
    else if (addressType === globalVars.addressType.change) {
        newChangeIndex = maxUtxoIndex + 1
        if (newChangeIndex > currentChangeIndex) {
            setChangeIndex(newChangeIndex)
        }
    }

    return {
        value: val,
        utxoPresent: utxoPresent
    }

}

var checkAddressForExistance = async function (address) {

    // let present = (await axios.get(globalVars.configURLExistAddress + address)).data
    let present = (await axios.get(myApiEndPoint + globalVars.apiExistAddress + address)).data

    if (!(present === true || present === false)) {
        return -1
    }

    return present;


}

var getMaxAvailableAddressIndex = function (addressType) {

    let qry;
    if (addressType === globalVars.addressType.receive) {
        qry = "SELECT COUNT(*) FROM ReceiveAddressList"
    }
    else if (addressType === globalVars.addressType.change) {
        qry = "SELECT COUNT(*) FROM ChangeAddressList"
    }

    let num = 0;
    new sqlite(globalVars.databaseObjects.name, function (err, db) {
        db.get(qry, function (err, elem) {
            num = elem[0]
        })
    })

    //as this returns count, index will be one less then count

    return num;
}

//Exclusive function for restore wallet workflow
//Use it for strictly restore function only
var restoreWallet = async function (mn) {

    let maxAvailableReceiveIdx = 0;
    let maxAvailableChangeIdx = 0;

    let crawlReceiveChain = true;
    let crawlChangeChain = true;

    //take care of receive addresses
    //while 80th address is true or there is utxo available 

    //todo : turn all address isused to 1 before the index(current change and current recive) after the loop finishes 

    while (crawlReceiveChain) {



        generateReceiveAddresses(mn)

        if (myApiEndPoint === undefined) {
            await setCurrentApiEndpoint()
        }

     
        maxAvailableReceiveIdx = getMaxAvailableAddressIndex(globalVars.addressType.receive)


        let c = await checkAddressesForUtxo(globalVars.addressType.receive, maxAvailableReceiveIdx - 100, 100)


        let ad = getAddress(globalVars.addressType.receive, maxAvailableReceiveIdx - 20)

        let is80thAddressPresent = await checkAddressForExistance(ad)

      
        if (is80thAddressPresent === true || c.utxoPresent) {
            crawlReceiveChain = true
        }
        else {
            crawlReceiveChain = false
        }
    }

    while (crawlChangeChain) {

        generateChangeAddresses(mn)
        maxAvailableChangeIdx = getMaxAvailableAddressIndex(globalVars.addressType.change)
        let c = await checkAddressesForUtxo(globalVars.addressType.change, maxAvailableChangeIdx - 100, 100)


        let ad = getAddress(globalVars.addressType.change, maxAvailableChangeIdx - 20)
        let is80thAddressPresent = await checkAddressForExistance(ad)

        if (is80thAddressPresent === true || c.utxoPresent) {
            crawlChangeChain = true
        }
        else {
            crawlChangeChain = false
        }


    }


    new sqlite(globalVars.databaseObjects.name, function (err, db) {

        //turn all the isused brfore currentindex in receive and change chain to one 

        //for change address table
        for (let i = 0; i < currentChangeIndex; i++) {
            db.execSQL("UPDATE ChangeAddressList SET IsUsed = 1 WHERE Idx = " + i, function (err, id) {

            })
        }

        //for receive address table
        for (let i = 0; i < currentReceiveIndex; i++) {
            db.execSQL("UPDATE ReceiveAddressList SET IsUsed = 1 WHERE Idx = " + i, function (err, id) {

            })
        }
    })

}


var synchronize = async function () {

    //validateCurrentUtxos()



    //check internet connection before proceeding further
    checkInternetConnection()
    await wait(4000);

    if (!myConnection) {
        //try to reset the api endpoint first before giving the error
        await setCurrentApiEndpoint()
        checkInternetConnection()
        await wait(3000);
    }


    if (!myConnection) {

        dialogs.alert({
            title: globalVars.messageObjects.error, message:
                globalVars.messageObjects.connectionTimeout + "\n" + globalVars.messageObjects.kindlyResetConnectionOrTryAfterSomeTime, okButtonText: globalVars.messageObjects.Ok
        })
        return false;
    }


    synchronizeActive = true;

    //TODO rethink this strategy
    dataManager.clearTable(globalVars.databaseObjects.utxoTable.name)
    myUtxo = []
    mySpentBuffer = []

    let maxAvailableReceiveIdx = 0;
    let maxAvailableChangeIdx = 0;

    let cChangeIdx = 0;
    let cReceiveIdx = 0;

    let crawlReceiveChain = true;
    let crawlChangeChain = true;


    while (crawlReceiveChain) {

        // generateReceiveAddresses(mn)

        maxAvailableReceiveIdx = getMaxAvailableAddressIndex(globalVars.addressType.receive)

        if (cReceiveIdx + 1 >= maxAvailableReceiveIdx) {
            crawlReceiveChain = false;
            break;
            //generateReceiveAddresses(mn)
        }

        let c = await checkAddressesForUtxo(globalVars.addressType.receive, cReceiveIdx, 100)

        let ad = getAddress(globalVars.addressType.receive, cReceiveIdx + 80)

        let is80thAddressPresent = await checkAddressForExistance(ad)

        if (is80thAddressPresent === true) {
            crawlReceiveChain = true
            cReceiveIdx += 100
        }
        else {
            crawlReceiveChain = false
        }
    }

    while (crawlChangeChain) {

        maxAvailableChangeIdx = getMaxAvailableAddressIndex(globalVars.addressType.change)

        if (cChangeIdx + 1 >= maxAvailableChangeIdx) {
            crawlChangeChain = false;
            break;
            // generateChangeAddresses(mn)
        }

        let c = await checkAddressesForUtxo(globalVars.addressType.change, cChangeIdx, 100)

        let ad = getAddress(globalVars.addressType.change, cChangeIdx + 80)
        let is80thAddressPresent = await checkAddressForExistance(ad)

        if (is80thAddressPresent === true) {
            crawlChangeChain = true
            cChangeIdx += 100
        }
        else {
            crawlChangeChain = false
        }
    }


    readSpentBufferFromDatabase()
    readUtxoFromDatabase()
    updateCurrentBalance()
    synchronizeActive = false;

    return true;
}

var setChangeIndex = function (cIdx) {

    currentChangeIndex = cIdx;
    if (tableExists(globalVars.databaseObjects.addressIndexTable.name)) {
        new sqlite(globalVars.databaseObjects.name, function (err, db) {
            //0 is for change index
            let qryString = "UPDATE AddressIndex SET idx = " + cIdx + " WHERE id = 0"
            db.execSQL(qryString, function (err, id) {

            })
        })
    }
}

var setReceiveIndex = function (rIdx) {

    currentReceiveIndex = rIdx;
    if (tableExists(globalVars.databaseObjects.addressIndexTable.name)) {
        new sqlite(globalVars.databaseObjects.name, function (err, db) {
            //1 is for receive index
            let qryString = "UPDATE AddressIndex SET idx = " + rIdx + " WHERE id = 1"
            db.execSQL(qryString, function (err, id) {

            })
        })
    }
}


var isUtxoPresent = function (type, addrIdx, txid, txidx, amount, height, confirmations) {
    //here, if the utxo is already present in the spentbuffer, no need to add it again
    if (mySpentBuffer.length > 0)
        for (let k = 0; k < mySpentBuffer.length; k++) {
            let tmp = mySpentBuffer[k]
            if (tmp.UtxoTxId === txid && tmp.TxIdx === txidx) {
                isPresent = true;
                return true
            }
        }


    let t = 0;
    if (myUtxo.length > 0)
        for (var k = 0; k < myUtxo.length; k++) {
            utxo = myUtxo[k]
            if (utxo.TxId === txid && utxo.TxIdx === txidx) {

                isPresent = true
                return true
            }
        }

    //if not present, add the utxo to local database
    addToUtxo(type, addrIdx, txid, txidx, amount, height, confirmations)
    updateCurrentBalance()

    return false;
}

//THIS function will not be imported. It will be called internally
var addToUtxo = function (type, addrIdx, txid, txidx, amount, height, confirmations) {

    //If this function is called, It means that new UTXO has been received.
    myUtxo.push(new utxoObj(type, addrIdx, txid, txidx, amount, height, confirmations))

    currentBalance = Number(currentBalance) + Number(amount)
    // also add to database
    new sqlite("fabPass.db", function (err, db) {
        db.execSQL("INSERT INTO UtxoTable (Type,AddressIndex,TxId,TxIdx,Amount,Height,Confirmations) VALUES (?,?,?,?,?,?,?)", [type, addrIdx, txid, txidx, amount, height, confirmations], function (err) {
            updateCurrentBalance()
        })
    })

    //change address should not be a part of transaction history
    if (type === globalVars.addressType.receive) {
        //before adding to tx history , check if it already exists
        let isPresentInTxHistory = false
        for (let i = 0; i < myTxHistory.length; i++) {
            if (myTxHistory[i].TxId === txid && myTxHistory[i].Type === type && (myTxHistory[i].Amount - amount) < 0.000001) {
                isPresentInTxHistory = true
                break;
            }
        }
        if (!isPresentInTxHistory) {
            addToTxHistory(type, getCurrentTimeStamp(), amount, 0, txid, 0, 1, "None")
        }


    }

    //increament/set the receive index or change index depending upon the "type"
    setAddressUsed(type, addrIdx)
}

var updateCurrentBalance = function () {

    currentBalance = Number(currentBalance).toFixed(8)
    dashboard.updateBalance(currentBalance)
    receivePage.updateBalance(currentBalance)
    sendPage.updateBalance(currentBalance)

}

var getCurrentTimeStamp = function () {

    let d = new Date()
    let o = d.getTimezoneOffset()
    let d1 = new Date(d - o).getTime()

    return d1;
}

var checkSpentTxConfirmations = async function () {

    if (mySpentBuffer.length === 0) return;

    let p = mySpentBuffer[0]
    // let confirmations = await httpModule.request({ url: globalVars.configURLGetTx + p.TxId + "/true", method: 'GET', timeout: 2000 }).then(response => {
    let confirmations = await httpModule.request({ url: myApiEndPoint + globalVars.apiGetTx + p.TxId + "/true", method: 'GET', timeout: 2000 }).then(response => {
        let ll = JSON.parse(response.content).confirmations
        return ll
    }, (e) => {
        return -1 //no utxo present
    })

    if (confirmations > getMaxNumCnf()) {
        removeFromSpentBuffer(p.TxId)
    }

    //TODO - figure out a way to put the transactions back in the utxo if they don't get confirmed
}

var getMaxNumCnf = function () {

    /* if(appSettings.hasKey(globalVars.appSettingsObjects.confirmationCutoff)){
         return appSettings.getNumber(globalVars.appSettingsObjects.confirmationCutoff)
     }
     else{
         //if the default cuttoff is not set
         return 30 //default is 30
     }*/

    //let default confirmations be 30
    return 30

}

var tableExists = function (tableName) {

    var tmp = false;

    new sqlite("fabPass.db", function (err, db) {
        db.get("SELECT count(*) FROM sqlite_master WHERE type = 'table' AND name = ?", [tableName], function (err, table) {

            if (err !== null) {
                tmp = false
            }
            if (Number(table) === 0) {
                tmp = false
            }

            if (Number(table) === 1) {
                tmp = true
            }
        })
    })

    return tmp
}

var getCurrentBalance = function () {
    return currentBalance;
}

var getSynchronizeActive = function () {
    return synchronizeActive
}

var getTxHistory = function () {
    return myTxHistory;
}

var deleteWallet = function () {

    //TODO - overwrite all the hashes and encryptions before deleting

    dataManager.dropAllTables();
}

var deletePin = function () {
    dataManager.dropTable(globalVars.databaseObjects.pinTable.name);
}

var bs58ToVmAddress = function (address) {

    let x = bs58.decode(address).toString('hex');

    //strip the first 1 and last 4 bytes..

    x = x.substring(2);
    x = x.substring(0, x.length - 8)

    return x;
}

var isStringHex = function (s) {
    for (let i = 0; i < s.length; i++) {
        if (isNaN(parseInt(s[i], 16)))
            return false
    }
    return true;
}


function number2Buffer(num) {
    var buffer = []
    var neg = (num < 0)
    num = Math.abs(num)
    while (num) {
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
        buffer[buffer.length] = (parseInt(hexString[i], 16) << 4) | parseInt(hexString[i + 1], 16)
    }
    return Buffer.from(buffer)
}

var stripHexPrefix = function (str) {
    if (str.length > 2 && str[0] === '0' && str[1] === 'x') {
        return str.slice(2);
    }
    return str;
}

var updateTokenBalance = function (contractAddress, tokenBalance) {

    if (tableExists(globalVars.databaseObjects.myTokensTable.name)) {

        new sqlite(globalVars.databaseObjects.name, function (err, db) {

            let qryString = "UPDATE " + globalVars.databaseObjects.myTokensTable.name + " SET " + globalVars.databaseObjects.myTokensTable.balance + " = " +
                tokenBalance + " WHERE " + globalVars.databaseObjects.myTokensTable.contractAddress +
                " = \"" + contractAddress + "\"";

            // console.log(qryString)
            db.execSQL(qryString, function (err, id) {
                // console.log(id)
                if (err) {
                    console.log("Error")
                    console.log(err)
                }
            })

        })

    }

    readMyTokensFromDatabase()

}

//This function does not need the localwalletaddress input since, by design , the database contains only one entry for any given contract address
var getLocalBalanceOfToken = function (contractAddress) {

    let b = 0;

    console.log(contractAddress)
    let queryString = "SELECT " + globalVars.databaseObjects.myTokensTable.balance + " FROM " + globalVars.databaseObjects.myTokensTable.name + " WHERE " +
        globalVars.databaseObjects.myTokensTable.contractAddress + " = \"" + contractAddress + "\""

    console.log(queryString)
    new sqlite(globalVars.databaseObjects.name, function (err, db) {
        db.all(queryString, function (err, element) {

            console.log(element)
            //sHash = element
            if (err !== null) {
                b = err
            }
            else {
                b = element[0][0]
                console.log(b)
            }
        })
    })


    return b;
}


//This function may optinally include Local wallets receive Address as an argument
//It may be required when the wallet lets users choose the address for token receipt
var getTokenBalance = async function (contractAddress, tokenName, localWalletAddress) {


    let localBalanceOfToken = getLocalBalanceOfToken(contractAddress);

    console.log(localBalanceOfToken)

    let balance = 0;
    let fxnOutputs = globalVars.testErcAbi[5].outputs;
    let fxnCallHex;
    let myAddress = (localWalletAddress) ? localWalletAddress : getAddress(globalVars.addressType.receive, 0) //default token address is 0th wallet address , This condition is set in case the local wallet address is not provided.

    myAddress = bs58ToVmAddress(myAddress)
    let parameters = [myAddress]
    fxnCallHex = abi.encodeFunctionCall(
        globalVars.testErcAbi[5],
        parameters);

    function stripHexPrefix(str) {
        if (str.length > 2 && str[0] === '0' && str[1] === 'x') {
            return str.slice(2);
        }
        return str;
    }

    fxnCallHex = stripHexPrefix(fxnCallHex);
    //  await axios.default.post("http://18.236.243.130:9001/fabapi/callcontract", [contractAddress, fxnCallHex]).then(Response => {
    //temporary fix only, revert to original ip when smart contract is stabilized
    //await axios.default.post("http://192.168.1.183:9001/fabapi/callcontract", [contractAddress, fxnCallHex]).then(Response => {
    await axios.default.post("http://fabtest.info:9001/fabapi/callcontract", [contractAddress, fxnCallHex]).then(Response => {
        let x = Response.data.executionResult.output;
        let p = abi.decodeParameters(fxnOutputs, x)[0]

        balance = p;
    }).catch((e) => {
        console.log("error")
        console.log(e)
    })

    if (localBalanceOfToken !== balance) {
        updateTokenBalance(contractAddress, balance)


        if (localBalanceOfToken < balance) {
            //this means that new tokens have been received
            //and no fabcoins were spent
            //addToTokenHistory(tokenName, "receive", balance - localBalanceOfToken, "none", "none", Date.now(), -1, 0)
            addToTokenHistory(tokenName, globalVars.tokenTransactionType.receive, balance - localBalanceOfToken, "none", "none", Date.now(), -1, 0)
        }
    }


    return balance;
}

var getTokenBuyPrice = async function (contractAddress) {

    let price = 0;
    let fxnOutputs = globalVars.testErcAbi[12].outputs;
    let fxnCallHex;

    //this may change later on
    let myAddress = getAddress(globalVars.addressType.receive, 0)

    myAddress = bs58ToVmAddress(myAddress)

    // let parameters = [myAddress]
    let parameters = []

    fxnCallHex = abi.encodeFunctionCall(
        globalVars.testErcAbi[12],
        parameters);



    function stripHexPrefix(str) {
        if (str.length > 2 && str[0] === '0' && str[1] === 'x') {
            return str.slice(2);
        }
        return str;
    }


    fxnCallHex = stripHexPrefix(fxnCallHex);
    //console.log(contractAddress,fxnCallHex);
    //  await axios.default.post("http://18.236.243.130:9001/fabapi/callcontract", [contractAddress, fxnCallHex]).then(Response => {
    //temporary fix only, revert to original ip when smart contract is stabilized
    //await axios.default.post("http://192.168.1.183:9001/fabapi/callcontract", [contractAddress, fxnCallHex]).then(Response => {
    await axios.default.post("http://fabtest.info:9001/fabapi/callcontract", [contractAddress, fxnCallHex]).then(Response => {
        let x = Response.data.executionResult.output;
        let p = abi.decodeParameters(fxnOutputs, x)[0]

        price = p;
    }).catch((e) => {
        console.log("error")
        console.log(e)
    })

    //console.log("Token Buy Price : ",price)

    //the price is in liu, hence convert it into Fabcoins
    price /= 1e8;

    return price;
}



var getTokenSellPrice = async function (contractAddress) {

    let price = 0;
    let fxnOutputs = globalVars.testErcAbi[14].outputs;
    let fxnCallHex;

    //this may change later on
    let myAddress = getAddress(globalVars.addressType.receive, 0)

    myAddress = bs58ToVmAddress(myAddress)

    // let parameters = [myAddress]
    let parameters = []

    fxnCallHex = abi.encodeFunctionCall(
        globalVars.testErcAbi[14],
        parameters);



    function stripHexPrefix(str) {
        if (str.length > 2 && str[0] === '0' && str[1] === 'x') {
            return str.slice(2);
        }
        return str;
    }


    fxnCallHex = stripHexPrefix(fxnCallHex);
    //console.log(contractAddress,fxnCallHex);
    //  await axios.default.post("http://18.236.243.130:9001/fabapi/callcontract", [contractAddress, fxnCallHex]).then(Response => {
    //temporary fix only, revert to original ip when smart contract is stabilized
    //await axios.default.post("http://192.168.1.183:9001/fabapi/callcontract", [contractAddress, fxnCallHex]).then(Response => {
    await axios.default.post("http://fabtest.info:9001/fabapi/callcontract", [contractAddress, fxnCallHex]).then(Response => {
        let x = Response.data.executionResult.output;
        let p = abi.decodeParameters(fxnOutputs, x)[0]

        price = p;
    }).catch((e) => {
        console.log("error")
        console.log(e)
    })

    //console.log("Token Buy Price : ",price)

    //the price is in tokens for one liu. Hence for fabcoins,
    price /= 1e8;

    return price;
}

//this function checks if the transaction is coinbase and if coinbase, if it is matured or not
var isUtxoSpendable = async function (utxo) {


    //before this, make sure tha the transaction is actually coinbase. 
    //This is the only case when we need to check the number of confirmations.
    //The non - coinbase transactions in the local wallet will be indicated by the -1 confirmation.

    //    / console.log(utxo)

    if (utxo.Confirmations >= 0) return true; //this means that the given UTXO is a non-coinbase transaction and can be spent. 

    let tx = await axios.default.get(globalVars.apiGetTx + utxo.TxId + "/true")

    let conf = tx.data.confirmations
    let isCoinBase = tx.data.vin[0].hasOwnProperty('coinbase')

    // console.log(conf, isCoinBase)
    if (isCoinBase && conf <= 800) return false;

    return true;
}

//this function gets the latest utxo and updates the local utxo set and returns the latest spendable balance
var getLatestAddressBalance = async function (address) {



    //work in progress

    let mUrl = globalVars.apiUtxo + "address=" + address;
    let response = await axios.default.get(mUrl)

    let latestBlockHeight = 0;
    //this call gives the latest blockchain height. 
    // latestBlockHeight = (await axios.default.get("http://192.168.1.183:9001/fabapi/getblockchaininfo")).data.blocks;
    latestBlockHeight = (await axios.default.get("http://fabtest.info:9001/fabapi/getblockchaininfo")).data.blocks;
    //console.log("latest block height : "+ latestBlockHeight)

    let mUtxo = new Array()
    mUtxo = response.data.result
    // console.log(mUtxo)

    //assuming that wallet addresses associated with tokens will be only from the first 10 receive addresses
    let qry = "SELECT Address FROM ReceiveAddressList WHERE Idx >= 0 AND Idx < 10"
    let addressArray = new Array()
    new sqlite(globalVars.databaseObjects.name, function (err, db) {
        db.all(qry, function (err, rows) {
            rows.forEach(function (el, idx) {
                addressArray.push({
                    idx: Number(idx),
                    address: el[0]
                })
            })
        })
    })

    let idx = 0; //default address for token is receive 0


    addressArray.forEach(function (val, index) {
        if (val.address === address) idx = index;
    })

    //console.log(mUtxo)

    //mUtxo is an array with single element
    //this element contains the address that was queried for and an 
    //array of utxos.

    let utxos = new Array();
    utxos = mUtxo[0].utxos;

    let balance = 0;

    for (let i = 0; i < utxos.length; i++) {


        let utxo = utxos[i]

        let confirmations = latestBlockHeight - utxo.block + 1;
        //console.log(confirmations)

        if (confirmations < 801) {
            let spendable = true;
            let isCoinBase = (await axios.default.get(globalVars.apiGetTx + utxo.txid + "/true")).data.vin[0].hasOwnProperty('coinbase');
            if (isCoinBase) spendable = false;
            if (!spendable) {
                confirmations = -1;
            }
        }

        let utxoPresentInLocalDatabase = isUtxoPresent(globalVars.addressType.receive, idx, utxo.txid, utxo.sequence, utxo.value, utxo.block, confirmations)

        if (confirmations > 0) {
            balance += Number(utxo.value);
            // console.log("here",utxo.value,balance)
        }
    }

    // console.log("balance = "+balance)
    return Number(Number(balance.toFixed(8)).toString());
}

//this function only checks the local utxo and returns the spendable balance
var getAddressBalance = async function (address) {

    let balance = 0;

    for (let i = 0; i < myUtxo.length; i++) {

        let utxo = myUtxo[i]
        let spendable = await isUtxoSpendable(utxo)
        if (spendable) {
            let addr = getAddress(utxo.Type, utxo.AddressIndex)
            //  console.log(addr,address,(addr === address))
            if (addr === address) {
                balance += Number(utxo.Amount)
                //console.log("New Balance " ,balance)
            }
        }
    }

    /*await (myUtxo.forEach(async function(utxo){
        let spendable = await isUtxoSpendable(utxo)
        console.log(spendable)
        if (spendable) {
            let addr = getAddress(utxo.Type, utxo.AddressIndex)
            console.log(addr,address,(addr === address))
            if (addr === address) {
                balance += Number(utxo.Amount)
                console.log("New Balance " ,balance)
            }
        }
    }))*/

    return balance.toFixed(8);
}

var isValidVmAddress = function(address){
    return (isStringHex(address) && address.length === 40) ? true : false;
}

var sendTokens = async function (tokenName, contractAddress, toAddress, amount, addressForToken) {

    let gasLimit = 250000;
    let gasPrice = 40;
    let totalAmount = gasLimit * gasPrice / 1e8;
    let cFee = 3000 / 1e8 //fee for the transaction

    let totalFee = totalAmount + cFee;

    let inputs = [];

    let tmpAmount = 0;
    let i = 0;


    //-----------------------------------------------------------------------
    let fxnCallHex;
    if (isStringHex(toAddress) && toAddress.length === 40) { //this means that the address is already in hex format. no need to convert it again
        fxnCallHex = abi.encodeFunctionCall(globalVars.testErcAbi[7], [toAddress, amount])
    }
    else {
        fxnCallHex = abi.encodeFunctionCall(globalVars.testErcAbi[7], [bs58ToVmAddress(toAddress), amount])
    }

    fxnCallHex = stripHexPrefix(fxnCallHex)

    // console.log(fxnCallHex);
    let contract = Btc.script.compile([
        OPS.OP_4,
        number2Buffer(gasLimit),
        number2Buffer(gasPrice),
        hex2Buffer(fxnCallHex),
        hex2Buffer(contractAddress),
        OPS.OP_CALL
    ])

    let contractSize = contract.toJSON.toString().length;
    console.log(contractSize);

    //add some fee proprtional to the size of the contract.
    totalFee += convertLiuToFabcoin(contractSize * 10)

    while (tmpAmount < totalFee) {

        if (i === myUtxo.length) {
            //no more utxo
            enoughFabcoinsFound = false;
            break;
        }

        //New Strategy : check if the utxo address is same as the address associated with the token
        let utxoAddress = getAddress(globalVars.addressType.receive,myUtxo[i].AddressIndex)
    
        if(utxoAddress === addressForToken){
            if (await isUtxoSpendable(myUtxo[i])) {
                inputs.push(myUtxo[i])
                // console.log(isCoinBase, conf)
                //    / console.log(myUtxo[i])
                tmpAmount += Number(myUtxo[i].Amount);
                //also increase the fee as more UTXOs are added;
                totalFee += feePerVin
            }
        }
        i++;
    }

    if (inputs.length === 0) {
        //this means that the wallet address associated with the token is not valid.
        //Hence the wallet will not be able to sign the transaction with the address associated with the token

        await dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.addressDoesNotHaveFabcoins_kindlySendFabcoinsToThatAddress, okButtonText: globalVars.messageObjects.Ok })


        return -1;
    }

    //at this point, if the total is zero, the transaction will not go through
 
    i = 0;

    while (tmpAmount < totalFee) {

        if (i === myUtxo.length) {
            //no more utxo
            // console.log("Not Enough fabcoins")
           // enoughFabcoinsFound = false;

            //here, instead of return, an external function can be called that can fill utxos with enough fabcoins
            //the utxos CANNOT be the same as the ones found in the first receive address
            break;

            //    / return;
        }

        //here check if the transaction is mature
        //  console.log(globalVars.apiGetTx + myUtxo[i].TxId + "/true")

        //This stratagy may change later. Currently we are restricting the tokens to just one address : receive 0
        //This also means that the UTXO at Receive 0 must be spendable
        // if (!(myUtxo[i].Type === globalVars.addressType.receive && myUtxo[i].AddressIndex === 0)) {

        //fill the utxo array with the utxos from the addresses other then the address associated with the token 

        let utxoAddress = getAddress(globalVars.addressType.receive,myUtxo[i].AddressIndex)

        if(utxoAddress !== addressForToken) {
            if (await isUtxoSpendable(myUtxo[i])) {
                inputs.push(myUtxo[i])
                // console.log(isCoinBase, conf)
                //    / console.log(myUtxo[i])
                tmpAmount += Number(myUtxo[i].Amount);
                //also increase the fee as per the number of UTXOs.
                totalFee += feePerVin
            }
        }
        i++;
    }

    if (tmpAmount < totalFee) {
        await dialogs.alert({ title: globalVars.messageObjects.error, message:globalVars.messageObjects.notEnoughFabcoinsToProceedWithTransaction , okButtonText: globalVars.messageObjects.Ok })
        return -1;
    }

    totalFee = Number(totalFee.toFixed(8))
    //console.log("Total Fee", totalFee)



    let tx = new Btc.TransactionBuilder(globalVars.currentNetwork);

    for (let i = 0; i < inputs.length; i++) {

        tx.addInput(inputs[i].TxId, inputs[i].TxIdx)
    }

    //no need to send fabcoins to contract
    tx.addOutput(contract, 0);


    console.log(inputs[0].Type, inputs[0].AddressIndex)
   // return

    let fromAddress = getAddress(inputs[0].Type, inputs[0].AddressIndex);

    let changeAmount = Math.round((tmpAmount - totalFee) * 1e8);

    console.log("tmp Amount", tmpAmount)
    console.log("Change Amount ", changeAmount);


    //send the change amount back to the from address(address associated with tokens)
    if (tmpAmount > totalFee) {
        tx.addOutput(fromAddress, Math.round((tmpAmount - totalFee) * 1e8))
    }



    let r = await dialogs.prompt({
        title: globalVars.messageObjects.sendTokens,
        message: globalVars.messageObjects.kindlyCheckTxDetailsAndEnterPassword +"\n"+globalVars.messageObjects.to + " : " + toAddress + "\n" + globalVars.messageObjects.tokenAmount+ " : " + amount + "\n"+globalVars.messageObjects.fee + " : " + Number(totalFee.toFixed(8)).toString() + " " + globalVars.messageObjects.fabcoins , okButtonText: globalVars.messageObjects.confirm,
        cancelButtonText: globalVars.messageObjects.cancel,
        inputType: dialogs.inputType.password
    })


    if (!r.result) return -4;

    if (!verifyPasswordHash(crypto.PBKDF2(r.text, getUuid(), { keySize: 32, iterations: 1000 }))) {
        //show warning and return
        dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.passwordIncorrect, okButtonText: globalVars.messageObjects.Ok });
        return -4
    }

    let encMn = getElementFromTable("Mnemonics", "mnemonic", "id", "1")
    //testing only - ask for password in production
    // let k = crypto.PBKDF2("asdf1234%", getUuid(), { keySize: 32, iterations: 1500 })
    let k = crypto.PBKDF2(r.text, getUuid(), { keySize: 32, iterations: 1500 })
    r.text = "**********************************************"
    // let mn = crypto.AES.decrypt(encMn, r.text).toString(crypto.enc.Utf8);
    let mn = crypto.AES.decrypt(encMn, k.toString()).toString(crypto.enc.Utf8);

    let seed = bip39.mnemonicToSeed(mn)
    let masterNode = Btc.HDNode.fromSeedBuffer(seed, globalVars.currentNetwork);
    let changeNode = masterNode.derivePath("m/44/0'/0'/1") //1 is for change address
    let receiveNode = masterNode.derivePath("m/44/0'/0'/0") // 0 is for receive address 


    for (let k = inputs.length - 1; k >= 0; k--) {

        let utxo = inputs[k]

        let keypair = 0;

        if (utxo.Type === globalVars.addressType.change) {
            keypair = changeNode.derive(utxo.AddressIndex).keyPair;
        }
        else if (utxo.Type === globalVars.addressType.receive) {
            keypair = receiveNode.derive(utxo.AddressIndex).keyPair;
        }

        // let keypair = getKeypair(utxo.Type, utxo.AddressIndex)
        tx.sign(k, keypair)
    }

    let txHex = tx.build().toHex();
    // console.log(tx.build().getId())
    // console.log(txHex);
    // console.log(globalVars.apiSendTx)

    let res = false;



    //submit the transaction only after call contract is successful

    //  await axios.post("http://18.236.243.130:9001/fabapi/callcontract", [contractAddress, fxnCallHex,bs58ToVmAddress(fromAddress),gasLimit]).then((res) => {
    //let ss = await axios.post("http://192.168.1.183:9001/fabapi/callcontract", [contractAddress, fxnCallHex, bs58ToVmAddress(fromAddress)]).then((res) => {
    let ss = await axios.post("http://fabtest.info:9001/fabapi/callcontract", [contractAddress, fxnCallHex, bs58ToVmAddress(fromAddress)]).then((res) => {
        console.dir(res)
        let fxnOutputs = globalVars.testErcAbi[7].outputs;
        let x = res.data.executionResult.output
        let p;
        try {
            abi.decodeParameters(fxnOutputs, x)[0]
        }
        catch (e) {
            console.log("There was an error")
            console.log(e)
            //throw e; 
            return false;
        }
        return true;
        //excepted should be equal to "None"
        p = abi.decodeParameters(fxnOutputs, x)[0]
    }, (e) => {
        console.log("Error")
        console.log(e)
    })

    //console.log(ss)

    //this means that there was some issue with the call contract, hence the transaction is not valid
    if (!ss) return -2; //error with the call contract
    // return 


    // console.log(globalVars.apiSendTx, txHex)


    await axios.post(globalVars.apiSendTx, { txhex: txHex }).then(function (response) {


        let myTxId = response.data
        //  console.log(response.data)



        for (let k = 0; k < inputs.length; k++) {
            removeFromUtxo(inputs[k].TxId, inputs[k].TxIdx)

            addToSpentBuffer(inputs[k].Type, inputs[k].AddressIndex, myTxId, inputs[k].TxId, inputs[k].TxIdx, inputs[k].Amount, inputs[k].Height, inputs[k].confirmations)
        }

        //this may not necessarily be the case as the send trasaction call actually generates two transactions in the blockchain.
        //so the transaction ID that is returned may not necessarily be the one with the fabcoin change amount
        addToUtxo(inputs[0].Type, inputs[0].AddressIndex, myTxId, 1, convertLiuToFabcoin(changeAmount), 1, 1)

        //Adding to History - figure it out- TODO

        readUtxoFromDatabase();
        updateCurrentBalance();

        //will need to add  send to address
        //addToTokenHistory(tokenName, "send", amount, toAddress, myTxId, Date.now(), -1, totalFee)
        addToTokenHistory(tokenName, globalVars.tokenTransactionType.send, amount, toAddress, myTxId, Date.now(), -1, totalFee)

        res = true;
        //  console.log("After")
        //  dataManager.showTable(globalVars.databaseObjects.utxoTable.name)


    }).catch(function (error) {

        res = false;

        // console.log(error)
        //show appropriate alert
        dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.sendErrorMessage + "\n" + error, okButtonText: globalVars.messageObjects.Ok })

    })

    //console.log("here" , res)
    return (res) ? 1 : -3;
}

var buyTokens = async function (tokenName, contractAddress, addressForToken, tokenAmount, requiredFabcoins) {
    

    let gasLimit = 250000;
    let gasPrice = 40;
    let totalAmount = gasLimit * gasPrice / 1e8;
    let cFee = 3000 / 1e8

    let totalFee = totalAmount + cFee;
    let FabcoinsAndFee = totalFee + requiredFabcoins;
    let inputs = [];
    let tmpAmount = 0;
    let i = 0;
    let enoughFabcoinsFound = true





    let fxnCallHex = abi.encodeFunctionCall(globalVars.testErcAbi[13], [])

    fxnCallHex = stripHexPrefix(fxnCallHex)

    let contract = Btc.script.compile([
        OPS.OP_4,
        number2Buffer(gasLimit),
        number2Buffer(gasPrice),
        hex2Buffer(fxnCallHex),
        hex2Buffer(contractAddress),
        OPS.OP_CALL
    ])

    let contractSize = contract.toJSON.toString().length;

    /* There are three kinds of fabcoin payments required for this transaction
     * 1) Gas Fee for the contract - Some of which will come back
     * 2) Transaction Fee for the miner
     * 3) Payment in Fabcoins for buying Tokens, i.e. required Fabcoins
     */

    let gasFee = gasLimit * gasPrice / 1e8;
    let transactionFee = (3000 / 1e8) + convertLiuToFabcoin(contractSize * 10);

    // while (tmpAmount < FabcoinsAndFee) {
    while (tmpAmount < (requiredFabcoins + gasFee + transactionFee)) {
        if (i === myUtxo.length) {
            //no more utxo
            break;
        }

        let utxoAddress = getAddress(globalVars.addressType.receive, myUtxo[i].AddressIndex)

        if (utxoAddress === addressForToken) {
            if (await isUtxoSpendable(myUtxo[i])) {
                inputs.push(myUtxo[i])
                tmpAmount += Number(myUtxo[i].Amount);
                //also increase the fee as more UTXOs are added;
                transactionFee += feePerVin;
            }
        }
        i++;
    }

    if (inputs.length === 0) {
        //this means that the wallet address associated with the token does not have any utxo.
        //Hence the wallet will not be able to sign the transaction with the address associated with the token

        await dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.addressDoesNotHaveFabcoins_kindlySendFabcoinsToThatAddress, okButtonText: globalVars.messageObjects.Ok })


        return -1;
    }

    i = 0;


    //while (tmpAmount < FabcoinsAndFee) {
    while (tmpAmount < (requiredFabcoins + gasFee + transactionFee)) {
        if (i === myUtxo.length) {
            enoughFabcoinsFound = false;
            break;
        }

        let utxoAddress = getAddress(globalVars.addressType.receive, myUtxo[i].AddressIndex)

        if (utxoAddress !== addressForToken) {

            if (await isUtxoSpendable(myUtxo[i])) {
                inputs.push(myUtxo[i])
                tmpAmount += Number(myUtxo[i].Amount);
                //also increase the fee as more UTXOs are added;
                transactionFee += feePerVin;
            }
        }
        i++;
    }


    //if (tmpAmount < FabcoinsAndFee) {
    if(tmpAmount < (requiredFabcoins + gasFee + transactionFee)){
        await dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.notEnoughFabcoinsToProceedWithTransaction, okButtonText: globalVars.messageObjects.Ok })

        return -1;
    }

    gasFee = Number(gasFee.toFixed(8))
    transactionFee = Number(transactionFee.toFixed(8))
   // console.log(requiredFabcoins , gasFee , transactionFee)


    /*let fxnCallHex = abi.encodeFunctionCall(globalVars.testErcAbi[13], [])
    
    fxnCallHex = stripHexPrefix(fxnCallHex)
    
    let contract = Btc.script.compile([
        OPS.OP_4,
        number2Buffer(gasLimit),
        number2Buffer(gasPrice),
        hex2Buffer(fxnCallHex),
        hex2Buffer(contractAddress),
        OPS.OP_CALL
    ])*/

    let tx = new Btc.TransactionBuilder(globalVars.currentNetwork);

    for (let i = 0; i < inputs.length; i++) {

        tx.addInput(inputs[i].TxId, inputs[i].TxIdx)
    }


    //Give Fabcoins to contract so that it can be used by the contract to exchange tokens for fabcoins.
    tx.addOutput(contract, requiredFabcoins * 1e8)

    let fromAddress = getAddress(inputs[0].Type, inputs[0].AddressIndex);
    //let changeAmount = Math.round((tmpAmount - FabcoinsAndFee - totalFee) * 1e8);
    let changeAmount = Math.round((tmpAmount - requiredFabcoins - transactionFee - gasFee) * 1e8)

    console.log(tmpAmount,requiredFabcoins,gasFee,transactionFee, changeAmount/1e8)
   // return;

    /*if (tmpAmount > FabcoinsAndFee) {
        tx.addOutput(fromAddress, Math.round((tmpAmount - FabcoinsAndFee - totalFee) * 1e8))
    }*/

    if(changeAmount > 0 ){
        tx.addOutput(fromAddress,changeAmount)
    }

    let r = await dialogs.prompt({
        title: globalVars.messageObjects.buyTokens,
        message: globalVars.messageObjects.kindlyCheckTxDetailsAndEnterPassword + "\n" + globalVars.messageObjects.requestedTokenAmount +" : " + tokenAmount + "\n"+ globalVars.messageObjects.fabcoinsToBeSpent + " : " + Number(requiredFabcoins.toFixed(8)).toString() +" "+globalVars.messageObjects.fabcoins + "\n" + globalVars.messageObjects.gasFee + " : "+Number(gasFee.toFixed(8)).toString() + " "+globalVars.messageObjects.fabcoins + "\n" + globalVars.messageObjects.transactionFee +" : "+Number(transactionFee.toFixed(8)).toString() + " "+globalVars.messageObjects.fabcoins  , okButtonText: globalVars.messageObjects.confirm,
        cancelButtonText: globalVars.messageObjects.cancel,
        inputType: dialogs.inputType.password
    })


    if (!r.result) return -4;

    if (!verifyPasswordHash(crypto.PBKDF2(r.text, getUuid(), { keySize: 32, iterations: 1000 }))) {
        //show warning and return
        dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.passwordIncorrect, okButtonText: globalVars.messageObjects.Ok });
        return -4
    }
    let encMn = getElementFromTable("Mnemonics", "mnemonic", "id", "1")
    //testing only - ask for password in production
    // let k = crypto.PBKDF2("asdf1234%", getUuid(), { keySize: 32, iterations: 1500 })
    let k = crypto.PBKDF2(r.text, getUuid(), { keySize: 32, iterations: 1500 })
    r.text = "**********************************************"
    // let mn = crypto.AES.decrypt(encMn, r.text).toString(crypto.enc.Utf8);
    let mn = crypto.AES.decrypt(encMn, k.toString()).toString(crypto.enc.Utf8);

    let seed = bip39.mnemonicToSeed(mn)
    let masterNode = Btc.HDNode.fromSeedBuffer(seed, globalVars.currentNetwork);
    let changeNode = masterNode.derivePath("m/44/0'/0'/1") //1 is for change address
    let receiveNode = masterNode.derivePath("m/44/0'/0'/0") // 0 is for receive address 


    for (let k = inputs.length - 1; k >= 0; k--) {

        let utxo = inputs[k]

        let keypair = 0;

        if (utxo.Type === globalVars.addressType.change) {
            keypair = changeNode.derive(utxo.AddressIndex).keyPair;
        }
        else if (utxo.Type === globalVars.addressType.receive) {
            keypair = receiveNode.derive(utxo.AddressIndex).keyPair;
        }

        // let keypair = getKeypair(utxo.Type, utxo.AddressIndex)
        tx.sign(k, keypair)

    }

    let txHex = tx.build().toHex();

    let res = false;

    //let ss = await axios.post("http://192.168.1.183:9001/fabapi/callcontract", [contractAddress, fxnCallHex, bs58ToVmAddress(fromAddress)]).then((res) => {
    let ss = await axios.post("http://fabtest.info:9001/fabapi/callcontract", [contractAddress, fxnCallHex, bs58ToVmAddress(fromAddress)]).then((res) => {
        console.dir(res)
        let fxnOutputs = globalVars.testErcAbi[13].outputs;
        let x = res.data.executionResult.output
        let p;
        try {
            abi.decodeParameters(fxnOutputs, x)[0]


        }
        catch (e) {
            console.log("There was an error")
            console.log(e)
            //throw e; 
            return false;
        }

        return true;
        //excepted should be equal to "None"
        p = abi.decodeParameters(fxnOutputs, x)[0]

    }, (e) => {
        console.log("Error")
        console.log(e)
    })

    //if !ss, this means that there was some issue with the call contract, hence the transaction is not valid
    if (!ss) return -2; //error with the call contract

    console.log(inputs)
    console.log("======================Final Response=================")
    console.dir(txHex)

    console.log(globalVars.apiSendTx)

    //send the actual transaction
    await axios.post(globalVars.apiSendTx, { txhex: txHex }).then(function (response) {


        let myTxId = response.data
        console.log(response.data)



        for (let k = 0; k < inputs.length; k++) {
            removeFromUtxo(inputs[k].TxId, inputs[k].TxIdx)

            addToSpentBuffer(inputs[k].Type, inputs[k].AddressIndex, myTxId, inputs[k].TxId, inputs[k].TxIdx, inputs[k].Amount, inputs[k].Height, inputs[k].confirmations)
        }

        addToUtxo(inputs[0].Type, inputs[0].AddressIndex, myTxId, 1, convertLiuToFabcoin(changeAmount), 1, 1)

        //Adding to History - figure it out- TODO

        readUtxoFromDatabase();
        updateCurrentBalance();

       // addToTokenHistory(tokenName,"buy",tokenAmount,"none",myTxId,Date.now(0),-1,(requiredFabcoins + transactionFee + gasFee))
       addToTokenHistory(tokenName,globalVars.tokenTransactionType.buy,tokenAmount,"none",myTxId,Date.now(0),-1,(requiredFabcoins + transactionFee + gasFee))

        res = true;
        //  console.log("After")
        //  dataManager.showTable(globalVars.databaseObjects.utxoTable.name)

    }).catch(function (error) {

        res = false;

        console.log("Error")
        console.log(error)
        //show appropriate alert
        dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.sendErrorMessage + "\n" + error, okButtonText: globalVars.messageObjects.Ok })

    })


    console.log("here", res)
    return (res) ? 1 : -3;
}


//it is important to make sure that the first utxo in the transaction is the address associated with the token so that the transaction can be signed.
//This is to prove that the token is indeed owned by the address.
var sellTokens = async function (tokenName, contractAddress, addressForToken, tokenAmount, expectedFabcoins) {
    let gasLimit = 250000;
    let gasPrice = 40;
    let totalAmount = gasLimit * gasPrice / 1e8;
    let cFee = 3000 / 1e8 
    let totalFee = totalAmount + cFee;

    let inputs = [];

    let tmpAmount = 0;


    let i = 0;
    let enoughFabcoinsFound = false;

    let fxnCallHex = abi.encodeFunctionCall(globalVars.testErcAbi[15], [tokenAmount])

    fxnCallHex = stripHexPrefix(fxnCallHex)

    let contract = Btc.script.compile([
        OPS.OP_4,
        number2Buffer(gasLimit),
        number2Buffer(gasPrice),
        hex2Buffer(fxnCallHex),
        hex2Buffer(contractAddress),
        OPS.OP_CALL
    ])

    let contractSize = contract.toJSON.toString().length;
    totalFee += convertLiuToFabcoin(contractSize * 10)


    console.log(1)
    while (tmpAmount < totalFee) {

        if (i === myUtxo.length) {
            //no more utxo
            // console.log("Not Enough fabcoins")
            enoughFabcoinsFound = false;
            break;

            //    / return;
        }

        //here check if the transaction is mature
        //  console.log(globalVars.apiGetTx + myUtxo[i].TxId + "/true")

        //This stratagy may change later. Currently we are restricting the tokens to just one address : receive 0
        //This also means that the UTXO at Receive 0 must be spendable
        // if (myUtxo[i].Type === globalVars.addressType.receive && myUtxo[i].AddressIndex === 0) {
        //New Strategy : address index can now be available and custom address for the token can now be used

        let utxoAddress = getAddress(globalVars.addressType.receive, myUtxo[i].AddressIndex)

        //if (myUtxo[i].Type === globalVars.addressType.receive && myUtxo[i].AddressIndex === addressIndex) {
        if(utxoAddress === addressForToken){
            if (await isUtxoSpendable(myUtxo[i])) {
                inputs.push(myUtxo[i])
                tmpAmount += Number(myUtxo[i].Amount);
                //also increase the fee as more UTXOs are added;
                totalFee += feePerVin
            }
        }

        i++;
        //  console.log(i, tmpAmount)   
    }
    console.log(2)

    if (inputs.length === 0) {
        //this means that the wallet address associated with the token is not valid.
        //Hence the wallet will not be able to sign the transaction with the address associated with the token

        await dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.addressDoesNotHaveFabcoins_kindlySendFabcoinsToThatAddress , okButtonText: globalVars.messageObjects.Ok })


        return -1;
    }
    //at this point, if the total is zero, the transaction will not go through
    // console.log("fee ",totalFee, "tmp fee",tmpAmount)

    i = 0;

    console.log(3)
    while (tmpAmount < totalFee) {

        if (i === myUtxo.length) {
            //no more utxo
            // console.log("Not Enough fabcoins")
            enoughFabcoinsFound = false;

            //here, instead of return, an external function can be called that can fill utxos with enough fabcoins
            //the utxos cannot be the same as the ones found in the first receive address
            break;

            //    / return;
        }

        //here check if the transaction is mature
        //  console.log(globalVars.apiGetTx + myUtxo[i].TxId + "/true")

        //This stratagy may change later. Currently we are restricting the tokens to just one address : receive 0
        //This also means that the UTXO at Receive 0 must be spendable
        //  if (!(myUtxo[i].Type === globalVars.addressType.receive && myUtxo[i].AddressIndex === 0)) {

        //fill the utxo array with the utxos from the addresses other then the address associated with the token 
       
        let utxoAddress = getAddress(globalVars.addressType.receive,myUtxo[i].AddressIndex)

        // if (!(myUtxo[i].Type === globalVars.addressType.receive && myUtxo[i].AddressIndex === addressIndex)) {
        if(utxoAddress !== addressForToken){
            if (await isUtxoSpendable(myUtxo[i])) {
                inputs.push(myUtxo[i])
                // console.log(isCoinBase, conf)
                //    / console.log(myUtxo[i])
                tmpAmount += Number(myUtxo[i].Amount);
                //also increase the fee as per the number of UTXOs.
                totalFee += feePerVin
            }
        }
        i++;
    }

    if (tmpAmount < totalFee) {
        await dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.notEnoughFabcoinsToProceedWithTransaction , okButtonText: globalVars.messageObjects.Ok })

        return -1;
    }

    console.log(4)
   /* let fxnCallHex = abi.encodeFunctionCall(globalVars.testErcAbi[15], [tokenAmount])

    fxnCallHex = stripHexPrefix(fxnCallHex)

    let contract = Btc.script.compile([
        OPS.OP_4,
        number2Buffer(gasLimit),
        number2Buffer(gasPrice),
        hex2Buffer(fxnCallHex),
        hex2Buffer(contractAddress),
        OPS.OP_CALL
    ])*/

    console.log(5)
    let tx = new Btc.TransactionBuilder(globalVars.currentNetwork);

    for (let i = 0; i < inputs.length; i++) {

        tx.addInput(inputs[i].TxId, inputs[i].TxIdx)
    }

    tx.addOutput(contract, 0)

    let fromAddress = getAddress(inputs[0].Type, inputs[0].AddressIndex);

    let changeAmount = Math.round((tmpAmount - totalFee) * 1e8);

    console.log(6)

    //send the change amount back to the from address(address associated with tokens)
    if (tmpAmount > totalFee) {
        tx.addOutput(fromAddress, Math.round((tmpAmount - totalFee) * 1e8))
    }

    console.log(6.1)

    let r = await dialogs.prompt({
        title: globalVars.messageObjects.sellTokens,
        message: globalVars.messageObjects.kindlyCheckTxDetailsAndEnterPassword+ "\n" +globalVars.messageObjects.sellTokens +" \n"+globalVars.messageObjects.tokenAmount + " : " + tokenAmount + "\n" +globalVars.messageObjects.fee +" : " + Number(totalFee.toFixed(8)).toString() + " " + globalVars.messageObjects.fabcoins, okButtonText: globalVars.messageObjects.confirm,
        cancelButtonText: globalVars.messageObjects.cancel,
        inputType: dialogs.inputType.password
    })

    console.log(7)
    if (!r.result) return -4;

    if (!verifyPasswordHash(crypto.PBKDF2(r.text, getUuid(), { keySize: 32, iterations: 1000 }))) {
        //show warning and return
        dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.passwordIncorrect, okButtonText: globalVars.messageObjects.Ok });
        return -4
    }
    console.log(8)

    let encMn = getElementFromTable("Mnemonics", "mnemonic", "id", "1")
    //testing only - ask for password in production
    // let k = crypto.PBKDF2("asdf1234%", getUuid(), { keySize: 32, iterations: 1500 })
    let k = crypto.PBKDF2(r.text, getUuid(), { keySize: 32, iterations: 1500 })
    r.text = "**********************************************"
    // let mn = crypto.AES.decrypt(encMn, r.text).toString(crypto.enc.Utf8);
    let mn = crypto.AES.decrypt(encMn, k.toString()).toString(crypto.enc.Utf8);

    let seed = bip39.mnemonicToSeed(mn)
    let masterNode = Btc.HDNode.fromSeedBuffer(seed, globalVars.currentNetwork);
    let changeNode = masterNode.derivePath("m/44/0'/0'/1") //1 is for change address
    let receiveNode = masterNode.derivePath("m/44/0'/0'/0") // 0 is for receive address 

    console.log(9)

    for (let k = inputs.length - 1; k >= 0; k--) {

        let utxo = inputs[k]

        let keypair = 0;

        if (utxo.Type === globalVars.addressType.change) {
            keypair = changeNode.derive(utxo.AddressIndex).keyPair;
        }
        else if (utxo.Type === globalVars.addressType.receive) {
            keypair = receiveNode.derive(utxo.AddressIndex).keyPair;
        }

        // let keypair = getKeypair(utxo.Type, utxo.AddressIndex)
        tx.sign(k, keypair)

    }
    console.log(10)
    let txHex = tx.build().toHex();



    // console.log(tx.build().getId())

    // console.log(txHex);

    // console.log(globalVars.apiSendTx)

    let res = false;

    //submit the transaction only after call contract is successful
    //let ss = await axios.post("http://192.168.1.183:9001/fabapi/callcontract", [contractAddress, fxnCallHex, bs58ToVmAddress(fromAddress)]).then((res) => {
    let ss = await axios.post("http://fabtest.info:9001/fabapi/callcontract", [contractAddress, fxnCallHex, bs58ToVmAddress(fromAddress)]).then((res) => {
        console.dir(res)
        let fxnOutputs = globalVars.testErcAbi[15].outputs;
        let x = res.data.executionResult.output
        let p;
        try {
            abi.decodeParameters(fxnOutputs, x)[0]
        }
        catch (e) {
            console.log("There was an error")
            console.log(e)
            //throw e; 
            return false;
        }

        return true;
        //excepted should be equal to "None"
        p = abi.decodeParameters(fxnOutputs, x)[0]

    }, (e) => {
        console.log("Error")
        console.log(e)
    })

    //this means that there was some issue with the call contract, hence the transaction is not valid
    if (!ss) return -2; //error with the call contract
    // return 

    await axios.post(globalVars.apiSendTx, { txhex: txHex }).then(function (response) {


        let myTxId = response.data
        console.log(response.data)



        for (let k = 0; k < inputs.length; k++) {
            removeFromUtxo(inputs[k].TxId, inputs[k].TxIdx)

            addToSpentBuffer(inputs[k].Type, inputs[k].AddressIndex, myTxId, inputs[k].TxId, inputs[k].TxIdx, inputs[k].Amount, inputs[k].Height, inputs[k].confirmations)
        }

        addToUtxo(inputs[0].Type, inputs[0].AddressIndex, myTxId, 1, convertLiuToFabcoin(changeAmount), 1, 1)

        //Adding to History - figure it out- TODO

        readUtxoFromDatabase();
        updateCurrentBalance();

        //addToTokenHistory(tokenName, "sell", tokenAmount, "none", myTxId, Date.now(), -1, expectedFabcoins)
        addToTokenHistory(tokenName, globalVars.tokenTransactionType.sell, tokenAmount, "none", myTxId, Date.now(), -1, expectedFabcoins)

        res = true;
        //  console.log("After")
        //  dataManager.showTable(globalVars.databaseObjects.utxoTable.name)


    }).catch(function (error) {

        res = false;

        // console.log(error)
        //show appropriate alert
        dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.sendErrorMessage + "\n" + error, okButtonText: globalVars.messageObjects.Ok })

    })
    //console.log("here" , res)
    return (res) ? 1 : -3;

}


exports.exit = exit;
exports.getReceiveAddress = getReceiveAddress;
exports.getReceiveObject = getReceiveObject;
exports.saveMnemonics = saveMnemonics;
exports.checkInternetConnection = checkInternetConnection;
exports.getCurrentBalance = getCurrentBalance;
exports.sendFabcoins = sendFabcoins;
exports.increaseChangeIndex = increaseChangeIndex;
exports.increaseReceiveIndex = increaseReceiveIndex;
exports.init = init;
exports.getSynchronizeActive = getSynchronizeActive;
exports.verifyUserPassword = verifyUserPassword;
exports.checkSpentTxConfirmations = checkSpentTxConfirmations;
exports.getTxHistory = getTxHistory;
exports.getElementFromTable = getElementFromTable;
exports.askForPassword = askForPassword;
exports.deleteWallet = deleteWallet;
exports.savePin = savePin;
exports.verifyUserPin = verifyUserPin;
exports.deletePin = deletePin;
exports.areNewReceiveAddressesRequired = areNewReceiveAddressesRequired;
exports.areNewChangeAddressesRequired = areNewChangeAddressesRequired;
exports.generateChangeAddresses = generateChangeAddresses;
exports.generateReceiveAddresses = generateReceiveAddresses;
exports.checkLastReceiveAddressesForReceiptOfFunds = checkLastReceiveAddressesForReceiptOfFunds
exports.restoreWallet = restoreWallet;
exports.synchronize = synchronize;
exports.setIdleTime = setIdleTime;
exports.setUuid = setUuid;
exports.getUuid = getUuid;
exports.verifyPasswordHash = verifyPasswordHash;
exports.getSpendableBalance = getSpendableBalance;
exports.getCurrentApiEndpoint = getCurrentApiEndpoint;
exports.getUtxoCount = getUtxoCount;
exports.isPositiveNumber = isPositiveNumber;
exports.getFlatFee = getFlatFee;
exports.getFeePerVin = getFeePerVin;
exports.getAddress = getAddress;
exports.readMyTokensFromDatabase = readMyTokensFromDatabase;
exports.myTokens = myTokens;
exports.addToken = addToken;
exports.bs58ToVmAddress = bs58ToVmAddress;
exports.isStringHex = isStringHex;
exports.sendTokens = sendTokens;
exports.buyTokens = buyTokens;
exports.getTokenBalance = getTokenBalance;
exports.getTokenBuyPrice = getTokenBuyPrice;
exports.updateTokenBalance = updateTokenBalance;
exports.getAddressBalance = getAddressBalance;
exports.getLatestAddressBalance = getLatestAddressBalance;
exports.getTokenSellPrice = getTokenSellPrice;
exports.sellTokens = sellTokens;
exports.addToTokenHistory = addToTokenHistory;
exports.getTokenHistoryFromDatabase = getTokenHistoryFromDatabase;
exports.isValidVmAddress = isValidVmAddress;