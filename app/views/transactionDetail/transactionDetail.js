const globalVars = require("../../globalVars");
const walletManager = require("../../walletManager");
const frameModule = require("tns-core-modules/ui/frame");
const app = require("tns-core-modules/application")
const axios = require("axios")
const clipboard = require("nativescript-clipboard")
const dialog = require("tns-core-modules/ui/dialogs")
var orientationModule = require("nativescript-screen-orientation");
var page;
var myContext;
var bHash;

exports.pageLoaded = async function (args) {

    page = args.object;
    orientationModule.setCurrentOrientation("portrait");

    walletManager.setIdleTime()
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
                moduleName: globalVars.navigation.transactionHistory,
                animated: true,
                transition: globalVars.transitions.slideRight
            })
        }
    }

    myContext = page.navigationContext;

   // let p = await axios.get(globalVars.configURLGetTx+myContext.txid+"/true") ;
   let p = await axios.get(walletManager.getCurrentApiEndpoint() + globalVars.apiGetTx+myContext.txid+"/true") ;
    page.getViewById("actionBar").title = globalVars.messageObjects.transactionDetail

    page.getViewById("type").text = "Type : "+myContext.type
    page.getViewById("to").text = "To : "+ ((myContext.to == 0) ? "Yourself" : myContext.to)
    page.getViewById("amount").text = "Amount : "+myContext.amt
    page.getViewById("fee").text = "Fee : "+myContext.fee
    page.getViewById("txid").text = "Transaction Id : "+myContext.txid

    page.getViewById("numCnf").text = p.data.confirmations

    if(p.data.confirmations > 30){
        page.getViewById("numCnf").color = "green"
    }
    else{   
        page.getViewById("numCnf").color = "red"
    }

    bHash = p.data.blockhash;

    page.getViewById("date").text = "Date : " +myContext.date
    page.getViewById("blockhash").text = "Block Hash : " + p.data.blockhash

    page.getViewById("transactionDetailLabel").text = globalVars.messageObjects.transactionDetail
    page.getViewById("goToTxHistory").text = globalVars.messageObjects.goToTxHistory
    page.getViewById("goToDashboard").text = globalVars.messageObjects.goToDashboard
}

exports.goToTxHistoryClicked = function() {
    frameModule.topmost().navigate({
        moduleName: globalVars.navigation.transactionHistory,
        animated: true,
        transition: globalVars.transitions.slideRight
    })
}

exports.goToDashboardClicked = function () {
    frameModule.topmost().navigate({
        moduleName: globalVars.navigation.dashboard,
        animated: true,
        transition: globalVars.transitions.slideRight
    })
}

exports.copyTxIdClicked = function(){
    clipboard.setText(myContext.txid)
    dialog.alert({title:globalVars.messageObjects.success,message:globalVars.messageObjects.txIdCopied,okButtonText:globalVars.messageObjects.Ok});
}

exports.copyBlockHashClicked = function(){
    clipboard.setText(bHash)
    dialog.alert({title:globalVars.messageObjects.success,message:globalVars.messageObjects.blockHashCopied,okButtonText:globalVars.messageObjects.Ok});
}