const frameModule = require("tns-core-modules/ui/frame");
const dialogs = require("tns-core-modules/ui/dialogs");
const globalVars = require("../../globalVars")
const walletManager = require("../../walletManager")
const app = require("tns-core-modules/application")
const abi = require("web3-eth-abi")
const axios = require("axios")
const ObservableModule = require("tns-core-modules/data/observable")



var page;
var availableTokens = globalVars.availableTokens;
var myTokens;
var vm;
var currentAddressForToken;
var addressArray;
var currentTokenListIndex = -1;
var maxNumAddresses = 5; //Top 5 addresses can be added to the address Array 
var tokenType = {isTokenPreExisting : false, localWalletAddress : "",balance:0};

exports.pageLoaded = function (args) {

    tokenType.isTokenPreExisting = false;
    tokenType.localWalletAddress = ""
    tokenType.balance = 0

    currentTokenListIndex = -1;
    maxNumAddresses = 5;
    addressArray = [];
   // tokenChosenWithAddressPresentButNotAdded = false;

    page = args.object;
    myTokens = walletManager.getMyTokens();


    //in the actual application, the available tokens will be supplied through the api

    let tmpArray = availableTokens;
    tmpArray.forEach(element => {
        element.test0 = globalVars.messageObjects.tokenName+" : "+element.name 
        element.test1 = globalVars.messageObjects.tokenSymbol+" : "+element.symbol
        element.test2 = globalVars.messageObjects.contractAddress+" : "+element.address
    })

    vm = new ObservableModule.Observable();
    //vm.set("availableTokens", availableTokens)
    vm.set("availableTokens",tmpArray)
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

    page.getViewById("actionBar").title = globalVars.messageObjects.tokens
    page.getViewById("title").text = globalVars.messageObjects.tokenList
    page.getViewById("selectWalletAddress").text = globalVars.messageObjects.selectWalletAddressForToken
    page.getViewById("addToken").text = globalVars.messageObjects.addToken
    page.getViewById("back").text = globalVars.messageObjects.back

};

exports.addressForTokenChanged = function (args) {
    //console.log(args.oldIndex, args.newIndex)
    let currentIndex = args.newIndex;
    currentAddressForToken = addressArray[currentIndex]
    console.log(currentAddressForToken)
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


exports.onItemTap = async function (args) {

    //console.log(args.index)

    tokenType.isTokenPreExisting = false;
    //maybe autodetect first and then assign to address?

    /*
    steps to take on item tap
    1) go through the address list and check their balances for the contracts
    2) when the balance is found, give message to the user and "hard code" that address with the contract-token when user taps add token
    3) if no balance is found with any address, let user choose the address and add the token with user chosen address with the token when user taps add token
    */

    /*for (let i = 0; i < availableTokens.length; i++) {
        page.getViewById("item" + i).style = "background-color:rgb(20,57,115);color:white;"
    }*/

    currentTokenListIndex = args.index;
  //  console.log(currentTokenListIndex)
    vm.set("currentTokenListIndex", currentTokenListIndex);
   // console.log(vm.get("currentTokenListIndex"))

    //highlight selected token
   /* page.getViewById("item" + currentTokenListIndex).style = "background-color:rgb(20,57,150);color:white;"
*/
    const index = args.index;
    const token = availableTokens[index]

    let isTokenPresentLocally = false;
    for (let i = 0; i < myTokens.length; i++) {
        if (myTokens[i].ContractAddress === token.address) {
            isTokenPresentLocally = true
            break;
        }
    }

    if (isTokenPresentLocally) {
        await dialogs.confirm({ title: globalVars.messageObjects.tokenAlreadyPresent, message: globalVars.messageObjects.tokenAlreadyPresentMsg, okButtonText: globalVars.messageObjects.Ok })
        return;
    }
    vm.set("isLoading", true)

    let balanceFound = await checkAllAddressesForTokenBalance(token.address)
    console.log(balanceFound)

    vm.set("isLoading", false)

    if (balanceFound.balance > 0) { //this means that the balance is present
        let tokenAdd = await dialogs.confirm({
            title: globalVars.messageObjects.addToken, message: globalVars.messageObjects.wouldYouLikeToAddThisToken + "\n\n "+ globalVars.messageObjects.tokenName +" : " + token.name + "\n " + globalVars.messageObjects.tokenSymbol +" : " + token.symbol + "\n" + globalVars.messageObjects.contractAddress +" : " + token.address + "\n"+globalVars.messageObjects.localWalletAddressForToken +
                " : \n" + addressArray[balanceFound.balanceIndex] + "\n"+globalVars.messageObjects.tokenBalance +
                " : " + balanceFound.balance, okButtonText: globalVars.messageObjects.yes, cancelButtonText: globalVars.messageObjects.no
        }).then((Response) => { return Response; })

        if (tokenAdd) { //user responded yes
            walletManager.addToken(token.address, addressArray[balanceFound.balanceIndex], token.name, token.symbol, balanceFound.balance)
            myTokens = walletManager.getMyTokens() //refresh tokens

            await dialogs.confirm({ title: globalVars.messageObjects.success, message:  globalVars.messageObjects.theToken + " - " + token.name + "(" + token.symbol + ") "+ globalVars.messageObjects.hasBeenAddedSuccessfullyToYourWallet, okButtonText: globalVars.messageObjects.Ok })

            frameModule.topmost().navigate({
                moduleName: globalVars.navigation.myTokens,
                animated: true,
                transition: globalVars.transitions.slideRight,
                context: { info: availableTokens[index] }
            })

            tokenType.isTokenPreExisting = false;
        }
        else { //user responded no - if addtoken is clicked, the user will be using the address derived from the address list - to avoid that, 
           // tokenChosenWithAddressPresentButNotAdded = true     
           tokenType.isTokenPreExisting = true;
           tokenType.localWalletAddress = addressArray[balanceFound.balanceIndex]  
           tokenType.balance = balanceFound.balance;
            
        }
    }
    else { //this means that no balance was found - the user can select an address and add the token manually
        await dialogs.confirm({ title: globalVars.messageObjects.selectAddress, message: globalVars.messageObjects.theToken + " - " + token.name + "(" + token.symbol + ") " + globalVars.messageObjects.isNotAssociatedWithAddressInWallet_SelectAddressToAddToWallet, okButtonText: globalVars.messageObjects.Ok })
        tokenType.isTokenPreExisting = false;
    }

    return;

    //query for token balance here.
    /*
        vm.set("isLoading",true)
        let address = walletManager.getAddress(globalVars.addressType.receive, 0)
        let balance = 0;// console.log(1)
        let fxnOutputs = globalVars.testErcAbi[5].outputs;
        let fxnCallHex;// console.log(address)
        let myAddress = walletManager.bs58ToVmAddress(address)
        let parameters = [myAddress]
    
    
       // console.log(parameters)
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
        await axios.default.post("http://fabtest.info:9001/fabapi/callcontract", [token.address, fxnCallHex]).then(Response => {
           // console.log(Response.data)
            let x = Response.data.executionResult.output;
            let p = abi.decodeParameters(fxnOutputs, x)[0]
    
           // console.log(p)
            balance = p;
        }).catch((e) => {
            console.log("error")
            console.log(e)
        })
    
    
        vm.set("isLoading",false)
    
         tokenAdd = await dialogs.confirm({ title: "Add Token", message: "Would you like to add The following Token?\n\nName : " + token.name + "\nSymbol : " + token.symbol + "\nAddress : " + token.address + "\nToken Balance : " + balance, okButtonText: "Yes", cancelButtonText: "No" }).then((Response) => { return Response; })
    
    
        if (tokenAdd) {
    
            walletManager.addToken(token.address, token.name, token.symbol, balance)
    
            await dialogs.confirm({ title: globalVars.messageObjects.success, message: "The Token - " + token.name + "(" + token.symbol + ") has been Added to your wallet successfully", okButtonText: "Ok" })
    
            frameModule.topmost().navigate({
                moduleName: globalVars.navigation.myTokens,
                animated: true,
                transition: globalVars.transitions.slideRight,
                context: { info: availableTokens[index] }
            })
        }*/

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
    }

    return {
        balanceIndex: balanceFoundAt,
        balance: b
    };
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
    function stripHexPrefix(str) {
        if (str.length > 2 && str[0] === '0' && str[1] === 'x') {
            return str.slice(2);
        }
        return str;
    }

    fxnCallHex = stripHexPrefix(fxnCallHex);
    await axios.default.post("http://fabtest.info:9001/fabapi/callcontract", [tokenContractAddress, fxnCallHex]).then(Response => {
        // console.log(Response.data)
        let x = Response.data.executionResult.output;
        let p = abi.decodeParameters(fxnOutputs, x)[0]

        // console.log(p)
        balance = p;
    }).catch((e) => {
       // console.log("error")
        //console.log(e)
        balance = 0; //maybe show appropriate error msg
    })


    return balance;
}

