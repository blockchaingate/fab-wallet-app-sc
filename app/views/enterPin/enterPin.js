const frameModule = require("tns-core-modules/ui/frame");
const dialogs = require("tns-core-modules/ui/dialogs");
const globalVars = require("../../globalVars")
const walletManager = require("../../walletManager")
var utils = require("tns-core-modules/utils/utils");
var insomnia = require("nativescript-insomnia");
var orientationModule = require("nativescript-screen-orientation");
const app = require("tns-core-modules/application")

var page;

exports.pageLoaded = function (args) {

    page = args.object;
    orientationModule.setCurrentOrientation("portrait");

    page.getViewById("actionBar").title = globalVars.messageObjects.fabLightWallet
    page.getViewById("title").text = globalVars.messageObjects.enterPin
    page.getViewById("pin").hint = globalVars.messageObjects.enterPin
    page.getViewById("enterPasswordBtn").text = globalVars.messageObjects.enterPassword
    page.getViewById("nextBtn").text = globalVars.messageObjects.next
    page.getViewById("exitBtn").text = globalVars.messageObjects.exit


    if (page.ios) {
     
        page.getViewById('pin').style = "height:35;";
        page.getViewById('pin').focus()
        //use this long method to hide the back link
        frameModule.topmost().ios.controller.visibleViewController.navigationItem.setHidesBackButtonAnimated(true, false);
    }
    else if (page.android) {
       
        setTimeout(function () {
            page.getViewById('pin').android.requestFocus();
            var imm = utils.ad.getInputMethodManager()
            imm.showSoftInput(page.getViewById('pin').android, 0);
        }, 300)


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

    insomnia.keepAwake();
};

exports.loginClicked = function () {

    let userPin = page.getViewById('pin').text;
    let isPinValid = walletManager.verifyUserPin(userPin)

    if (isPinValid) {

        frameModule.topmost().navigate({
            moduleName: globalVars.navigation.dashboard,
            animated: true,
            transition: globalVars.transitions.slideLeft
        })
    }
    else {
        dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.incorrectPinMessage, okButtonText: globalVars.messageObjects.Ok })   //"The Password you entered is incorrect.\nPlease enter the correct password.")
    }
}

exports.enterPasswordClicked = function () {
    frameModule.topmost().navigate({
        moduleName: globalVars.navigation.enterPassword,
        animated: true,
        transition: globalVars.transitions.slideLeft
    })
}

exports.exitClicked = function () {

    walletManager.exit()

}