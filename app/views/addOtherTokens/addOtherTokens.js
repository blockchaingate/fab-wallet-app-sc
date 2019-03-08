const frameModule = require("tns-core-modules/ui/frame");
const dialogs = require("tns-core-modules/ui/dialogs");
const globalVars = require("../../globalVars")
const walletManager = require("../../walletManager")
const app = require("tns-core-modules/application")
const abi = require("web3-eth-abi")
const axios = require("axios")
const clipboard = require("nativescript-clipboard")
const ObservableModule = require("tns-core-modules/data/observable")
var BarcodeScanner = require("nativescript-barcodescanner").BarcodeScanner;



var page;
var myTokens;
var vm;
var currentAddressForToken;
var addressArray;
var currentTokenListIndex = -1;
var maxNumAddresses = 5; //Top 5 addresses can be added to the address Array 
var isContractValid;

var tokenObject = {
    contractAddress: "",
    localWalletAddress: "",
    tokenName: "",
    tokenSymbol: "",
    balance: ""
}

exports.pageLoaded = function (args) {


    addressArray = [];
    isContractValid = false;

    page = args.object;
    myTokens = walletManager.getMyTokens();

    vm = new ObservableModule.Observable();
    //  vm.set("availableTokens", availableTokens)
    vm.set("isLoading", false)

    page.bindingContext = vm;

    //Top 5 addresses can be added to the address Array 
    // The user can choose a single address for the tokens
    for (let i = 0; i < maxNumAddresses; i++) {
        addressArray.push(walletManager.getAddress(globalVars.addressType.receive, i))
    }

    currentAddressForToken = addressArray[0];

    vm.set("walletAddresses", addressArray)
    vm.set("selectedIndex", 0);
    vm.set("currentTokenListIndex", currentTokenListIndex);

    if (page.ios) {
        //use this long method to hide the back link
        frameModule.topmost().ios.controller.visibleViewController.navigationItem.setHidesBackButtonAnimated(true, false);
    }
    else if (page.android) {
        //do android specific stuff here

        let activity = app.android.startActivity ||
            app.android.foregroundActivity ||
            frameModule.topmost().android.currentActivity ||
            frameModule.topmost().android.activity

        //This is how android back button can be overriden
        activity.onBackPressed = function () {
            frameModule.topmost().navigate({
                moduleName: globalVars.navigation.dashboard,
                animated: true,
                transition: globalVars.transitions.slideRight
            })
        }
    }


    page.getViewById("actionBar").title = globalVars.messageObjects.fabLightWallet
    page.getViewById("title").text = globalVars.messageObjects.enterToken_contractAddress;
    page.getViewById("contractAddress").hint = globalVars.messageObjects.tokenContractAddress
    page.getViewById("pasteBtn").text = globalVars.messageObjects.pasteAddress
    page.getViewById("qrcodeBtn").text = globalVars.messageObjects.scanQrCode
    page.getViewById("checkContractValidity").text = globalVars.messageObjects.checkContractValidity
    page.getViewById("selectWalletAddress").text = globalVars.messageObjects.selectWalletAddressForToken
    page.getViewById("addToken").text = globalVars.messageObjects.addToken
    page.getViewById("back").text = globalVars.messageObjects.back



};

exports.addressForTokenChanged = function (args) {
    //console.log(args.oldIndex, args.newIndex)
    let currentIndex = args.newIndex;
    currentAddressForToken = addressArray[currentIndex]
    //console.log(currentAddressForToken)
}

exports.backClicked = function () {

    ///this may have to be set according to the previous page
    // console.log(page.navigationContext)
    if (page.navigationContext) {
        frameModule.topmost().navigate({
            moduleName: page.navigationContext.previousPage,
            animated: true,
            transition: globalVars.transitions.slideRight
        })
    }
    else {
        frameModule.topmost().navigate({
            moduleName: globalVars.navigation.myTokens,
            animated: true,
            transition: globalVars.transitions.slideRight
        })
    }
}