exports.addTokenClicked = async function () {



    if(currentTokenListIndex < 0){
        await dialogs.alert({title:globalVars.messageObjects.success,message:globalVars.messageObjects.kindlySelectTheTokenFirst+globalVars.messageObjects.kindlyselec,okButtonText:globalVars.messageObjects.Ok})
        return;
    }

   // console.log(currentTokenListIndex, currentAddressForToken)
    let currentToken = availableTokens[currentTokenListIndex];
   // console.log(currentToken)


    //console.log(tokenType)

   // return;

    let isTokenPresentLocally = false;
    for (let i = 0; i < myTokens.length; i++) {
        if (myTokens[i].ContractAddress === currentToken.address) {
            isTokenPresentLocally = true
            break;
        }
    }

    if (isTokenPresentLocally) {
        await dialogs.confirm({ title: globalVars.messageObjects.tokenAlreadyPresent, message: globalVars.messageObjects.tokenAlreadyPresentMsg, okButtonText: globalVars.messageObjects.Ok })
        return;
    }
    else {

        console.log("here")

        let cAddress = (tokenType.isTokenPreExisting) ? tokenType.localWalletAddress : currentAddressForToken;
        let cBalance = (tokenType.isTokenPreExisting) ? tokenType.balance : 0;

        let res = await dialogs.confirm({ title: globalVars.messageObjects.tokenInformation, message: globalVars.messageObjects.kindlyVerifyTokenInfoAndTapConfirmToAdd + "\n"+globalVars.messageObjects.tokenName +" : " + currentToken.name + "\n" + globalVars.messageObjects.tokenSymbol + " : " + currentToken.symbol + "\n" +globalVars.messageObjects.tokenBalance +" : "+cBalance+"\n" + globalVars.messageObjects.tokenContractAddress +" : " + currentToken.address + "\n"+globalVars.messageObjects.localWalletAddressForToken + " : " + cAddress , okButtonText:globalVars.messageObjects.confirm, cancelButtonText: globalVars.messageObjects.cancel })


        if (res) {
            walletManager.addToken(currentToken.address, cAddress, currentToken.name, currentToken.symbol, cBalance)
            myTokens = walletManager.getMyTokens()

            dialogs.alert({title:globalVars.messageObjects.success,message:globalVars.messageObjects.theToken+" "+currentToken.name+" "+globalVars.messageObjects.hasBeenAddedSuccessfullyToYourWallet,okButtonText:globalVars.messageObjects.Ok})
        }
    }
    // console.log(myTokens)
}