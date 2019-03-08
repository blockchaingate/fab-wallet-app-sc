const Btc = require("bitcoinjs-lib")

const networks = {
    testnet: Btc.networks.testnet,
    mainnet: Btc.networks.bitcoin
}

//change this to mainnet after testing
var currentNetwork = networks.testnet;
//var currentNetwork = networks.mainnet;

//for simplified testing
const restoreTest = false

//change this url after testing and when the api for mainnet is deployed in the cloud 
// const configURL = "http://192.168.1.119:9001/fabapi/" //local url
//const configURL = "http://52.60.97.159:9001/fabapi/" // new testnet URL
//const configURL = "http://18.130.8.117:9001/fabapi/" //mainnet cloud url
//const configURL = "http://fabexplorer.info:9001/fabapi/" //mainnet cloud domain
const configURL = "http://fabtest.info:9001/fabapi/" //testnet cloud domain
//const configURLUtxo = configURL + "unspenttransactionpolicy/"
//testing Jack's API - testnet
const configURLUtxo = "http://fabtest.info:8666/transactions?"
//testing Jack's API - mainnet
//const configURLUtxo = "http://fabexplorer.info:8666/transactions?"
//const configURLUtxo = "http://192.168.1.183:18666/transactions?"
const configURLExistAddress = configURL + "existaddress/"
const configURLSendTx = configURL + "sendrawtransaction/"
const configURLGetTx = configURL + "getrawtransaction/"

const minimumPasswordLength = 8;
const minimumThresholdAmount = 0.00005;

const apiEndPoints = [  "http://fabexplorer.info",
                        "http://fabexplorer.com",
                        "http://api.fabcoin.biz",
                        "http://api1.fabcoin.club",
                        "http://api2.fabcoin.club",
                        "http://api3.fabcoin.club",
                        "http://api1.fabexplorer.net",
                        "http://api2.fabexplorer.net",
                        "http://api3.fabexplorer.net"   ]


                        
/*const apiSendTx = ":9001/fabapi/sendrawtransaction/"
const apiGetTx = ":9001/fabapi/getrawtransaction/"
const apiExistAddress = ":9001/fabapi/existaddress/"
const apiUtxo = ":8666/transactions?"
*/

//Testing purposes only
//const apiSendTx = "http://18.236.243.130:9001/fabapi/sendrawtransaction/"
//const apiSendTx = "http://192.168.1.183:9001/fabapi/sendrawtransaction/"
const apiSendTx = "http://fabtest.info:9001/fabapi/sendrawtransaction/"
//const apiGetTx = "http://18.236.243.130:9001/fabapi/getrawtransaction/"
//const apiGetTx = "http://192.168.1.183:9001/fabapi/getrawtransaction/"
const apiGetTx = "http://fabtest.info:9001/fabapi/getrawtransaction/"
//const apiExistAddress = "http://18.236.243.130:9001/fabapi/existaddress/"
//const apiExistAddress = "http://192.168.1.183:9001/fabapi/existaddress/"
const apiExistAddress = "http://fabtest.info:9001/fabapi/existaddress/"
//const apiUtxo = "http://52.23.203.223:8666/transactions?"
//const apiUtxo = "http://192.168.1.183:18666/transactions?"
const apiUtxo = "http://fabtest.info:8666/transactions?"

//Testing purposes only - will be later on replaced by the API call which will provide all the tokens
const availableTokens = [

   /* {   
        name : "TestTOken3",
        symbol : "TSTT",
        address : "fed44b6202029ba51691b098912eaf98c2f3f4ea",
        creatorAddress : "mxLQ5ESxgXwDq6xTaNUypVe8AABhcxfhcE"
    },
    {
        name : "Ankit",
        symbol : "AKT",
        address : "775e574effc6f59bd9810e8548fbd7219372ccde",
        creatorAddress: "mzZ7LwfN99xZsfrxDLJp8vp64Y4B3m2tMS"
    },
    {
        name: "test1",
        symbol: "tst1",
        address:"064fc8343ce72c66eeb0b62e7d408ab01a45f440",
        creatorAddress:"mvrLDpEFAQaR6PuBZRg7Nq7x6gTNoRsh6M"
    },
    {
        name: "Ankit",
        symbol: "AKT",
        address:"9214979216e1aba36298856f931cfaefcbe695ce",
        creatorAddress:"mvrLDpEFAQaR6PuBZRg7Nq7x6gTNoRsh6M"
    },*/
   /* {
        name: "Test3",
        symbol: "TST",
        address:"f897cb24cc85294409f91257b7c9bfb6ffeab6bd",
        creatorAddress:"mu4NnA4XAS95qj5Q86Y9AUbJrgdKrcbbWD"
    },
    {
        name: "Test4",
        symbol: "TST4",
        address:"237ea82cbed74104efb044f723763454ed783457",
        creatorAddress:"mrQzdVTvAxuVaoymWznfKdXYQ49eDrunHf"
    },*/
    {
        name: "Test1",
        symbol: "TST1",
        address:"d75b139301152df6b4585713965d386eb9d64baf"
    },
    {
        //Fake contract - remove it after testing is completed
        name: "Test2",
        symbol: "TST2",
        address:"1a8d9f8ea5dc64c84c1a74c5332c14cee988f5b3"
    },
    {
        //Fake contract - remove it after testing is completed
        name: "Test3",
        symbol: "TST3",
        address:"8f14f289acebce5bfc20915fbef149c6923f06ad"
    },
    {
        //Fake contract - remove it after testing is completed
        name: "Test4",
        symbol: "TST4",
        address:"ef07aa6f0758cb990056c3121865a06bac78e43c"
    },
    {
        name: "Test5",
        symbol: "TST5",
        address:"3fcf687931796c09fa153e7b7f3edfa1af76ca4c"
    }
]
    