async function checkAllAddressesForTokenBalance(contractAddress) {

    let balanceFoundAt = -1
    let b = 0;

    for (let i = 0; i < addressArray.length; i++) {
        b = await getAddressTokenBalance(contractAddress, addressArray[i]);
        if (b > 0) {
            balanceFoundAt = i;
            break;
        }
        else if (b < 0) {//there was an error in the get balance api call
            return false;
        }
    }

    return {
        balanceIndex: balanceFoundAt,
        balance: b
    };
}

function stripHexPrefix(str) {
    if (str.length > 2 && str[0] === '0' && str[1] === 'x') {
        return str.slice(2);
    }
    return str;
}

async function getAddressTokenBalance(tokenContractAddress, localWalletAddress) {

    let address = localWalletAddress;
    let balance = 0;// console.log(1)
    let fxnOutputs = globalVars.testErcAbi[5].outputs;
    let fxnCallHex;// console.log(address)
    let myAddress = walletManager.bs58ToVmAddress(address)
    let parameters = [myAddress]


    // console.log(parameters)
    fxnCallHex = abi.encodeFunctionCall(
        globalVars.testErcAbi[5],
        parameters);


    fxnCallHex = stripHexPrefix(fxnCallHex);
    await axios.default.post("http://fabtest.info:9001/fabapi/callcontract", [tokenContractAddress, fxnCallHex]).then(Response => {
        // console.log(Response.data)
        let x = Response.data.executionResult.output;
        let p = abi.decodeParameters(fxnOutputs, x)[0]

        // console.log(p)
        balance = p;
    }).catch((e) => {
        //console.log("error")
        //console.log(e)
        balance = -1 //to indicate that there is an error
    })

    return balance;
}

exports.pasteClicked = function () {
    clipboard.getText().then(function (text) {
        page.getViewById("contractAddress").text = text
    })

    isContractValid = false
}

exports.qrClicked = function () {

    var barcodescanner = new BarcodeScanner();
    barcodescanner.scan({
        formats: "QR_CODE,PDF_417",   // Pass in of you want to restrict scanning to certain types
        cancelLabel: "EXIT. Also, try the volume buttons!", // iOS only, default 'Close'
        cancelLabelBackgroundColor: "#333333", // iOS only, default '#000000' (black)
        message: "Use the volume buttons for extra light", // Android only, default is 'Place a barcode inside the viewfinder rectangle to scan it.'
        showFlipCameraButton: false,   // default false
        preferFrontCamera: false,     // default false
        showTorchButton: true,        // default false
        beepOnScan: true,             // Play or Suppress beep on scan (default true)
        torchOn: false,               // launch with the flashlight on (default false)
        closeCallback: function () { /* console.log("Scanner closed");*/ return; }, // invoked when the scanner was closed (success or abort)
        resultDisplayDuration: 500,   // Android only, default 1500 (ms), set to 0 to disable echoing the scanned text
        orientation: "portrait",     // Android only, optionally lock the orientation to either "portrait" or "landscape"
        openSettingsIfPermissionWasPreviouslyDenied: true // On iOS you can send the user to the settings app if access was previously denied
    }).then(
        function (result) {

            //Address type checking may not be suitable as the address can be either in hex format or base58 format
            /* try {
               //  Btc.address.toOutputScript(result.text, globalVars.currentNetwork)
             }
             catch (e) {
 
                 //In Error : It means that the QR Code Does not repesent a valid addresss
                 page.getViewById("contractAddress").text = ""
                 return;
             }*/

            page.getViewById("contractAddress").text = result.text;
        },
        function (error) {
            dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.addressCouldntBeScanned_tryAgain, okButtonText: globalVars.messageObjects.Ok })
        }
    );

    isContractValid = false;
}

