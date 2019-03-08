const frameModule = require("tns-core-modules/ui/frame");
const dialogs = require("tns-core-modules/ui/dialogs");
const globalVars = require("../../globalVars")
const walletManager = require("../../walletManager")
const app = require("tns-core-modules/application")


var page;
var info;
var addressFabcoinBalance = 0;
var addressForToken;



exports.pageLoaded = async function (args) {

    page = args.object;
    info = page.navigationContext.info
    console.log(page.navigationContext)

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

    //let addressFabcoinBalance = 0;
    //this address is 
    // let addressForToken = walletManager.getAddress(globalVars.addressType.receive,0)
    // console.log(addressForToken)

    //local wallet address associated with the token is now available.
    addressForToken = info.LocalWalletAddress;
    addressFabcoinBalance = await walletManager.getAddressBalance(addressForToken);
    // console.log("affff",addressFabcoinBalance)
    //get balance for this address


    page.getViewById("actionBar").title = globalVars.messageObjects.fabLightWallet
    page.getViewById("title").text = info.Name
    page.getViewById("name").text = globalVars.messageObjects.tokenName + " : " + info.Name
    page.getViewById("symbol").text = globalVars.messageObjects.tokenSymbol + " : " + info.Symbol
    page.getViewById("balance").text = globalVars.messageObjects.tokenBalance + " : " + info.Balance
    page.getViewById("addressBalance").text = globalVars.messageObjects.addressFabcoinBalance + " : " + addressFabcoinBalance;
    page.getViewById("addressForToken").text = globalVars.messageObjects.localWalletAddressForToken + " : " + info.LocalWalletAddress
    page.getViewById("sendTokens").text = globalVars.messageObjects.sendTokens
    page.getViewById("requestTokens").text = globalVars.messageObjects.requestTokens
    page.getViewById("sellTokens").text = globalVars.messageObjects.sellTokens
    page.getViewById("buyTokens").text = globalVars.messageObjects.buyTokens
    page.getViewById("back").text = globalVars.messageObjects.back


};

exports.backClicked = function () {

    frameModule.topmost().navigate({
        moduleName: globalVars.navigation.myTokens,
        animated: true,
        transition: globalVars.transitions.slideRight
    })
}


var checkForFabcoinBalance = async function(){

    if (Number(addressFabcoinBalance) === Number(0)) {

        let res = await dialogs.confirm({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.addressDoesNotHaveFabcoins_kindlySendFabcoinsToThatAddress, okButtonText: globalVars.messageObjects.sendFabcoinsToTokenAddress, cancelButtonText: globalVars.messageObjects.cancel })

        //  console.log(res)

        //temporary fix, this address may change as the architecture changes
        // let address = walletManager.getAddress(globalVars.addressType.receive, 0)

        //custom address for token is now available
        let address = addressForToken;

        
        if (res === true) {
            frameModule.topmost().navigate({
                moduleName: globalVars.navigation.sendFabcoins,
                animated: true,
                transition: globalVars.transitions.slideLeft,
                context: {
                    address: address
                }
            })
        }
        return -1;
    }
    return 1;
}


exports.sendTokenClicked = async function () {


    /*here, check if the wallet address associated with the 
    token has at least one utxo.
    */
    let res = await checkForFabcoinBalance();
    if(res < 0) return;

   
    frameModule.topmost().navigate({
        moduleName: globalVars.navigation.sendTokens,
        animated: true,
        transition: globalVars.transitions.slideLeft,
        context: { info: page.navigationContext.info }
    })
}

exports.buyClicked = async function () {


       /*here, check if the wallet address associated with the 
    token has at least one utxo.
    */
   let res = await checkForFabcoinBalance();
   if(res < 0) return;


   // let address = walletManager.getAddress(globalVars.addressType.receive, 0)
    let address = addressForToken;
    info.AddressFabcoinBalance = addressFabcoinBalance;
    info.Address = address;

    frameModule.topmost().navigate({
        moduleName: globalVars.navigation.buyTokens,
        animated: true,
        transition: globalVars.transitions.slideLeft,
        context: { info: page.navigationContext.info }
    })
}

exports.sellClicked = async function () {


    /*here, check if the wallet address associated with the 
    token has at least one utxo.
    */
   let res = await checkForFabcoinBalance();
   if(res < 0) return;

   // let address = walletManager.getAddress(globalVars.addressType.receive, 0)
    let address = addressForToken;
    info.AddressFabcoinBalance = addressFabcoinBalance;
    info.Address = address;

    frameModule.topmost().navigate({
        moduleName: globalVars.navigation.sellTokens,
        animated: true,
        transition: globalVars.transitions.slideLeft,
        context: { info: page.navigationContext.info }
    })
}


exports.receiveTokenClicked = function () {
    frameModule.topmost().navigate({
        moduleName: globalVars.navigation.receiveTokens,
        animated: true,
        transition: globalVars.transitions.slideLeft,
        context: { previousPage: globalVars.navigation.tokenDashboard, info: page.navigationContext.info }
    })
}

// This function will get the latest token balance and latest fabcoin balence
// of the wallet address associated with the token
exports.refreshClicked = async function () {

    //the address may change depending upon further updates
    //  let address = walletManager.getAddress(globalVars.addressType.receive, 0)
    //local wallet address for the tokens is now available as per the new design
    let address = info.LocalWalletAddress;

    let fabcoinBalance = await walletManager.getLatestAddressBalance(address)
    // let tokenBalance = await walletManager.getTokenBalance(info.ContractAddress,info.Name);
    let tokenBalance = await walletManager.getTokenBalance(info.ContractAddress, info.Name, address);


    if (Number(fabcoinBalance) !== Number(addressFabcoinBalance)) {
        addressFabcoinBalance = Number(fabcoinBalance)
        page.getViewById("addressBalance").text = globalVars.messageObjects.addressFabcoinBalance + " : " + addressFabcoinBalance;

        // console.log("fabcoin balance changed")
    }

    // console.log(tokenBalance , info.Balance)
    if (Number(tokenBalance) !== Number(info.Balance)) {

        info.Balance = tokenBalance;
        page.getViewById("balance").text = globalVars.messageObjects.tokenBalance + " : " + tokenBalance

        // console.log("token balance changed  ")
    }

    dialogs.alert({ title: globalVars.messageObjects.info, message: globalVars.messageObjects.fabcoinAndTokenBalanceCorrospondsToCurrentStateOfBlockchain, okButtonText: globalVars.messageObjects.Ok })

    // console.log(tokenBalance)
    // console.log(fabcoinBalance)    
}