const frameModule = require("tns-core-modules/ui/frame");
const dialogs = require("tns-core-modules/ui/dialogs");
const globalVars = require("../../globalVars")
const walletManager = require("../../walletManager");
var insomnia = require("nativescript-insomnia");
var orientationModule = require("nativescript-screen-orientation");
const app = require("tns-core-modules/application")

var page;

exports.pageLoaded = function (args) {


    page = args.object;
    orientationModule.setCurrentOrientation("portrait");

    //console.log(page.navigationContext.mn)

    page.getViewById("actionBar").title = globalVars.messageObjects.fabLightWallet
    page.getViewById("title").text =globalVars.messageObjects.verifyMnemonic
    page.getViewById("text1").text = globalVars.messageObjects.enterMnemonicToVerify
    page.getViewById("nextBtn").text = globalVars.messageObjects.next


    if (page.ios) {

        page.getViewById('mw1').style = "height:35;";
        page.getViewById('mw2').style = "height:35;";
        page.getViewById('mw3').style = "height:35;";
        page.getViewById('mw4').style = "height:35;";
        page.getViewById('mw5').style = "height:35;";
        page.getViewById('mw6').style = "height:35;";
        page.getViewById('mw7').style = "height:35;";
        page.getViewById('mw8').style = "height:35;";
        page.getViewById('mw9').style = "height:35;";
        page.getViewById('mw10').style = "height:35;";
        page.getViewById('mw11').style = "height:35;";
        page.getViewById('mw12').style = "height:35;";

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

            dialogs.confirm({ title: globalVars.messageObjects.exit, message: globalVars.messageObjects.exitSure, okButtonText: globalVars.messageObjects.yes, cancelButtonText: globalVars.messageObjects.no }).then((res) => {


                if (res) {
                    walletManager.exit();
                }
            })
        }
    }

    insomnia.keepAwake();
};

exports.nextClicked = function () {

    let w1 = sanitize(page.getViewById("mw1").text)
    let w2 = sanitize(page.getViewById("mw2").text)
    let w3 = sanitize(page.getViewById("mw3").text)
    let w4 = sanitize(page.getViewById("mw4").text)
    let w5 = sanitize(page.getViewById("mw5").text)
    let w6 = sanitize(page.getViewById("mw6").text)
    let w7 = sanitize(page.getViewById("mw7").text)
    let w8 = sanitize(page.getViewById("mw8").text)
    let w9 = sanitize(page.getViewById("mw9").text)
    let w10 = sanitize(page.getViewById("mw10").text)
    let w11 = sanitize(page.getViewById("mw11").text)
    let w12 = sanitize(page.getViewById("mw12").text)

    var mnemonic = w1 + " " + w2 + " " + w3 + " " + w4 + " " + w5 + " " + w6 + " " + w7 + " " + w8 + " " + w9 + " " + w10 + " " + w11 + " " + w12

    //here, check if the mnemonics are correct.
    if (page.navigationContext.mn) {
        if (mnemonic === page.navigationContext.mn) {

            mnemonic = "**********************************************"
            page.navigationContext.mn = "********************************************"
            dialogs.alert({ title: globalVars.messageObjects.success, message: globalVars.messageObjects.allWordsVerified, okButtonText: globalVars.messageObjects.Ok }).then(res => {
                frameModule.topmost().navigate({
                    moduleName: globalVars.navigation.dashboard,
                    animated: true,
                    transition: globalVars.transitions.slideLeft
                })
            })
        }
        else {
            dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.wrongMnemonicErrorInitialSetup, okButtonText: globalVars.messageObjects.Ok }).then(res => {

                mnemonic = "**********************************************"
                frameModule.topmost().navigate({
                    moduleName: globalVars.navigation.showMnemonic,
                    context: {
                        info: page.navigationContext.mn,
                        previousPage : globalVars.navigation.verifyMnemonic
                    },
                    animated: true,
                    transition: globalVars.transitions.slideRight
                })
            })
        }
    }
    else if (page.navigationContext.previousPage) {

        if (page.navigationContext.previousPage === globalVars.navigation.settings) {
            if (mnemonic === page.navigationContext.myMn) {

                mnemonic = "**********************************************"
                page.navigationContext.myMn="******************************************"
                dialogs.alert({ title: globalVars.messageObjects.success, message: globalVars.messageObjects.allWordsVerified, okButtonText: globalVars.messageObjects.Ok }).then(res => {
                    frameModule.topmost().navigate({
                        moduleName: globalVars.navigation.settings,
                        animated: true,
                        transition: globalVars.transitions.slideRight
                    })
                })
            }
            else {
                dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.wrongMnemonicError, okButtonText: globalVars.messageObjects.Ok }).then(res => {
    
                    mnemonic = "**********************************************"
                    page.navigationContext.myMn="******************************************"

                    frameModule.topmost().navigate({
                        moduleName: globalVars.navigation.settings,
                        animated: true,
                        transition: globalVars.transitions.slideRight
                    })
                })
            }
        }
    }

    return;
}

function sanitize(word) {

    //convert to lowercase from upper case if any
    //remove any unwated space and/or characters
    let p = String(word).toLowerCase();
    p.replace(/\s+/g, '')
    let q = "";

    for (let i = 0; i < p.length; i++) {
        if (p[i].match(/[a-z]/i)) {
            q += p[i]
        }
    }

    return q
}