exports.checkContractValidityClicked = async function () {

    isContractValid = false;
    /*when the user taps this button, following conditions must be met before the token can be added to the wallet.
    * 0) check from the available addresses that the token already has been added to the address or not. 
    * 1) the name of the token must be available through the api
    * 2) the symbol of the token must be available through the api
    * 3) the get address balance for the token must be available through the api - This can serve dual purpose - it can not only check for the existance of the functionality, but also if the wallet has any tokens that were previously added to it. 
    * 4) transfer token functinality must be available (test it with callcontract)
    * 5) buy and sell price must be available through the api
    * 6) buy and sell functionality must be available through the api
    * 
    * when all the above information is available, the token can be added to the local wallet along with the user selected address.
    */


    // console.log(currentTokenListIndex,currentAddressForToken)
    // let currentToken = availableTokens[currentTokenListIndex];
    // console.log(currentToken)

    let tokenContractAddress = page.getViewById("contractAddress").text;

    //console.log(tokenContractAddress);

    //first check if the contract address is a valid vm address
    if (!walletManager.isValidVmAddress(tokenContractAddress)) {
        dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.invalidContractAddress_enterCorrectAddress, okButtonText: globalVars.messageObjects.Ok })
        return;
    }

    let isTokenPresentLocally = false;
    for (let i = 0; i < myTokens.length; i++) {
        if (myTokens[i].ContractAddress === tokenContractAddress) {
            isTokenPresentLocally = true
            break;
        }
    }

    if (isTokenPresentLocally) {
        await dialogs.confirm({ title: globalVars.messageObjects.tokenAlreadyPresent, message: globalVars.messageObjects.tokenAlreadyPresentMsg, okButtonText: globalVars.messageObjects.Ok })
        return;
    }

    //At this point, it can be safely said that the token address is a valid vm address and it is not currently present in the wallet.

   
    vm.set("isLoading", true)
    //get contract name - add appropriate checks before proceeding further
    let tokenName = await getTokenName(tokenContractAddress)

    if (!tokenName) {
        await dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.tokenNameNotAvailable, okButtonText: globalVars.messageObjects.abort})
        vm.set("isLoading", false)
        return;
    }

    let tokenSymbol = await getTokenSymbol(tokenContractAddress)

    if (!tokenSymbol) {
        await dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.tokenSymbolNotAvailable, okButtonText: globalVars.messageObjects.abort })
        vm.set("isLoading", false)
        return;
    }

    let balance = await checkAllAddressesForTokenBalance(tokenContractAddress); //this gives the  balance (if any) and address index in JSON format as follows : {"balanceIndex": 0, "balance":5}

    if (balance === false) {
        await dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.tokenGetBalanceNotAvailable, okButtonText: globalVars.messageObjects.abort})
        vm.set("isLoading", false)
        return;
    }

    let transferFunctionality = await checkTransferFunctionality(tokenContractAddress, addressArray[0], addressArray[1]) //use first two addresses for testing the functionality

    if (transferFunctionality === false) {
        await dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.tokenTransferFunctionNotAvailable, okButtonText: globalVars.messageObjects.abort })
        vm.set("isLoading", false)
        return;
    }

    let buyPrice = await checkBuyPrice(tokenContractAddress);
    //console.log(buyPrice)

    if (buyPrice === false) {
        await dialogs.alert({
            title: globalVars.messageObjects.error,
            message: globalVars.messageObjects.tokenBuyPriceNotAvailable, okButtonText: globalVars.messageObjects.abort
        })
        vm.set("isLoading", false)
        return;
    }


    let sellPrice = await checkSellPrice(tokenContractAddress);
    //console.log(sellPrice)

    if (sellPrice === false) {
        await dialogs.alert({
            title: globalVars.messageObjects.error,
            message: globalVars.messageObjects.tokenSellPriceNotAvailable, okButtonText: globalVars.messageObjects.abort
        })
        vm.set("isLoading", false)
        return;
    }

    let buyFunctionality = await checkBuyFunctionality(tokenContractAddress)
    //console.log("buy functionality = ", buyFunctionality)

    if (buyFunctionality === false) {
        await dialogs.alert({
            title: globalVars.messageObjects.error,
            message: globalVars.messageObjects.tokenBuyFunctionNotAvailable, okButtonText: globalVars.messageObjects.abort
        })
        vm.set("isLoading", false)
        return;
    }

    let sellFunctionality = await checkSellFunctionality(tokenContractAddress)
    //console.log("sell functionality = ", sellFunctionality)

    if (sellFunctionality === false) {
        await dialogs.alert({
            title: globalVars.messageObjects.error,
            message: globalVars.messageObjects.tokenSellFunctionNotAvailable, okButtonText: globalVars.messageObjects.abort
        })
        vm.set("isLoading", false)
        return;
    }



    //checkAllAddressesForTokenBalance function must be the basis for selecting the local wallet address for the token - if any address already have any token associated with it, the user cannot choose any other address. Thus, this function will have a precedence when it comes to selecting the address for the token

    vm.set("isLoading", false)

    isContractValid = true;
    //console.log(tokenName, tokenSymbol, balance, transferFunctionality)


    if (balance.balanceIndex === -1) {
      
        //in this case, the user should be allowed to select the address and add the token accordingly.
        dialogs.alert({ title: globalVars.messageObjects.success, message: globalVars.messageObjects.theToken +" '" + tokenName + "' " + globalVars.messageObjects.tokenValidated_chooseAddress, okButtonText: globalVars.messageObjects.Ok })

        tokenObject.contractAddress = tokenContractAddress;
        tokenObject.tokenSymbol = tokenSymbol;
        tokenObject.tokenName = tokenName;
        tokenObject.balance = balance.balance;
        tokenObject.localWalletAddress = false; //so that it can be assigned at the time of adding the token
    }
    else {
        /*
        The address for the token is already choosen for the user. Ask user if they would like to add this token to their wallet.
        */
        let res = await dialogs.confirm({ title: tokenName, message:  globalVars.messageObjects.localAddressAlreadyAssociatedWithToken+globalVars.messageObjects.kindlyReviewDetails+"\n"+ globalVars.messageObjects.tokenN +" : "+tokenName+"\n"+ globalVars.messageObjects.tokenSymbol+" : "+tokenSymbol+"\n"+globalVars.messageObjects.contractAddress +" : "+tokenContractAddress+"\n"+globalVars.messageObjects.localWalletAddressForToken +" : "+addressArray[balance.balanceIndex]+"\n" + globalVars.messageObjects.tokenBalance+" : "+balance.balance+"\n"+globalVars.messageObjects.wouldYouLikeToAddThisToken, okButtonText: globalVars.messageObjects.yes, cancelButtonText: globalVars.messageObjects.no })
       // console.log(res)
        //return;


        if (res) {

            //add the token to the wallet
            walletManager.addToken(tokenContractAddress, addressArray[balance.balanceIndex], tokenName, tokenSymbol, balance.balance);
            isContractValid = false; // to avoid any error with double tapping

            dialogs.alert({ title: globalVars.messageObjects.success, message: globalVars.messageObjects.theToken +" '" + tokenName +"' "+ globalVars.messageObjects.hasBeenAddedSuccessfullyToYourWallet, okButtonText: globalVars.messageObjects.Ok })

        }
        else {
            //hard set the local wallet address in such a way that user can not alter it while adding the token

            //a global object can be set that would hold all the information about the token and when the user taps add token, the information is used to add the token to the wallet

            tokenObject.contractAddress = tokenContractAddress;
            tokenObject.tokenSymbol = tokenSymbol;
            tokenObject.tokenName = tokenName;
            tokenObject.balance = balance.balance;
            tokenObject.localWalletAddress = addressArray[balance.balanceIndex]
        }
    }
}

