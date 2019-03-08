const frameModule = require("tns-core-modules/ui/frame");
const globalVars = require("../../globalVars")
var insomnia = require("nativescript-insomnia");
var orientationModule = require("nativescript-screen-orientation");
const app = require("tns-core-modules/application")

var page;
exports.pageLoaded = function (args) {

    page = args.object;

    orientationModule.setCurrentOrientation("portrait");

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
                moduleName: globalVars.navigation.termsAndConditions,
                animated: true,
                transition: globalVars.transitions.slideRight
            })

        }
    }

    page.getViewById("actionBar").title = globalVars.messageObjects.fabLightWallet
    page.getViewById("title").text = globalVars.messageObjects.walletSetup
    page.getViewById("text1").text = globalVars.messageObjects.ifYouChooseHdWallet
    page.getViewById("newWalletBtn").text = globalVars.messageObjects.newWallet
    page.getViewById("restoreWalletBtn").text = globalVars.messageObjects.restoreWallet

    insomnia.keepAwake();
}

exports.newWalletClicked = function () {
    frameModule.topmost().navigate({
        moduleName: globalVars.navigation.createPassword,
        context: {
            execute: globalVars.execute.newWallet
        },
        animated: true,
        transition: globalVars.transitions.slideLeft
    })
}

exports.restoreWalletClicked = function () {
    frameModule.topmost().navigate({
        moduleName: globalVars.navigation.createPassword,
        context: {
            execute: globalVars.execute.restoreWallet
        },
        animated: true,
        transition: globalVars.transitions.slideLeft
    })
}