const testErcAbi = [
    {//0
        "constant": true,
        "inputs": [],
        "name": "name",
        "outputs": [
            {
                "name": "",
                "type": "string"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {//1
        "constant": false,
        "inputs": [
            {
                "name": "_spender",
                "type": "address"
            },
            {
                "name": "_value",
                "type": "uint256"
            }
        ],
        "name": "approve",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {//2
        "constant": true,
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {//3
        "constant": false,
        "inputs": [
            {
                "name": "_from",
                "type": "address"
            },
            {
                "name": "_to",
                "type": "address"
            },
            {
                "name": "_value",
                "type": "uint256"
            }
        ],
        "name": "transferFrom",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {//4
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [
            {
                "name": "",
                "type": "uint8"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {//5
        "constant": true,
        "inputs": [
            {
                "name": "_owner",
                "type": "address"
            }
        ],
        "name": "balanceOf",
        "outputs": [
            {
                "name": "balance",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {//6
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [
            {
                "name": "",
                "type": "string"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {//7
        "constant": false,
        "inputs": [
            {
                "name": "_to",
                "type": "address"
            },
            {
                "name": "_value",
                "type": "uint256"
            }
        ],
        "name": "transfer",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {//8
        "constant": true,
        "inputs": [
            {
                "name": "_owner",
                "type": "address"
            },
            {
                "name": "_spender",
                "type": "address"
            }
        ],
        "name": "allowance",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {//9
        "payable": true,
        "stateMutability": "payable",
        "type": "fallback"
    },
    {//10
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": true,
                "name": "spender",
                "type": "address"
            },
            {
                "indexed": false,
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Approval",
        "type": "event"
    },
    {//11
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "name": "from",
                "type": "address"
            },
            {
                "indexed": true,
                "name": "to",
                "type": "address"
            },
            {
                "indexed": false,
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Transfer",
        "type": "event"
    },
    {//12
        "constant": true,
        "inputs": [],
        "name": "buyPrice",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {//13
        "constant": false,
        "inputs": [],
        "name": "buy",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": true,
        "stateMutability": "payable",
        "type": "function"
    },
    {//14
		"constant": true,
		"inputs": [],
		"name": "sellPrice",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
    },
    {//15
		"constant": false,
		"inputs": [
			{
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "sell",
		"outputs": [
			{
				"name": "revenue",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	}
]

const navigation = {
    askForPassword: "views/askForPassword/askForPassword",
    chooseLanguage: "views/chooseLanguage/chooseLanguage",
    createPassword: "views/createPassword/createPassword",
    dashboard: "views/dashboard/dashboard",
    enterMnemonic: "views/enterMnemonic/enterMnemonic",
    enterPassword: "views/enterPassword/enterPassword",
    receiveFabcoins: "views/receiveFabcoins/receiveFabcoins",
    sendFabcoins: "views/sendFabcoins/sendFabcoins",
    settings: "views/settings/settings",
    showMnemonic: "views/showMnemonic/showMnemonic",
    splashScreen: "views/splashScreen/splashScreen",
    verifyPassword: "views/verifyPassword/verifyPassword",
    welcomePage: "views/welcomePage/welcomePage",
    transactionHistory: "views/transactionHistory/transactionHistory",
    transactionDetail: "views/transactionDetail/transactionDetail",
    setPin: "views/setPin/setPin",
    enterPin: "views/enterPin/enterPin",
    termsAndConditions: "views/termsAndConditions/termsAndConditions",
    faq: "views/faq/faq",
    verifyMnemonic: "views/verifyMnemonic/verifyMnemonic",
    tokenPage : "views/tokenPage/tokenPage",
    receiveTokens : "views/receiveTokens/receiveTokens",
    myTokens: "views/myTokens/myTokens",
    tokenList:"views/tokenList/tokenList",
    tokenDashboard:"views/tokenDashboard/tokenDashboard",
    sendTokens:"views/sendTokens/sendTokens",
    buyTokens:"views/buyTokens/buyTokens",
    sellTokens:"views/sellTokens/sellTokens",
    tokenHistory:"views/tokenHistory/tokenHistory",
    tokenTransactionDetail:"views/tokenTransactionDetail/tokenTransactionDetail",
    addOtherTokens : "views/addOtherTokens/addOtherTokens"
}

const transitions = {

    slideLeft: {
        name: "slideLeft",
        duration: 500,
        curve: "easeOut"
    },
    slideRight: {
        name: "slideRight",
        duration: 500,
        curve: "easeOut"
    }
}

const langList = {
    english: "english",
    chinese: "chinese"
}

const tokenTransactionType = {
    send:"send",
    receive:"receive",
    buy:"buy",
    sell:"sell"
}

const execute = {
    newWallet: "newWallet",
    restoreWallet: "restoreWallets",
    resetPassword: "resetPassword",
    deleteWallet: "deleteWallet"
}

const addressType = {
    change: "change",
    receive: "receive",
    send: "send"
}

const databaseObjects = {

    name: "fabPass.db",

    utxoTable: {
        name: "UtxoTable",
        idName: "id",
        typeName: "Type",
        addressIndexName: "AddressIndex",
        txidName: "TxId",
        txIdxName: "TxIdx",
        amountName: "Amount",
        heightName: "Height",
        confirmationName: "Confirmations"
    },
    spentBufferTable: { //similar to utxo
        name: "SpentBufferTable",
        idName: "id",
        typeName: "Type",
        addressIndexName: "AddressIndex",
        txidName: "TxId",
        utxoTxId: "UtxoTxId",
        txIdxName: "TxIdx",
        amountName: "Amount",
        heightName: "Height",
        confirmationName: "Confirmations"
    },
    passwordTable: {
        name: "Pass",
    },
    pinTable: {
        name: "Pin"
    },
    addressIndexTable: {
        name: "AddressIndex",
        typeName: "Type",
        idxName: "Idx",
        changeTypeName: "change",
        receiveTypeName: "receive"
    },
    TransactionHistoryTable: {
        name: "TransactionHistory",
        typeName: "Type", //send and
        dateName: "Date",
        amountName: "Amount",
        txFeeName: "TxFee",
        txIdName: "TxId",
        sentToName: "SentTo",
        confirmationName: "Confirmations",
        commentName: "Comment"
        //more fields can be added
        //TODO To be discussed

    },
    MnemonicTable: {
        name: "Mnemonics",
        id: "id",
        mnemonic: "mnemonic"
    },
    ChangeAddressTable: {
        name: "ChangeAddressList",
        idxName: "Idx",
        addressName: "Address",
        isUsedName: "IsUsed"
    },
    ReceiveAddressTable: {
        name: "ReceiveAddressList",
        idxName: "Idx",
        addressName: "Address",
        isUsedName: "IsUsed"
    },
    PinTable: {
        name: "Pin",
        idxName: "id",
        pin: "pin"
    },
    uuidTable: {
        name: "Uuid",
        idxName: "id",
        uuid: "uuid"
    },
    myTokensTable : {
        name: "MyTokens",
        idxName : "id",
        contractAddress : "ContractAddress",
        localWalletAddress : "LocalWalletAddress",// address associated with the token
        tokenName : "TokenName",
        symbol : "TokenSymbol",
        balance : "Balance"
    },
    tokenHistoryTable : {
        name : "TokenHistory",
        idxName:"id",
        tokenName : "TokenName",
        tokenAmount : "TokenAmount",
        fabcoinAmount:"FabcoinAmount",
        txType : "TxType",
        toAddress: "ToAddress", //in case of send tokens
        txId : "TxId",
        time : "Time"
    }
}

var currentLanguage;

var setCurrentLanguage = function (lang) {
    currentLanguage = lang;
    //call the function that changes the language of message objects
    setMessageObjects();
}

var getCurrentLanguage = function () {
    return currentLanguage;
}

const appSettingsObjects = {
    language: "language",
    isPasswordRequiredForSend: "isPasswordRequiredForSend",
    confirmationCutoff: "confirmationCutoff",
    changeIndex: "changeIndex",
    receiveIndex: "receiveIndex",
    isSyncActive: "isSyncActive"
}

var messageObjects = {

    language: "",
    selectPrefferedLanguage: "",
    fabLightWallet: "",
    walletSetup: "",
    ifYouChooseHdWallet: "",
    newWallet: "",
    restoreWallet: "",
    createASecurePassword: "",
    yourPasswordIsKeyToYourWallet: "",
    passwordEightCharLong: "",
    passwordNoSpace: "",
    passwordSpChar: "",
    passwordOneNumber: "",
    next: "",
    verifyYourPassword: "",
    mnemonicWords: "",
    kindlySaveMnemonic: "",
    enterMnemonic: "",
    kindlyEnterMnemonic: "",
    success: "",
    mnemonicsVerifiedMsg: "",
    fabcoinWallet: "",
    currentBalance: "",
    sendFabcoin: "",
    receiveFabcoins: "",
    transactionHistory: "",
    settings: "",
    exit: "",
    fabWalletSettings: "",
    requirePasswordForEveryTx: "",
    minNumCnf: "",
    synchronize: "",
    showMnemonics: "",
    resetPassword: "",
    deleteWallet: "",
    goToDashboard: "",
    receiversAddress: "",
    pasteAddress: "",
    amount: "",
    send: "",
    back: "",
    receiveAddress: "",
    copyAddress: "",
    error: "",
    yourNewPasswordIsSameAsOld: "",
    Ok: "",
    enterPassword: "",
    yourPasswordResetSuccessfully: "",
    mnemonicErrorMsg: "",
    kindlyEnterAllWords: "",
    enterReceiversAddress: "",
    enterAmountToBeSent: "",
    theAddress: "",
    isSuccessfullyCopiedToClipboard: "",
    passwordsNoMatchCreateNew: "",
    passwordCreatedSuccessfully: "",
    passwordIncorrect: "",
    invalidAddress: "",
    emptyAmount: "",
    amountMustBeGreaterThenZero: "",
    insufficientFunds: "",
    permissionChange: "",
    enterPasswordToApplySetting: "",
    enterCurrentPassword: "",
    preferencesSaved: "",
    yes: "",
    no: "",
    exitSure: "",
    deleteWalletSure: "",
    setPinForLogin: "",
    createPin: "",
    createPinTitle: "",
    enterPin: "",
    changeLanguage: "",
    fabcoinsReceived: "",
    youHaveReceived: "",
    fabcoins: "",
    kindlyEnterPasswordToCompleteThisAction: "",
    kindlyEnterCurrentPasswordToCompleteThisAction: "",
    confirm: "",
    cancel: "",
    connectionTimeout: "",
    kindlyResetConnectionOrTryAfterSomeTime: "",
    kindlyCheckTxDetailsAndEnterPassword: "",
    to: "",
    transactionFee: "",
    fabcoinsSent: "",
    sendTransactionSubmitted: "",
    walletRestoredSuccessfully: "",
    newAddresses: "",
    additionalAddressesWillBeGenerated: "",
    incorrectPinMessage: "",
    pinAtLeast4Digits: "",
    loginPinSet: "",
    pinSetSuccessfully: "",
    synchronizeMessage: "",
    synchronizeSuccessful: "",
    pinDeleted: "",
    pinDeletedSuccessfully: "",
    walletDeleted: "",
    walletDeletedSuccessfully: "",
    setPin: "",
    deletePin: "",
    txIdCopied: "",
    blockHashCopied: "",
    passwordVerified: "",
    passwordVerifyMessage: "",
    login: "",
    transactions: "",
    transactionDetail: "",
    goToTxHistory: "",
    spendableBalance: "",
    deductTxFee: "",
    termsAndConditions: "",
    refresh: "",
    iAgreeToTermsAndConditions: "",
    faq: "",
    sendErrorMessage: "",
    enterComment: "",
    verifyMnemonic: "",
    walletRefreshedAt: "",
    allWordsVerified:"",
    wrongMnemonicErrorInitialSetup:"",
    wrongMnemonicError:"",
    enterMnemonicToVerify:"",
    amountMustBePositivenumber:"",
    scanQrCode:"",
    Type:"",
    Date:"",
    Comment:"",
    receive:"",
    synchronizing:"",
    generatingNewAddresses:"",
    tokens:"",
    myTokens:"",
    addTokensFromList:"",
    addOtherTokens:"",
    receiveTokens:"",
    abort:"",
    enterToken_contractAddress:"",
    tokenContractAddress:"",
    checkContractValidity:"",
    selectWalletAddressForToken:"",
    addToken:"",
    addressCouldntBeScanned_tryAgain:"",
    invalidContractAddress_enterCorrectAddress:"",
    tokenAlreadyPresent:"",
    tokenAlreadyPresentMsg:"",
    tokenNameNotAvailable:"",
    tokenSymbolNotAvailable:"",
    tokenGetBalanceNotAvailable:"",
    tokenTransferFunctionNotAvailable:"",
    tokenBuyPriceNotAvailable:"",
    tokenSellPriceNotAvailable:"",
    tokenBuyFunctionNotAvailable:"",
    tokenSellFunctionNotAvailable:"",
    theToken:"",
    tokenValidated_chooseAddress:"",
    localAddressAlreadyAssociatedWithToken:"",
    kindlyReviewDetails:"",
    tokenName:"",
    tokenSymbol:"",
    contractAddress:"",
    localWalletAddressForToken:"",
    tokenBalance:"",
    wouldYouLikeToAddThisToken:"",
    hasBeenAddedSuccessfullyToYourWallet:"",
    kindlyCheckContractValidity:"",
    tokenInformation:"",
    kindlyVerifyTokenInfoAndTapConfirmToAdd:"",
    buy:"",
    tokenPrice:"",
    addressFabcoinBalance:"",
    requiredFabcoins:"",
    notEnoughFabcoinsToProceedWithTransaction:"",
    buyTokenTxSubmittedSuccessfully:"",
    buyTokenTxCouldNotBeSubmitted:"",
    buyTokens:"",
    doNotHaveAnyTokens_addTokens:"",
    addTokens:"",
    base58Format:"",
    hexFormat:"",
    sell:"",
    expectedFabcoins:"",
    numberOfTokensToSell:"",
    sellTokens:"",
    doNotHaveEnoughTokensToProceedWithThisTx:"",
    sellTokenTxSubmittedSuccessfully:"",
    sellTokenTxCouldNotBeSubmitted:"",
    amountCannotBeGreaterThenAvailableTokenBalance:"",
    sendTokenTxSubmittedSuccessfully:"",
    sendTokenTxCouldNotBeSubmitted:"",
    tokenAmount:"",
    sendTokens:"",
    requestTokens:"",
    info:"",
    sendFabcoinsToTokenAddress:"",
    addressDoesNotHaveFabcoins_kindlySendFabcoinsToThatAddress:"",
    fabcoinAndTokenBalanceCorrospondsToCurrentStateOfBlockchain:"",
    tokenHistory:"",
    transactionType:"",
    tokenList:"",
    selectAddress:"",
    isNotAssociatedWithAddressInWallet_SelectAddressToAddToWallet:"",
    kindlySelectTheTokenFirst:"",
    tokenTransaction:"",
    yourself:"",
    fee_infabcoins:"",
    transactionId:"",
    none:"",
    tokenTransactionDetail:"",
    internalUtxoAreCoinbaseNotMature_YouCanSpend:"",
    FABAsOfNow:"",
    fee:"",
    requestedTokenAmount:"",
    fabcoinsToBeSpent:"",
    gasFee:""



}

var setMessageObjects = function () {

    if (currentLanguage === langList.english) {

        messageObjects.language = "English"
        messageObjects.selectPrefferedLanguage = "Select Your Preferred Language"
        messageObjects.fabLightWallet = "FAB Wallet"
        messageObjects.walletSetup = "Wallet Setup"
        messageObjects.ifYouChooseHdWallet = "If you choose \"restore HD wallet\", you will be asked to enter the 12 mnemonic words"
        messageObjects.newWallet = "New Wallet"
        messageObjects.restoreWallet = "Restore HD Wallet"

        messageObjects.createASecurePassword = "Create A Secure Password"
        messageObjects.yourPasswordIsKeyToYourWallet = "Your password is a key to your wallet. Kindly create a secure password."
        messageObjects.passwordEightCharLong = "The password must be at least 8 characters long. "
        messageObjects.passwordNoSpace = "There should be no space."
        messageObjects.passwordSpChar = "The Password must contain at least one special character.(from [,!,@,#,$,%,^,&,*,(,),_,+,-,=,~,])"
        messageObjects.passwordOneNumber = "The password must contain at least one number."
        messageObjects.next = "Next"
        messageObjects.verifyYourPassword = "Verify Your Password"
        messageObjects.mnemonicWords = "Mnemonic Words"
        messageObjects.kindlySaveMnemonic = "Kindly save these mnemonic words and keep them in a secure place. These words can later be used to restore your wallet as and when required."
        messageObjects.enterMnemonic = "Enter Mnemonic"

        messageObjects.kindlyEnterMnemonic = "Kindly enter the Mnemonic words in order in the given fields. Keep in mind that these words are case sensitive."
        messageObjects.success = "Success"
        messageObjects.mnemonicsVerifiedMsg = "Your Mnemonics were verified successfully. Your wallet will now be synchronized with the main Blockchain. This may take some time."
        messageObjects.fabcoinWallet = "Fabcoin Wallet"
       // messageObjects.currentBalance = "Current Balance"
       messageObjects.currentBalance = "Balance"
        messageObjects.sendFabcoin = "Send Fabcoins"
        messageObjects.receiveFabcoins = "Receive Fabcoins"
        messageObjects.transactionHistory = "Transaction History"
        messageObjects.settings = "Settings"
        messageObjects.exit = "Exit"

        messageObjects.fabWalletSettings = "FAB Wallet Settings"
        messageObjects.requirePasswordForEveryTx = "Require Password for every Send Transaction"
        messageObjects.minNumCnf = "Minimum Number of Confirmations required to be qualified as Confirmed Balance (Default: 30)"
        messageObjects.synchronize = "Synchronize"
        messageObjects.showMnemonics = "Show Mnemonics"
        messageObjects.resetPassword = "Reset Password"
        messageObjects.deleteWallet = "Delete Wallet"
        messageObjects.goToDashboard = "Go to Dashboard"
        messageObjects.receiversAddress = "Receiver’s Address"
        messageObjects.pasteAddress = "Paste Address"
        messageObjects.amount = "Amount"
        messageObjects.send = "Send"
        messageObjects.back = "Back"
        messageObjects.receiveAddress = "Receive Address"
        messageObjects.copyAddress = "Copy Address"

        messageObjects.error = "Error"
        messageObjects.yourNewPasswordIsSameAsOld = "Your new Password is same as your previous password. Kindly create a different password."
        messageObjects.Ok = "Ok"
        messageObjects.enterPassword = "Enter Password"
        messageObjects.yourPasswordResetSuccessfully = "Your Password has been reset Successfully."
        messageObjects.mnemonicErrorMsg = "One or more words are incorrect. Kindly enter the correct mnemonic to proceed further."
        messageObjects.kindlyEnterAllWords = "Kindly Enter all the words correctly."
        messageObjects.enterReceiversAddress = "Enter Receiver's Address"
        messageObjects.enterAmountToBeSent = "Enter Amount to be sent"
        messageObjects.theAddress = "The Address"
        messageObjects.isSuccessfullyCopiedToClipboard = "is successfully copied to clipboard"
        messageObjects.passwordsNoMatchCreateNew = "The passwords do not match. Kindly create a new password."
        messageObjects.passwordCreatedSuccessfully = "Your Password is created successfully"
        messageObjects.passwordIncorrect = "The password you entered is incorrect. \nKindly enter the correct password."
        messageObjects.invalidAddress = "The Address you entered is not a valid address. Kindly enter a Valid Address."
        messageObjects.emptyAmount = "The amount field is empty. Kindly enter a valid amount."
        messageObjects.amountMustBeGreaterThenZero = "The Amount must be greater then " + minimumThresholdAmount + "."
        messageObjects.insufficientFunds = "The wallet does not have sufficient funds to cover the Send Amount and Transaction Fee. Kindly enter a lower amount."
        messageObjects.permissionChange = "Permission change"
        messageObjects.enterPasswordToApplySetting = "Kindly enter your password to apply this setting."
        messageObjects.enterCurrentPassword = "Please Enter your Current Password."
        messageObjects.preferencesSaved = "Your preferences have been saved successfully"
        messageObjects.yes = "Yes"
        messageObjects.no = "No"
        messageObjects.exitSure = "Are you sure you want to exit?"
        messageObjects.deleteWalletSure = "This action is irreversible. If you delete this wallet, all the data, transaction history and access to your funds will be lost. Press Cancel to ignore this action, Type your password and press Confirm to continue."
        messageObjects.setPinForLogin = "Set PIN For Login"
        messageObjects.createPin = "Create a PIN"
        messageObjects.createPinTitle = "Create a PIN with minimum four digits for Login"
        messageObjects.enterPin = "Enter your PIN"
        messageObjects.changeLanguage = "Change Language"
        messageObjects.fabcoinsReceived = "Fabcoins Received"
        messageObjects.youHaveReceived = "You have received "
        messageObjects.fabcoins = " Fabcoins."
        messageObjects.kindlyEnterPasswordToCompleteThisAction = "Kindly enter your password to complete this action."
        messageObjects.kindlyEnterCurrentPasswordToCompleteThisAction = "Kindly enter your current password to complete this action."
        messageObjects.confirm = " Confirm"
        messageObjects.cancel = "Cancel"
        messageObjects.connectionTimeout = "Connection Timeout"
        messageObjects.kindlyResetConnectionOrTryAfterSomeTime = "Kindly reset your connection or try again after some time."
        messageObjects.kindlyCheckTxDetailsAndEnterPassword = "Kindly check the Transaction details below and enter your password to confirm this Transaction."
        messageObjects.to = "To"
        messageObjects.transactionFee = "Transaction Fee"
        messageObjects.fabcoinsSent = "Fabcoins Sent"
        messageObjects.sendTransactionSubmitted = "Your send transaction has been submitted successfully."
        messageObjects.walletRestoredSuccessfully = "Your Wallet is restored successfully."
        messageObjects.newAddresses = "New Addresses"
        messageObjects.additionalAddressesWillBeGenerated = "Additional addresses will be generated. This may take some time."
        messageObjects.incorrectPinMessage = "The PIN you entered is incorrect. Kindly enter a the correct PIN or click Enter Password."
        messageObjects.pinAtLeast4Digits = "The PIN must at least be four digits."
        messageObjects.loginPinSet = "Login PIN Set"
        messageObjects.pinSetSuccessfully = "Your PIN is set successfully. You can now use your PIN for logging into the Wallet."
        messageObjects.synchronizeMessage = "Your wallet will now be synchronized. Your addresses will be checked against the FAB blockchain to get the latest balances. This may take some time."
        messageObjects.synchronizeSuccessful = "Your wallet is synchronized successfully."
        messageObjects.pinDeleted = "PIN Deleted"
        messageObjects.pinDeletedSuccessfully = "Your PIN is deleted successfully."
        messageObjects.walletDeleted = "Wallet Deleted"
        messageObjects.walletDeletedSuccessfully = "Your wallet is deleted successfully."
        messageObjects.setPin = "Set PIN"
        messageObjects.deletePin = "Delete PIN"
        messageObjects.txIdCopied = "The Transaction Id is successfully copied to clipboard."
        messageObjects.blockHashCopied = "The Block Hash is successfully copied to clipboard."
        messageObjects.passwordVerified = "Password Verified"
        messageObjects.passwordVerifyMessage = "Your Password was created successfully. Your wallet will now generate new addresses.This may take some time."
        messageObjects.login = "Login"
        messageObjects.transactions = "Transactions"
        messageObjects.transactionDetail = "Transaction Detail"
        messageObjects.goToTxHistory = "Go To Transaction History"
        messageObjects.spendableBalance = "Spendable Balance"
        messageObjects.deductTxFee = "Deduct Transaction Fee From Send Amount"
        messageObjects.termsAndConditions = "Terms And Conditions"
        messageObjects.refresh = "Refresh"
        messageObjects.iAgreeToTermsAndConditions = "I Agree to Terms And Conditions"
        messageObjects.faq = "Frequently Asked Questions"
        messageObjects.sendErrorMessage = "The transaction could not be sent.\nKindly check your internet connection and synchronize your wallet and try again."
        messageObjects.enterComment = "Enter Comment (optional)"
        messageObjects.verifyMnemonic = "Verify Mnemonics"
        messageObjects.walletRefreshedAt = "The wallet is refreshed successfully at  "
        messageObjects.allWordsVerified = "All words are verified successfully."
        messageObjects.wrongMnemonicErrorInitialSetup = "The mnemonics you entered were incorrect. You will be taken back to the mnemonic page and here, you can see the mnemonic words again and correct any mistake in your records."
        messageObjects.wrongMnemonicError = "The mnemonics you entered were incorrect.Kindly go to the settings page and tap on show Mnemonics to see the mnemonic words again and correct any mistake in your records."
        messageObjects.enterMnemonicToVerify = "Kindly Enter the mnemonics in order to verify that they have been recorded correctly."
        messageObjects.amountMustBePositivenumber = "The Amount must be a positive Number."
        messageObjects.scanQrCode = "Scan QR Code"
        messageObjects.Type = "Type"
        messageObjects.Date = "Date"
        messageObjects.Comment = "Comment"
        messageObjects.receive = "Receive"
        messageObjects.synchronizing = "Synchronizing..."
        messageObjects.generatingNewAddresses = "Generating New Addresses..."
        messageObjects.tokens = "Tokens"
        messageObjects.myTokens="My Tokens"
        messageObjects.addTokensFromList="Add Tokens From the List"
        messageObjects.addOtherTokens="Add Other Tokens"
        messageObjects.receiveTokens="Receive Tokens"
        messageObjects.abort="Abort"
        messageObjects.enterToken_contractAddress = "Enter Token (Contract) Address"
        messageObjects.tokenContractAddress = "Token Contract Address"
        messageObjects.checkContractValidity = "Check Contract Validity"
        messageObjects.selectWalletAddressForToken = "Select Wallet Address for the Token"
        messageObjects.addToken="Add Token"
        messageObjects.addressCouldntBeScanned_tryAgain="The address could not be scanned. Kindly try again."
        messageObjects.invalidContractAddress_enterCorrectAddress="The address you entered is not a valid contract address.\nKindly enter the correct contract address."
        messageObjects.tokenAlreadyPresent="Token already Present"
        messageObjects.tokenAlreadyPresentMsg ="The  token contract address you entered is already present in your Wallet."
        messageObjects.tokenNameNotAvailable="The Token Name for the given contract address is not available."
        messageObjects.tokenSymbolNotAvailable="The Token Symbol for the given contract address is not available."
        messageObjects.tokenGetBalanceNotAvailable="The get balance of the token functionality is not available for the given contract address"
        messageObjects.tokenTransferFunctionNotAvailable="The transfer token functionality is not available for the given contract address."
        messageObjects.tokenBuyPriceNotAvailable="The Buy price functionality is not available for the given contract address."
        messageObjects.tokenSellPriceNotAvailable="The Sell Price functionality is not available for the given contract address."
        messageObjects.tokenBuyFunctionNotAvailable="The Buy functionality is not available for the given contract address."
        messageObjects.tokenSellFunctionNotAvailable="The Sell functionality is not availble for the given contract address."
        messageObjects.theToken="The Token"
        messageObjects.tokenValidated_chooseAddress="has been validated successfully. You can now choose an  address from the list below and add the token to your wallet."
        messageObjects.localAddressAlreadyAssociatedWithToken="You already have a local address associated with the token contract."
        messageObjects.kindlyReviewDetails="Kindly review the details below : "
        messageObjects.tokenName="Token Name"
        messageObjects.tokenSymbol="Token Symbol"
        messageObjects.contractAddress="Contract Address"
        messageObjects.localWalletAddressForToken="Local Wallet Address For Token"
        messageObjects.tokenBalance="Token Balance"
        messageObjects.wouldYouLikeToAddThisToken = "Would you like to add this token to your wallet?"
        messageObjects.hasBeenAddedSuccessfullyToYourWallet="has been added successfully to your wallet."
        messageObjects.kindlyCheckContractValidity="Kindly check the contract validity before adding it to this wallet."
        messageObjects.tokenInformation="Token Information"
        messageObjects.kindlyVerifyTokenInfoAndTapConfirmToAdd="Kindly verify all the information about the token and tap confirm to add the token."
        messageObjects.buy="Buy"
        messageObjects.tokenPrice="Token Price"
        messageObjects.addressFabcoinBalance="Address Fabcoin Balance"
        messageObjects.requiredFabcoins="Required Fabcoins"
        messageObjects.notEnoughFabcoinsToProceedWithTransaction = "You do not have enough Fabcoins to proceed with this transaction."
        messageObjects.buyTokenTxSubmittedSuccessfully = "Your Buy Token transaction has been submitted successfully."
        messageObjects.buyTokenTxCouldNotBeSubmitted="Your Buy Token transaction could not be submitted."
        messageObjects.buyTokens="Buy Tokens"
        messageObjects.doNotHaveAnyTokens_addTokens="You Do not Have any Tokens, Add new Tokens by tapping the Add Tokens button below."
        messageObjects.addTokens = "Add Tokens"
        messageObjects.base58Format = "Base 58 Format"
        messageObjects.hexFormat = "Hex Format"
        messageObjects.sell="Sell"
        messageObjects.expectedFabcoins = "Expected Fabcoins"
        messageObjects.numberOfTokensToSell = "Number Of Tokens To Sell"
        messageObjects.sellTokens = "Sell Tokens"
        messageObjects.doNotHaveEnoughTokensToProceedWithThisTx = "You do not have enough Tokens to proceed with this transaction."
        messageObjects.sellTokenTxSubmittedSuccessfully = "Your Sell Token transaction has been submitted successfully."
        messageObjects.sellTokenTxCouldNotBeSubmitted = "Your Sell Token transaction could not be submitted."
        messageObjects.amountCannotBeGreaterThenAvailableTokenBalance = "The amount cannot be greater then the available Token Balance"
        messageObjects.sendTokenTxSubmittedSuccessfully = "Your send token transaction has been submitted successfully."
        messageObjects.sendTokenTxCouldNotBeSubmitted = "Your Send Token transaction could not be submitted."
        messageObjects.tokenAmount= "Token Amount"
        messageObjects.sendTokens="Send Tokens"
        messageObjects.requestTokens="Request Tokens"
        messageObjects.info = "Info"
        messageObjects.sendFabcoinsToTokenAddress="Send Fabcoins To Token Address"
        messageObjects.addressDoesNotHaveFabcoins_kindlySendFabcoinsToThatAddress = "The address associated with this token does not have any fabcoins. Kindly send some fabcoins to that address and try again after the address has some balance."
        messageObjects.fabcoinAndTokenBalanceCorrospondsToCurrentStateOfBlockchain = "The Fabcoin and Token balance corrosponds to the current state of the blockchain. It may not neccessarily reflect latest transactions submitted by you."
        messageObjects.tokenHistory = "Token History"
        messageObjects.transactionType = "Transaction Type"
        messageObjects.tokenList = "Token List"
        messageObjects.selectAddress = "Select Address"
        messageObjects.isNotAssociatedWithAddressInWallet_SelectAddressToAddToWallet = "is not associated with the addresses in your wallet. You can select from any of the addresses below to add to your wallet."
        messageObjects.kindlySelectTheTokenFirst="Kindly select the token first."
        messageObjects.tokenTransaction = "Token Transaction"
        messageObjects.yourself="Yourself"
        messageObjects.fee_infabcoins = "Fee (in Fabcoins)"
        messageObjects.transactionId = "Transaction Id"
        messageObjects.none = "none"
        messageObjects.tokenTransactionDetail = "Token Transaction Detail"
        messageObjects.internalUtxoAreCoinbaseNotMature_YouCanSpend="Some of your internal UTXOs are coinbase transactions and not mature for spending yet. You can spend"
        messageObjects.FABAsOfNow="FAB as of  now."
        messageObjects.fee = "Fee"
        messageObjects.requestedTokenAmount = "Requested Token Amount"
        messageObjects.fabcoinsToBeSpent = "Fabcoins To be Spent"
        messageObjects.gasFee = "Gas Fee"
    }
    else if (currentLanguage === langList.chinese) {

        messageObjects.language = "中文"
        messageObjects.selectPrefferedLanguage = "选择首选语言"
        messageObjects.fabLightWallet = "FAB轻便钱包"
        messageObjects.walletSetup = "钱包设置"
        messageObjects.ifYouChooseHdWallet = "如果您选择“恢复HD钱包”，系统会要求您输入12个助记词"
        messageObjects.newWallet = "新钱包"
        messageObjects.restoreWallet = "还原HD钱包"

        messageObjects.createASecurePassword = "创建一个安全的密码"
        messageObjects.yourPasswordIsKeyToYourWallet = "您的密码是您钱包的关键。请创建一个安全的密码。"
        messageObjects.passwordEightCharLong = "密码必须由至少8个字符组成。 "
        messageObjects.passwordNoSpace = "必须无空格。"
        messageObjects.passwordSpChar = "密码必须至少包含一个特殊字符。([,!,@,#,$,%,^,&,*,(,),_,+,-,=,~,])"
        messageObjects.passwordOneNumber = "密码必须至少包含一个数字。"
        messageObjects.next = "下一页"
        messageObjects.verifyYourPassword = "验证您的密码"
        messageObjects.mnemonicWords = "助记词"
        messageObjects.kindlySaveMnemonic = "请保存这些助记词并保存在安全的地方。这些词语以后可以用于复原您的钱包（需要时）。"
        messageObjects.enterMnemonic = "输入助记词"
        messageObjects.kindlyEnterMnemonic = "请在给定字段中按顺序输入助记词。请记住，这些词是大小写区分的"
        messageObjects.success = "成功"
        messageObjects.mnemonicsVerifiedMsg = "您的助记词已成功验证。您的钱包现在将与主区块链同步。这可能要等候一段时间。"
        messageObjects.fabcoinWallet = "FAB钱包"
        messageObjects.currentBalance = "当前余额"
        messageObjects.sendFabcoin = "发送Fabcoin"
        messageObjects.receiveFabcoins = "接收Fabcoin"
        messageObjects.transactionHistory = "交易历史"
        messageObjects.settings = "设置"
        messageObjects.exit = "退出钱包"

        messageObjects.fabWalletSettings = "FAB钱包设置"
        messageObjects.requirePasswordForEveryTx = "每次发送交易都需要输入密码"
        messageObjects.minNumCnf = "最少确认区块数：30个区块"
        messageObjects.synchronize = "同步数据"
        messageObjects.showMnemonics = "显示助记词"
        messageObjects.resetPassword = "重设密码"
        messageObjects.deleteWallet = "删除钱包"
        messageObjects.goToDashboard = "退回主页面"
        messageObjects.receiversAddress = "收款人地址"
        messageObjects.pasteAddress = "粘贴地址"
        messageObjects.amount = "数额"
        messageObjects.send = "发送"
        messageObjects.back = "返回"
        messageObjects.receiveAddress = "接收地址"
        messageObjects.copyAddress = "复制地址"

        messageObjects.error = "错误"
        messageObjects.yourNewPasswordIsSameAsOld = "您输入的密码与旧的密码相同，请尝试不同的密码"
        messageObjects.Ok = "确认"
        messageObjects.enterPassword = "输入密码"
        messageObjects.yourPasswordResetSuccessfully = "您的密码重置成功"
        messageObjects.mnemonicErrorMsg = "一个或多个助记词不正确，请输入正确的助记词"
        messageObjects.kindlyEnterAllWords = "请输入更多的正确的词"
        messageObjects.enterReceiversAddress = "输入接收者的地址"
        messageObjects.enterAmountToBeSent = "输入发送数量"
        messageObjects.theAddress = "地址"
        messageObjects.isSuccessfullyCopiedToClipboard = "已成功粘贴到剪贴板"
        messageObjects.passwordsNoMatchCreateNew = "密码不匹配，请创建新密码"
        messageObjects.passwordCreatedSuccessfully = "您的密码创建成功"
        messageObjects.passwordIncorrect = "您输入的密码不正确"
        messageObjects.invalidAddress = "您输入的地址无效，请输入有效地址"
        messageObjects.emptyAmount = "输入金额无效，请输入有效金额"
        messageObjects.amountMustBeGreaterThenZero = "金额必须大于 " + minimumThresholdAmount + "."
        messageObjects.insufficientFunds = "余额不足，钱包余额小于发送金额以及交易费用。请重新输入交易金额。"
        messageObjects.permissionChange = "许可改变"
        messageObjects.enterPasswordToApplySetting = "请输入用户密码"
        messageObjects.enterCurrentPassword = "请输入用户密码"
        messageObjects.preferencesSaved = "设定成功"
        messageObjects.yes = "是"
        messageObjects.no = "否"
        messageObjects.exitSure = "确认退出？"
        messageObjects.deleteWalletSure = "此操作不可恢复！如果你删除此钱包，所有数据，交易信息将丢失！按取消退出删除，输入密码并点击确认，将继续删除。"
        messageObjects.setPinForLogin = "设置锁屏密码"
        messageObjects.createPin = "创建四位锁屏数字密码"
        messageObjects.createPinTitle = "创建锁屏数字密码（最少四位数字)"
        messageObjects.enterPin = "请输入锁屏数字密码"
        messageObjects.changeLanguage = "选择语言"
        messageObjects.fabcoinsReceived = "接受发币"
        messageObjects.youHaveReceived = "已经收到 "
        messageObjects.fabcoins = " 发币."
        messageObjects.kindlyEnterPasswordToCompleteThisAction = "请输入用户密码确认"
        messageObjects.kindlyEnterCurrentPasswordToCompleteThisAction = "请输入用户密码授权"
        messageObjects.confirm = "确认"
        messageObjects.cancel = "取消"
        messageObjects.connectionTimeout = "网络故障"
        messageObjects.kindlyResetConnectionOrTryAfterSomeTime = "网络故障，请稍后再试"
        messageObjects.kindlyCheckTxDetailsAndEnterPassword = "请检查以下交易信息，输入用户密码并点击确认发送此交易，按取消放弃次交易。"
        messageObjects.to = "发送给"
        messageObjects.transactionFee = "交易费"
        messageObjects.fabcoinsSent = "发送发币"
        messageObjects.sendTransactionSubmitted = "发送交易成功"
        messageObjects.walletRestoredSuccessfully = "钱包回复成功"
        messageObjects.newAddresses = "新地址"
        messageObjects.additionalAddressesWillBeGenerated = "创建新的钱包地址中......"
        messageObjects.incorrectPinMessage = "锁屏密码不匹配，请输入正确锁屏密码或使用用户密码登录。"
        messageObjects.pinAtLeast4Digits = "锁屏密码最少四位数字"
        messageObjects.loginPinSet = "设置锁屏密码"
        messageObjects.pinSetSuccessfully = "锁屏密码设置成功"
        messageObjects.synchronizeMessage = "钱包数据同步中 ......  从FAB 区块链中检索你所有地址交易并计算余额， 此步骤需要较长时间，请等待。"
        messageObjects.synchronizeSuccessful = "钱包数据同步完成"
        messageObjects.pinDeleted = "锁屏密码删除"
        messageObjects.pinDeletedSuccessfully = "锁屏密码删除成功"
        messageObjects.walletDeleted = "钱包删除"
        messageObjects.walletDeletedSuccessfully = "钱包删除成功"
        messageObjects.setPin = "设置锁屏密码"
        messageObjects.deletePin = "删除锁屏密码"
        messageObjects.txIdCopied = "交易ID 已拷贝"
        messageObjects.blockHashCopied = "区块链哈希值已拷贝"
        messageObjects.passwordVerified = "用户密码确认"
        messageObjects.passwordVerifyMessage = "用户密码创建成功。钱包正在计算交易地址簿，请等待......"
        messageObjects.login = "登陆"
        messageObjects.transactions = "交易"
        messageObjects.transactionDetail = "交易明细"
        messageObjects.goToTxHistory = "交易历史"
        messageObjects.spendableBalance = "可花费余额 "
        messageObjects.deductTxFee = "从交易金额中扣除手续费"
        messageObjects.termsAndConditions = "条款与协议"
        messageObjects.refresh = "刷新"
        messageObjects.iAgreeToTermsAndConditions = "我同意条款和条件"
        messageObjects.faq = "常问问题"
        messageObjects.sendErrorMessage = "无法发送该交易。\n请检查您的网络连接并同步您的钱包后再尝试。"
        messageObjects.enterComment = "输入评论（可选）"
        messageObjects.verifyMnemonic = "验证助记词"
        messageObjects.walletRefreshedAt = "该钱包已刷新成功  "  
        messageObjects.allWordsVerified = "所有助记词都已验证成功"
        messageObjects.wrongMnemonicErrorInitialSetup = "您输入的助记符不正确。 您将被带回助记词页面，在该页面您会再次看到助记词并更正您记录中的任何错误。"
        messageObjects.wrongMnemonicError = "您输入的助记词不正确。请进入设置页面，点击显示助记词，再次查看助记词并更正您记录中的任何错误。"
        messageObjects.enterMnemonicToVerify = "为验证助记词记录是否正确，请输入你记录的助记词"
        messageObjects.amountMustBePositivenumber = "金额必须是正数"
        messageObjects.scanQrCode = "扫描QR码"
        messageObjects.Type = "类型"
        messageObjects.Date = "日期"
        messageObjects.Comment = "备注"
        messageObjects.receive = "接收"
        messageObjects.synchronizing = "数据同步中..."
        messageObjects.generatingNewAddresses = "正在生成新地址..."
        messageObjects.tokens = "代币"
        messageObjects.myTokens="我的代币"
        messageObjects.addTokensFromList="添加代币到列表"
        messageObjects.addOtherTokens="添加另一个代币"
        messageObjects.receiveTokens="接收代币"
        messageObjects.abort="关于"
        messageObjects.enterToken_contractAddress = "输入代币（合约）地址"
        messageObjects.tokenContractAddress = "代币合约地址"
        messageObjects.checkContractValidity = "检查合约有效性"
        messageObjects.selectWalletAddressForToken = "选择代币的钱包地址"
        messageObjects.addToken="添加代币"
        messageObjects.addressCouldntBeScanned_tryAgain="改地址无法被扫描，请再次尝试"
        messageObjects.invalidContractAddress_enterCorrectAddress="您输入的地址不是有效的合约地址，\n请输入正确的合约地址"
        messageObjects.tokenAlreadyPresent="代币已经存在"
        messageObjects.tokenAlreadyPresentMsg ="您输入的代币合约地址已经在您的钱包当中"
        messageObjects.tokenNameNotAvailable="该合约地址的代币名称不存在"
        messageObjects.tokenSymbolNotAvailable="该合约地址的代币符号不存在"
        messageObjects.tokenGetBalanceNotAvailable="该合约地址的获取余额的代币功能无法使用"
        messageObjects.tokenTransferFunctionNotAvailable="该合约地址的转移代币功能无法使用"
        messageObjects.tokenBuyPriceNotAvailable="该合约地址的买价功能无法使用"
        messageObjects.tokenSellPriceNotAvailable="该合约地址的卖价功能无法使用"
        messageObjects.tokenBuyFunctionNotAvailable="该合约地址的购买功能无法使用"
        messageObjects.tokenSellFunctionNotAvailable="该合约地址的出售功能无法使用"
        messageObjects.theToken="该代币"
        messageObjects.tokenValidated_chooseAddress="已经验证成功。现在你可以选择下列列表中的一个地址，并添加代币到你的钱包"
        messageObjects.localAddressAlreadyAssociatedWithToken="你已经有一个本地地址关联这个代币合约"
        messageObjects.kindlyReviewDetails="麻烦您复审下列细节："
        messageObjects.tokenName="代币名称"
        messageObjects.tokenSymbol="代币符号"
        messageObjects.contractAddress="合约地址"
        messageObjects.localWalletAddressForToken="本地钱包代币地址"
        messageObjects.tokenBalance="代币余额"
        messageObjects.wouldYouLikeToAddThisToken = "您是否想添加该代币到您的钱包？"
        messageObjects.hasBeenAddedSuccessfullyToYourWallet="已经成功添加到您的钱包"
        messageObjects.kindlyCheckContractValidity="麻烦您将其添加到钱包之前核对合约有效性"
        messageObjects.tokenInformation="代币信息"
        messageObjects.kindlyVerifyTokenInfoAndTapConfirmToAdd="麻烦您验证所有代币相关信息，然后输入确认添加代币"
        messageObjects.buy="购买"
        messageObjects.tokenPrice="代币价格"
        messageObjects.addressFabcoinBalance="该地址FABcoin余额"
        messageObjects.requiredFabcoins="要求的FABcoin"
        messageObjects.notEnoughFabcoinsToProceedWithTransaction = "您的FABcoin余额不足无法进行该交易"
        messageObjects.buyTokenTxSubmittedSuccessfully = "您的购买代币交易已经成功提交"
        messageObjects.buyTokenTxCouldNotBeSubmitted="您的购买代币交易无法提交"
        messageObjects.buyTokens="购买代币"
        messageObjects.doNotHaveAnyTokens_addTokens="您没有任何代币，添加新的代币可点击下方“添加代币”按钮"
        messageObjects.addTokens = "添加代币"
        messageObjects.base58Format = "Base 58格式"
        messageObjects.hexFormat = "十六进制格式"
        messageObjects.sell="出售"
        messageObjects.expectedFabcoins = "预期的FABcoin"
        messageObjects.numberOfTokensToSell = "将要出售的代币数量"
        messageObjects.sellTokens = "出售代币"
        messageObjects.doNotHaveEnoughTokensToProceedWithThisTx = "您的代币数额不足，无法进行该交易"
        messageObjects.sellTokenTxSubmittedSuccessfully = "您的出售代币交易已被成功提交"
        messageObjects.sellTokenTxCouldNotBeSubmitted = "您的出售代币交易无法提交"
        messageObjects.amountCannotBeGreaterThenAvailableTokenBalance = "该数额无法"
        messageObjects.sendTokenTxSubmittedSuccessfully = "您的发送代币交易已被成功提交"
        messageObjects.sendTokenTxCouldNotBeSubmitted = "您的发送代币交易无法提交"
        messageObjects.tokenAmount= "代币数量"
        messageObjects.sendTokens="发送代币"
        messageObjects.requestTokens="请求代币"
        messageObjects.info = "信息"
        messageObjects.sendFabcoinsToTokenAddress="发送FABcoin到代币地址"
        messageObjects.addressDoesNotHaveFabcoins_kindlySendFabcoinsToThatAddress = "该代币的关联地址没有任何FABcoin，麻烦您发送一些FABcoin到改地址，并在改地址有一些余额后再次尝试改地址"
        messageObjects.fabcoinAndTokenBalanceCorrospondsToCurrentStateOfBlockchain = "FABcoin和代币余额与当前区块链状态相一致，您提交的最新交易不一定被显示出来"
        messageObjects.tokenHistory = "代币历史"
        messageObjects.transactionType = "交易类型"
        messageObjects.tokenList = "代币列表"
        messageObjects.selectAddress = "选择地址"
        messageObjects.isNotAssociatedWithAddressInWallet_SelectAddressToAddToWallet = "未与您钱包地址相连。您可以选择下列任何地址添加到您的钱包"
        messageObjects.kindlySelectTheTokenFirst="麻烦您先选择代币"
        messageObjects.tokenTransaction = "代币交易"
        messageObjects.yourself="您自己"
        messageObjects.fee_infabcoins = "费用（FABcoin）"
        messageObjects.transactionId = "交易ID"
        messageObjects.none = "没有的"
        messageObjects.tokenTransactionDetail = "代币交易细节"
        messageObjects.internalUtxoAreCoinbaseNotMature_YouCanSpend="您的一些内部的UTXO是挖矿交易，并且还未成熟至可交易。您可以花费。"
        messageObjects.FABAsOfNow="截至目前的FAB."
        messageObjects.fee = "费用"
        messageObjects.requestedTokenAmount = "代币需求数量"
        messageObjects.fabcoinsToBeSpent = "Fabcoin可花费"
    }
}

exports.navigation = navigation;
exports.langList = langList;
exports.execute = execute;
exports.currentLanguage = currentLanguage;
exports.setCurrentLanguage = setCurrentLanguage;
exports.messageObjects = messageObjects;
exports.appSettingsObjects = appSettingsObjects;
exports.currentNetwork = currentNetwork;
exports.databaseObjects = databaseObjects;
exports.addressType = addressType;
exports.transitions = transitions;
exports.configURL = configURL;
exports.configURLExistAddress = configURLExistAddress;
exports.configURLUtxo = configURLUtxo;
exports.configURLSendTx = configURLSendTx;
exports.configURLGetTx = configURLGetTx;
exports.apiEndPoints = apiEndPoints;
exports.apiSendTx = apiSendTx;
exports.apiGetTx = apiGetTx;
exports.apiExistAddress = apiExistAddress;
exports.apiUtxo = apiUtxo;
exports.minimumPasswordLength = minimumPasswordLength;
exports.minimumThresholdAmount = minimumThresholdAmount;
exports.getCurrentLanguage = getCurrentLanguage;
exports.tokenTransactionType = tokenTransactionType;
//TESTING purposes only Exports
exports.restoreTest = restoreTest;
exports.availableTokens = availableTokens
exports.testErcAbi = testErcAbi
