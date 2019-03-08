const frameModule = require("tns-core-modules/ui/frame");
const dialogs = require("tns-core-modules/ui/dialogs");
const globalVars = require("../../globalVars")
const walletManager = require("../../walletManager")
var utils = require("tns-core-modules/utils/utils");
var insomnia = require("nativescript-insomnia");
const crypto = require("crypto-js")
var orientationModule = require("nativescript-screen-orientation");
const Observable = require("tns-core-modules/data/observable");
const ActivityIndicator = require("tns-core-modules/ui/activity-indicator").ActivityIndicator
const app = require("tns-core-modules/application")

var page;
var newChAdRqd = false;
var newRecAdRqd = false;
var context;

var acti; //activity indicator binding object
var indicator;

exports.pageLoaded = function (args) {

    page = args.object;
    orientationModule.setCurrentOrientation("portrait");

    context = page.navigationContext;
    page.getViewById("actionBar").title = globalVars.messageObjects.fabLightWallet
    page.getViewById("title").text = globalVars.messageObjects.enterPassword
    page.getViewById("password").hint = globalVars.messageObjects.enterPassword

    page.getViewById("nextBtn").text = globalVars.messageObjects.login
    page.getViewById("exitBtn").text = globalVars.messageObjects.exit



    acti = new Observable.fromObject({
        isLoading: false
    })
    indicator = new ActivityIndicator();
    indicator.rowSpan = "2"
    indicator.colSpan = "2"
    indicator.color = "white"


    indicator.bind({
        sourceProperty: "isLoading",
        targetProperty: "busy",
        twoWay: true
    }, acti);

    page.getViewById("myGrid").addChild(indicator)

    if (page.navigationContext) {
      
        if (context.newReceiveAddressesRequired === true) {
            newRecAdRqd = true
        }

        if (context.newChangeAddressesRequired === true) {
            newChAdRqd = true
        }
    }

    if (page.ios) {
   
        page.getViewById('password').style = "height:35;";
        page.getViewById('password').focus()
        //use this long method to hide the back link
        frameModule.topmost().ios.controller.visibleViewController.navigationItem.setHidesBackButtonAnimated(true, false);
    }
    else if (page.android) {
       
        setTimeout(function () {
            page.getViewById('password').android.requestFocus();
            var imm = utils.ad.getInputMethodManager()
            imm.showSoftInput(page.getViewById('password').android, 0);
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

exports.loginClicked = async function () {

    let userPass = page.getViewById('password').text;
    let kk = crypto.PBKDF2(userPass, walletManager.getUuid(), { keySize: 32, iterations: 1000 })
    // let isPasswordValid = walletManager.verifyUserPassword(userPass)
    let isPasswordValid = walletManager.verifyPasswordHash(kk)
    if (isPasswordValid) {
        if (newChAdRqd || newRecAdRqd) {
            await dialogs.alert({ title: globalVars.messageObjects.newAddresses, message: globalVars.messageObjects.additionalAddressesWillBeGenerated, okButtonText: globalVars.messageObjects.Ok })


            await acti.set("isLoading", true)
            await new Promise(resolve => setTimeout(resolve, 1000));

            let encMn = walletManager.getElementFromTable("Mnemonics", "mnemonic", "id", "1")
            let k = crypto.PBKDF2(userPass, walletManager.getUuid(), { keySize: 32, iterations: 1500 })


            //let mn = crypto.AES.decrypt(encMn, userPass).toString(crypto.enc.Utf8);
            let mn = crypto.AES.decrypt(encMn, k.toString()).toString(crypto.enc.Utf8);
      
            if (newRecAdRqd) {
                await walletManager.generateReceiveAddresses(mn)
            }

            if (newChAdRqd) {
                await walletManager.generateChangeAddresses(mn)
            }
            
            acti.set("isLoading", false)
        }
        frameModule.topmost().navigate({
            moduleName: globalVars.navigation.dashboard,
            animated: true,
            transition: globalVars.transitions.slideLeft
        })
    }
    else {
        dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.passwordIncorrect, okButtonText: globalVars.messageObjects.Ok })

        page.getViewById('password').text = ""

    }
}

exports.exitClicked = function () {
    walletManager.exit()
}