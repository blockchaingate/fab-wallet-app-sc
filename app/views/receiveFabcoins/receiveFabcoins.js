const frameModule = require("tns-core-modules/ui/frame");
const dialogs = require("tns-core-modules/ui/dialogs");
const clipboard = require("nativescript-clipboard")
const globalVars = require("../../globalVars")
const walletManager = require("../../walletManager")
const app = require("tns-core-modules/application")
var ZXing = require('nativescript-zxing');
var imageSource = require("tns-core-modules/image-source")

var page;
var currentBalance;


exports.pageLoaded = function (args) {
    page = args.object;
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
                moduleName: globalVars.navigation.dashboard,
                animated: true,
                transition: globalVars.transitions.slideRight
            })
        }
    }

    page.getViewById("actionBar").title = globalVars.messageObjects.receiveFabcoins
    page.getViewById("text1").text = globalVars.messageObjects.receiveAddress
    page.getViewById("copyBtn").text = globalVars.messageObjects.copyAddress
    //page.getViewById("backBtn").text = globalVars.messageObjects.back
    page.getViewById("backBtn").text = globalVars.messageObjects.goToDashboard
    
    setReceiveAddress()
    updateCurrentBalance();
};

var updateBalance = function (balance) {

    if (currentBalance === undefined) return
    currentBalance = balance;
    page.getViewById("currentBalanceLabel").text = globalVars.messageObjects.currentBalance + " : " + currentBalance + " FAB"

}



function updateCurrentBalance() {
    currentBalance = walletManager.getCurrentBalance();
    page.getViewById("currentBalanceLabel").text = globalVars.messageObjects.currentBalance + " : " + currentBalance + " FAB"
}

var updateReceiveAddress = function(){
    setReceiveAddress()
}

async function setReceiveAddress(){

   let rAddress = await (walletManager.getReceiveAddress());
   page.getViewById('myReceiveAddress').text = rAddress;

   var zx = new ZXing();
   var qrimg = zx.createBarcode({encode: rAddress, height: 200, width: 200, format: ZXing.QR_CODE});
   
   page.getViewById("img").imageSource = imageSource.fromNativeSource(qrimg)
}

exports.copyClicked = function () {

    clipboard.setText(page.getViewById('myReceiveAddress').text).then(function (text) {
        dialogs.alert({ title: globalVars.messageObjects.copyAddress, message: globalVars.messageObjects.theAddress +" "+ page.getViewById('myReceiveAddress').text + " "+globalVars.messageObjects.isSuccessfullyCopiedToClipboard, okButtonText: globalVars.messageObjects.Ok })
    })
}

exports.backClicked = function () {

    frameModule.topmost().navigate({
        moduleName: globalVars.navigation.dashboard,
        animated: true,
        transition: globalVars.transitions.slideRight
    })
}

exports.updateBalance = updateBalance;
exports.updateReceiveAddress = updateReceiveAddress;