exports.addTokenClicked = async function () {

    if (!isContractValid) {
        dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.kindlyCheckContractValidity, okButtonText: globalVars.messageObjects.Ok })
        return;
    }

    //at this point, the contract is validated and either of the two situations are possible : i.e. the token object has address or it doesn't 
    //if it doesn't have an address, then assign an address to it.

    //console.log(tokenObject)
   // console.log(currentAddressForToken)
    //here we can safely say that the contract is validated.
    //here, check if token is already associated with any of the available address, and if not, use the address that is selected by the user
    if (tokenObject.localWalletAddress === false) {
        
        tokenObject.localWalletAddress = currentAddressForToken;
        //console.log("here")
       // console.log(currentAddressForToken)
    }




    //before adding the token, show all the information to the user and ask to confirm
    /*contract address
    localWalletAddress
    tokenName
    tokenSymbol
    balance
    walletManager.addToken()
    */

    let res = await dialogs.confirm({ title: globalVars.messageObjects.tokenInformation, message: messageObjects.kindlyCheckContractValidity+ "\n"+globalVars.messageObjects.tokenName +" : " + tokenObject.tokenName + "\n"+ globalVars.messageObjects.tokenSymbol+" : " + tokenObject.tokenSymbol + "\n"+ globalVars.messageObjects.tokenBalance+" : " + tokenObject.balance + "\n"+globalVars.messageObjects.tokenContractAddress +" : " + tokenObject.contractAddress + "\n"+ globalVars.messageObjects.localWalletAddressForToken+" : " + tokenObject.localWalletAddress, okButtonText: globalVars.messageObjects.confirm, cancelButtonText: globalVars.messageObjects.cancel})

    if (res) {

        walletManager.addToken(tokenObject.contractAddress, tokenObject.localWalletAddress, tokenObject.tokenName, tokenObject.tokenSymbol, tokenObject.balance);

        dialogs.alert({ title:globalVars.messageObjects.success, message: globalVars.messageObjects.theToken+ " '" + tokenObject.tokenName + "' "+globalVars.messageObjects.hasBeenAddedSuccessfullyToYourWallet, okButtonText: globalVars.messageObjects.Ok })

        isContractValid = false; //to avoid errors due to double tapping
    }
}

