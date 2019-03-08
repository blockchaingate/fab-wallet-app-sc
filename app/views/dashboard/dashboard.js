const frameModule = require("tns-core-modules/ui/frame");
const dialogs = require("tns-core-modules/ui/dialogs");
const app = require("tns-core-modules/application")
const globalVars = require("../../globalVars")
const walletManager = require("../../walletManager")
var orientationModule = require("nativescript-screen-orientation");


var page;
var currentBalance;
var apiReqInterval = 60000 //60 seconds, can be changed later
var refreshClickedAt = 0;
var l;

setInterval(function () {

    if (walletManager.getSynchronizeActive()) return;

    if (!walletManager.getSynchronizeActive()) {
        walletManager.checkSpentTxConfirmations()
        // walletManager.checkLastReceiveAddressesForReceiptOfFunds();
    }
}, apiReqInterval)



exports.pageLoaded = function (args) {

    //this must be called 
    walletManager.init()
    orientationModule.setCurrentOrientation("portrait");
    walletManager.setIdleTime()
    page = args.object;

    if (page.ios) {

        //use this long method to hide the back link
        frameModule.topmost().ios.controller.visibleViewController.navigationItem.setHidesBackButtonAnimated(true, false);

        // page.getViewById("refreshBtn").text = globalVars.messageObjects.refresh
        page.getViewById("sendBtn").text = globalVars.messageObjects.sendFabcoin
        page.getViewById("receiveBtn").text = globalVars.messageObjects.receiveFabcoins
        page.getViewById("txHistoryBtn").text = globalVars.messageObjects.transactionHistory
        page.getViewById("settingsBtn").text = globalVars.messageObjects.settings
        page.getViewById("tokenBtn").text = globalVars.messageObjects.tokens


    }
    else if (page.android) {
        //do android specific stuff here

        let t1 = globalVars.messageObjects.sendFabcoin
        let t2 = page.getViewById("sendBtn").text

        if (String(t1)[t1.length - 1] === String(t2)[t2.length - 1]) {

        }
        else {
            page.getViewById("sendBtn").text += globalVars.messageObjects.sendFabcoin
            page.getViewById("receiveBtn").text += globalVars.messageObjects.receiveFabcoins
            page.getViewById("txHistoryBtn").text += globalVars.messageObjects.transactionHistory
            page.getViewById("settingsBtn").text += globalVars.messageObjects.settings
        }

        let activity = app.android.startActivity ||
            app.android.foregroundActivity ||
            frameModule.topmost().android.currentActivity ||
            frameModule.topmost().android.activity

        //This is how android back button can be overriden
        activity.onBackPressed = function () {

            dialogs.confirm({ title: globalVars.messageObjects.exit, message: globalVars.messageObjects.exitSure, okButtonText: globalVars.messageObjects.yes, cancelButtonText: globalVars.messageObjects.no }).then((res) => {
                if (res) {
                    walletManager.exit();
                }
            })
        }
    }

    page.getViewById("actionBar").title = globalVars.messageObjects.fabLightWallet

    currentBalance = walletManager.getCurrentBalance();

    page.getViewById("title").text = globalVars.messageObjects.fabcoinWallet
    page.getViewById("currentBalanceLabel").text = globalVars.messageObjects.currentBalance + " : " + currentBalance + " FAB"

    page.getViewById("exitBtn").text = globalVars.messageObjects.exit

    walletManager.checkLastReceiveAddressesForReceiptOfFunds();

    if (refreshClickedAt !== 0) {
        let d = new Date()
        if (d - refreshClickedAt < 60000) {
            page.getViewById("refreshBtn").isUserInteractionEnabled = false;
            page.getViewById('refreshBtn').disabled = true;
            page.getViewById('refreshBtn').class = 'btn btn-outline btn-rounded-lg font-awesome disabled';

            setTimeout(function () {
                page.getViewById("refreshBtn").isUserInteractionEnabled = true;
                page.getViewById('refreshBtn').disabled = false;
                page.getViewById('refreshBtn').class = 'btn btn-outline btn-rounded-lg font-awesome';
            }, 60000 - (d - refreshClickedAt))
        }
    }
};

exports.refreshClicked = async function () {

    let r = await walletManager.checkLastReceiveAddressesForReceiptOfFunds();
    let d = new Date();
    dialogs.alert({ title: globalVars.messageObjects.refresh, message: globalVars.messageObjects.walletRefreshedAt + d, okButtonText: globalVars.messageObjects.Ok });


    page.getViewById("refreshBtn").isUserInteractionEnabled = false;
    page.getViewById('refreshBtn').disabled = true;
    page.getViewById('refreshBtn').class = 'btn btn-outline btn-rounded-lg font-awesome disabled';

    refreshClickedAt = d.getTime()

    setTimeout(function () {
        page.getViewById("refreshBtn").isUserInteractionEnabled = true;
        page.getViewById('refreshBtn').disabled = false;
        page.getViewById('refreshBtn').class = 'btn btn-outline btn-rounded-lg font-awesome';
    }, 60000)

    //l = "refresh Cluicked"
}

exports.tokensClicked = function() {

    frameModule.topmost().navigate({
        moduleName:globalVars.navigation.tokenPage,
        animated:true,
        transition:globalVars.transitions.slideLeft
    })
}


var updateBalance = function (balance) {
    if (currentBalance === undefined) return
    currentBalance = balance;
    page.getViewById("currentBalanceLabel").text = globalVars.messageObjects.currentBalance + " : " + currentBalance + " FAB"
}

exports.sendClicked = function () {

    frameModule.topmost().navigate({
        moduleName: globalVars.navigation.sendFabcoins,
        animated: true,
        transition: globalVars.transitions.slideLeft
    })
}

exports.receiveClicked = function () {

    frameModule.topmost().navigate({
        moduleName: globalVars.navigation.receiveFabcoins,
        animated: true,
        transition: globalVars.transitions.slideLeft
    })

}

exports.settingsClicked = function () {

    frameModule.topmost().navigate({
        moduleName: globalVars.navigation.settings,
        animated: true,
        transition: globalVars.transitions.slideRight
    })
}

exports.txHistoryClicked = function () {
    frameModule.topmost().navigate({
        moduleName: globalVars.navigation.transactionHistory,
        animated: true,
        transition: globalVars.transitions.slideLeft
    })
}


exports.exitClicked = function () {
    //finish all the exit stuff here    
    walletManager.exit();
}

exports.updateBalance = updateBalance