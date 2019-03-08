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

    page.getViewById("actionBar").title = globalVars.messageObjects.receiveTokens
    page.getViewById("text1").text = globalVars.messageObjects.receiveAddress
    page.getViewById("copyBtn").text = globalVars.messageObjects.copyAddress
    //page.getViewById("backBtn").text = globalVars.messageObjects.back
    page.getViewById("backBtn").text = globalVars.messageObjects.back

    page.getViewById("base58Btn").text = globalVars.messageObjects.base58Format
    page.getViewById("hexBtn").text = globalVars.messageObjects.hexFormat
    
    setReceiveAddress()
    updateCurrentBalance();
};

var updateBalance = function (balance) {

    if (currentBalance === undefined) return
    currentBalance = balance;
    page.getViewById("currentBalanceLabel").text = globalVars.messageObjects.currentBalance + " : " + currentBalance + " FAB"

}



function updateCurrentBalance() {
   
   /* currentBalance = walletManager.getCurrentBalance();
    page.getViewById("currentBalanceLabel").text = globalVars.messageObjects.currentBalance + " : " + page.navigationContext.info.Balance+" "+page.navigationContext.info.Symbol */

}

var updateReceiveAddress = function(){
    setReceiveAddress()
}

async function setReceiveAddress(addressFormat){

/*
    if(page.navigationContext.info && page.navigationContext.info.LocalWalletAddress) console.log(page.navigationContext.info.LocalWalletAddress) 
    else
    console.log("none address")
*/

   let rAddress = (page.navigationContext.info && page.navigationContext.info.LocalWalletAddress) ? page.navigationContext.info.LocalWalletAddress : walletManager.getAddress(globalVars.addressType.receive,0) ; //await (walletManager.getReceiveAddress());


   if(addressFormat && addressFormat === "hex"){
      rAddress = walletManager.bs58ToVmAddress(rAddress)
   }

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

    //assuming that the page was directed to from token dashboard
    if(page.navigationContext.info){
        frameModule.topmost().navigate({
            moduleName:page.navigationContext.previousPage,
            animated:true,
            transition:globalVars.transitions.slideRight,
            context:{info:page.navigationContext.info}
        })
    }
    else{
        frameModule.topmost().navigate({
            moduleName:page.navigationContext.previousPage,
            animated:true,
            transition:globalVars.transitions.slideRight
        })
    }
}

exports.base58Clicked = function(){

    page.getViewById("base58Btn").class = "btn btn-outline btn-rounded-lg btn-fill"
    page.getViewById("hexBtn").class = "btn btn-outline btn-rounded-lg"


    setReceiveAddress("base58")

}

exports.hexClicked = function() {

    page.getViewById("base58Btn").class = "btn btn-outline btn-rounded-lg "
    page.getViewById("hexBtn").class = "btn btn-outline btn-rounded-lg btn-fill"

    setReceiveAddress("hex")
}


exports.updateBalance = updateBalance;
exports.updateReceiveAddress = updateReceiveAddress;