exports.addressForTokenChanged = function (args) {
    //console.log(args.oldIndex, args.newIndex)
    let currentIndex = args.newIndex;
    currentAddressForToken = addressArray[currentIndex]
    // console.log(currentAddressForToken)
    tokenObject.localWalletAddress === currentAddressForToken
}

async function callContract(tokenContractAddress, fxnCallHex, fxnOutputs) {

    let result;
    await axios.default.post("http://fabtest.info:9001/fabapi/callcontract", [tokenContractAddress, fxnCallHex]).then(Response => {
        // console.log(Response.data)
        let x = Response.data.executionResult.output;

        try {
            result = abi.decodeParameters(fxnOutputs, x)[0]
        }
        catch (e) {
            result = false;
        }


    }).catch((e) => {
        //console.log("error")
        //console.log(e)
        result = false;
    })

    return result;

}

async function getTokenName(tokenContractAddress) {

    let fxnOutputs = globalVars.testErcAbi[0].outputs;
    let fxnCallHex;
    let parameters = []
    fxnCallHex = abi.encodeFunctionCall(
        globalVars.testErcAbi[0],
        parameters);

    fxnCallHex = stripHexPrefix(fxnCallHex);
    let tokenName = await callContract(tokenContractAddress, fxnCallHex, fxnOutputs)

    return tokenName;
}

async function getTokenSymbol(tokenContractAddress) {

    let fxnOutputs = globalVars.testErcAbi[6].outputs;
    let fxnCallHex;
    let parameters = []
    fxnCallHex = abi.encodeFunctionCall(
        globalVars.testErcAbi[6],
        parameters);

    fxnCallHex = stripHexPrefix(fxnCallHex);
    let tokenSymbol = await callContract(tokenContractAddress, fxnCallHex, fxnOutputs)

    return tokenSymbol;
}

