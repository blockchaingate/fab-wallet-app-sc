const crypto = require('crypto-js');
const frameModule = require("tns-core-modules/ui/frame");
const dialogs = require("tns-core-modules/ui/dialogs");
const globalVars = require("../../globalVars")
const walletManager = require("../../walletManager")
var insomnia = require("nativescript-insomnia");
const app = require("tns-core-modules/application")

var page;
var mn;

exports.pageLoaded = async function (args) {

    page = args.object;
    walletManager.setIdleTime()

    
    if(page.navigationContext){

        if(page.navigationContext.info[0] === '*'){
            page.navigationContext.info = page.getViewById("mnemonics").text 
        }
    }

    if (page.ios) {
        //use this long method to hide the back link
        frameModule.topmost().ios.controller.visibleViewController.navigationItem.setHidesBackButtonAnimated(true, false);


    }
    else if (page.android) {
        //do android specific stuff here
        //handle back key
        let activity = app.android.startActivity ||
            app.android.foregroundActivity ||
            frameModule.topmost().android.currentActivity ||
            frameModule.topmost().android.activity

        //This is how android back button can be overriden
        activity.onBackPressed = function () {


            if (page.navigationContext) {

                if (page.navigationContext.previousPage && page.navigationContext.previousPage === globalVars.navigation.verifyMnemonic) {
                    dialogs.confirm({ title: globalVars.messageObjects.exit, message: globalVars.messageObjects.exitSure, okButtonText: globalVars.messageObjects.yes, cancelButtonText: globalVars.messageObjects.no }).then((res) => {

                        if (res) {
                            walletManager.exit();
                        }
                        return;
                    })
                }
                else if (page.navigationContext.info) {
                    dialogs.confirm({ title: globalVars.messageObjects.exit, message: globalVars.messageObjects.exitSure, okButtonText: globalVars.messageObjects.yes, cancelButtonText: globalVars.messageObjects.no }).then((res) => {

                        if (res) {
                            walletManager.exit();
                        }
                        return;
                    })
                }
            }
            else {
                frameModule.topmost().navigate({
                    moduleName: globalVars.navigation.settings,
                    animated: true,
                    transition: globalVars.transitions.slideRight
                })
            }
        }
    }

    page.getViewById("actionBar").title = globalVars.messageObjects.fabLightWallet
    page.getViewById("title").text = globalVars.messageObjects.mnemonicWords
    page.getViewById("text1").text = globalVars.messageObjects.kindlySaveMnemonic
    page.getViewById("backBtn").text = globalVars.messageObjects.back

    //if coming from new wallet, show mnemonics, else ask for password

    //if coming from new wallet
    if (page.navigationContext) {
        if (page.navigationContext.info) {
            page.getViewById("mnemonics").text = page.navigationContext.info
            mn = page.navigationContext.info
            page.navigationContext.info = "******************************************"
            page.getViewById("backBtn").text = globalVars.messageObjects.next
            let s = mn.split(' ')
            mn = "**********************************************"

            page.getViewById("m1").text = "1.  " + s[0]
            page.getViewById("m2").text = "2.  " + s[1]
            page.getViewById("m3").text = "3.  " + s[2]
            page.getViewById("m4").text = "4.  " + s[3]
            page.getViewById("m5").text = "5.  " + s[4]
            page.getViewById("m6").text = "6.  " + s[5]
            page.getViewById("m7").text = "7.  " + s[6]
            page.getViewById("m8").text = "8.  " + s[7]
            page.getViewById("m9").text = "9.  " + s[8]
            page.getViewById("m10").text = "10.  " + s[9]
            page.getViewById("m11").text = "11.  " + s[10]
            page.getViewById("m12").text = "12.  " + s[11]

            s = "*************************************************"

        }
    }
    else { //if user wants to see the mnemonics, ask for password

        let r = await dialogs.prompt({
            title: globalVars.messageObjects.showMnemonics,
            message: globalVars.messageObjects.kindlyEnterPasswordToCompleteThisAction,
            okButtonText: globalVars.messageObjects.confirm,
            cancelButtonText: globalVars.messageObjects.cancel,
            inputType: dialogs.inputType.password
        })

        if (r.result === false) {

            frameModule.topmost().navigate({
                moduleName: globalVars.navigation.settings,
                animated: true,
                transition: globalVars.transitions.slideRight
            })
            return
        }

        //if (!walletManager.verifyUserPassword(r.text)) {

        if (!walletManager.verifyPasswordHash(crypto.PBKDF2(r.text, walletManager.getUuid(), { keySize: 32, iterations: 1000 }))) {

            await dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.passwordIncorrect, okButtonText: globalVars.messageObjects.Ok });

            frameModule.topmost().navigate({
                moduleName: globalVars.navigation.settings,
                animated: true,
                transition: globalVars.transitions.slideRight
            })
            return
        }

        let encMn = walletManager.getElementFromTable("Mnemonics", "mnemonic", "id", "1")
        let k = crypto.PBKDF2(r.text, walletManager.getUuid(), { keySize: 32, iterations: 1500 })

        //let mn = crypto.AES.decrypt(encMn, r.text).toString(crypto.enc.Utf8);
        mn = crypto.AES.decrypt(encMn, k.toString()).toString(crypto.enc.Utf8);
        page.getViewById("mnemonics").text = mn
        let s = mn.split(' ')

        page.getViewById("m1").text = "1.  " + s[0]
        page.getViewById("m2").text = "2.  " + s[1]
        page.getViewById("m3").text = "3.  " + s[2]
        page.getViewById("m4").text = "4.  " + s[3]
        page.getViewById("m5").text = "5.  " + s[4]
        page.getViewById("m6").text = "6.  " + s[5]
        page.getViewById("m7").text = "7.  " + s[6]
        page.getViewById("m8").text = "8.  " + s[7]
        page.getViewById("m9").text = "9.  " + s[8]
        page.getViewById("m10").text = "10.  " + s[9]
        page.getViewById("m11").text = "11.  " + s[10]
        page.getViewById("m12").text = "12.  " + s[11]

        r.text = "**********************"
        mn = "*************************"
    }

    insomnia.keepAwake();
};


exports.backClicked = function () {


    if (page.navigationContext) {


        if (page.navigationContext.info) {


            frameModule.topmost().navigate({
                //go to verify Mnemonics first and then go to dashboard,
                //TODO handle the situation where the page id directed to from different pages


                //moduleName: globalVars.navigation.dashboard,
                moduleName: globalVars.navigation.verifyMnemonic,
                context: {
                    mn: page.getViewById("mnemonics").text
                },
                animated: true,
                transition: globalVars.transitions.slideLeft
            })
        }

    }
    else {
        page.getViewById("mnemonics").text = "*******************************************"
        frameModule.topmost().navigate({
            moduleName: globalVars.navigation.settings,
            animated: true,
            transition: globalVars.transitions.slideRight
        })
    }
}