async function checkTransferFunctionality(tokenContractAddress, fromAddress, toAddress) {

    let amount = 0

    //both the from and to addresses are going to be in the bs58 format
    //convert them both to hex format
    fromAddress = walletManager.bs58ToVmAddress(fromAddress);
    toAddress = walletManager.bs58ToVmAddress(toAddress);

    let fxnCallHex = abi.encodeFunctionCall(globalVars.testErcAbi[7], [toAddress, amount])

    fxnCallHex = stripHexPrefix(fxnCallHex)

    let ss = await axios.post("http://fabtest.info:9001/fabapi/callcontract", [tokenContractAddress, fxnCallHex, fromAddress]).then((res) => {
        //console.dir(res)
        let fxnOutputs = globalVars.testErcAbi[7].outputs;
        let x = res.data.executionResult.output

        try {
            abi.decodeParameters(fxnOutputs, x)[0]
        }
        catch (e) {
           // console.log("There was an error")
            //console.log(e)
            //throw e; 
            return false;
        }
        return true;
    }, (e) => {
        //console.log("Error")
        //console.log(e)
        return false;
    })

    //console.log(ss)

    //this means that there was some issue with the call contract, hence the transaction is not valid
    if (!ss) return false; //error with the call contract

    return true;
}

async function checkBuyPrice(tokenContractAddress) {

    let price = 0;
    let fxnOutputs = globalVars.testErcAbi[12].outputs;
    let fxnCallHex;
    let parameters = []

    fxnCallHex = abi.encodeFunctionCall(
        globalVars.testErcAbi[12],
        parameters);

    fxnCallHex = stripHexPrefix(fxnCallHex);

    price = await callContract(tokenContractAddress, fxnCallHex, fxnOutputs);
    return price;
}

async function checkSellPrice(tokenContractAddress) {

    let price = 0;
    let fxnOutputs = globalVars.testErcAbi[14].outputs;
    let fxnCallHex;
    let parameters = []

    fxnCallHex = abi.encodeFunctionCall(
        globalVars.testErcAbi[14],
        parameters);

    fxnCallHex = stripHexPrefix(fxnCallHex);

    price = await callContract(tokenContractAddress, fxnCallHex, fxnOutputs);
    return price;

}

async function checkBuyFunctionality(tokenContractAddress) {

    let fxnCallHex = abi.encodeFunctionCall(globalVars.testErcAbi[13], [])
    let fxnOutputs = globalVars.testErcAbi[13].outputs;
    fxnCallHex = stripHexPrefix(fxnCallHex)
    let response = await axios.post("http://fabtest.info:9001/fabapi/callcontract", [tokenContractAddress, fxnCallHex, walletManager.bs58ToVmAddress(addressArray[0])]).then((res) => {
        // console.dir(res)
        let x = res.data.executionResult.output
        try {
            let s = abi.decodeParameters(fxnOutputs, x)[0]

            // console.log("s ===", s)
        }
        catch (e) {
            //throw e; 
            return false;
        }
        return true;
    }, (e) => {
        // console.log("Error")
        // console.log(e)

        return false;
    })
    return response;
}

async function checkSellFunctionality(tokenContractAddress) {

    let tokenAmount = 0; //testing purposes only
    //the sell functionality check only works when the token amount is less then or equal to the actual balance of the tokens for the given address.
    //assuming that for the test that we are doing, the address that we are testing with, may not necessarily have any tokens within it.

    let fxnCallHex = abi.encodeFunctionCall(globalVars.testErcAbi[15], [tokenAmount])
    let fxnOutputs = globalVars.testErcAbi[15].outputs;
    fxnCallHex = stripHexPrefix(fxnCallHex)
    let response = await axios.post("http://fabtest.info:9001/fabapi/callcontract", [tokenContractAddress, fxnCallHex, walletManager.bs58ToVmAddress(addressArray[0])]).then((res) => {
        // console.dir(res)
        let x = res.data.executionResult.output
        try {
            let s = abi.decodeParameters(fxnOutputs, x)[0]
            //console.log("s ===", s)
        }
        catch (e) {
            //throw e; 
            return false;
        }
        return true;
    }, (e) => {
        // console.log("Error")
        // console.log(e)
        return false;
    })
    return response;
}