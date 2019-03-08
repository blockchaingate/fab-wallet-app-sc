const Observable = require("tns-core-modules/data/observable");
const frameModule = require("tns-core-modules/ui/frame");
const dialogs = require("tns-core-modules/ui/dialogs");
const ActivityIndicator = require("tns-core-modules/ui/activity-indicator").ActivityIndicator
const appSettings = require("tns-core-modules/application-settings")
const globalVars = require("../../globalVars")
const walletManager = require("../../walletManager")
const app = require("tns-core-modules/application")
const crypto = require("crypto-js")
var page;
var acti; //activity indicator binding object
var indicator;

exports.pageLoaded = function (args) {

    page = args.object;

    walletManager.setIdleTime()

    acti = new Observable.fromObject({
        isLoading: false
    })

    indicator = new ActivityIndicator();
   // indicator.rowSpan = "2"
   // indicator.colSpan = "2"
    indicator.color = "white"

    if(page.ios){
        indicator.ios.activityIndicatorViewStyle = UIActivityIndicatorViewStyle.UIActivityIndicatorViewStyleWhiteLarge;
    }
    else if(page.android){
        indicator.width = 100;
        indicator.height = 100;
    }

    indicator.bind({
        sourceProperty: "isLoading",
        targetProperty: "busy",
        twoWay: true
    }, acti);

    page.getViewById("myGrid").addChild(indicator)

    if (page.ios) {

        page.getViewById('numCnf').style = "height:35;";
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
                transition: globalVars.transitions.slideLeft
            })
        }
    }

    var context = page.navigationContext;
    page.getViewById("actionBar").title = globalVars.messageObjects.fabWalletSettings
    // page.getViewById("text1").text = globalVars.messageObjects.requirePasswordForEveryTx
    page.getViewById("text2").text = globalVars.messageObjects.minNumCnf
    page.getViewById("syncBtn").text = globalVars.messageObjects.synchronize
    page.getViewById("showMn").text = globalVars.messageObjects.showMnemonics
    page.getViewById("verifyMn").text = globalVars.messageObjects.verifyMnemonic
    page.getViewById("resetPwd").text = globalVars.messageObjects.resetPassword
    page.getViewById("delWallet").text = globalVars.messageObjects.deleteWallet
    page.getViewById("dashboard").text = globalVars.messageObjects.goToDashboard
    page.getViewById("setPin").text = globalVars.messageObjects.setPinForLogin
    page.getViewById("deletePin").text = globalVars.messageObjects.deletePin
    page.getViewById("languageBtn").text = globalVars.messageObjects.changeLanguage
    page.getViewById("faq").text = globalVars.messageObjects.faq
    //coming back from password check request

    if (!appSettings.hasKey("isPasswordRequiredForSend")) {
        appSettings.setBoolean("isPasswordRequiredForSend", true)
    }

    if (!appSettings.hasKey("confirmationCutoff")) {
        appSettings.setNumber("confirmationCutoff", 30)
    }

    page.getViewById("numCnf").text = appSettings.getNumber("confirmationCutoff")


    if (!appSettings.hasKey("confirmationCutoff")) {
        appSettings.setNumber("confirmationCutoff", 30)
    }

    var myNumField = page.getViewById("numCnf")

    myNumField.on("textChange", (args) => {

        appSettings.setNumber("confirmationCutoff", Number(args.value))
    })
};

exports.applyClicked = function () {

    var reqPasswordForSend = page.getViewById("reqPwd").checked
    var numConfirmations = Number(page.getViewById("numCnf").text)

    appSettings.setBoolean("isPasswordRequiredForSend", reqPasswordForSend)
    appSettings.setNumber("confirmationCutoff", numConfirmations)

    //set the appropriate values in the main-page
    dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.preferencesSaved, okButtonText: globalVars.messageObjects.Ok })

}

exports.reqPwdChanged = function () {

    //here if turned from true to false, ask for password

    //var reqPasswordForSend = page.getViewById("reqPwd").checked
    //appSettings.setBoolean("isPasswordRequiredForSend",reqPasswordForSend)

}

exports.faqClicked = function () {

    frameModule.topmost().navigate({
        moduleName: globalVars.navigation.faq,
        animated: true,
        transition: globalVars.transitions.slideLeft
    })

}

exports.synchronizeClicked = async function () {

    //This may not necessarily useful until synchronize workflow is established and android connection timeout is functional
    


    /*let r = await dialogs.prompt({
        title: globalVars.messageObjects.synchronize,
        message: "Kindly enter your password to complete this action.",
        okButtonText: "Confirm",
        cancelButtonText: "Cancel",
        inputType: dialogs.inputType.password
    })


    if(!r.result) return;

    if (!walletManager.verifyUserPassword(r.text)) {
        dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.passwordIncorrect, okButtonText: globalVars.messageObjects.Ok });
        return;
    }*/

    dialogs.confirm({ title: globalVars.messageObjects.synchronize, message: globalVars.messageObjects.synchronizeMessage, okButtonText: globalVars.messageObjects.Ok ,cancelButtonText:globalVars.messageObjects.cancel }).then(async function (result) {

        
        if(!result) return;
        appSettings.setBoolean(globalVars.appSettingsObjects.isSyncActive, true)
        page.getViewById("syncBtn").isUserInteractionEnabled = false;
        page.getViewById("showMn").isUserInteractionEnabled = false;
        page.getViewById("verifyMn").isUserInteractionEnabled = false;
        page.getViewById("resetPwd").isUserInteractionEnabled = false;
        page.getViewById("delWallet").isUserInteractionEnabled = false;
        page.getViewById("dashboard").isUserInteractionEnabled = false;
        page.getViewById("setPin").isUserInteractionEnabled = false;
        page.getViewById("deletePin").isUserInteractionEnabled = false;
        page.getViewById("languageBtn").isUserInteractionEnabled = false;
        page.getViewById("numCnf").isUserInteractionEnabled = false;
        page.getViewById("faq").isUserInteractionEnabled = false;


        await acti.set("isLoading", true)

        let res = await walletManager.synchronize()

        await acti.set("isLoading", false)

        if(res) dialogs.alert({ title: globalVars.messageObjects.synchronize, message: globalVars.messageObjects.synchronizeSuccessful, okButtonText: globalVars.messageObjects.Ok })


        appSettings.setBoolean(globalVars.appSettingsObjects.isSyncActive, false)

        page.getViewById("syncBtn").isUserInteractionEnabled = true;
        page.getViewById("showMn").isUserInteractionEnabled = true;
        page.getViewById("verifyMn").isUserInteractionEnabled = true;
        page.getViewById("resetPwd").isUserInteractionEnabled = true;
        page.getViewById("delWallet").isUserInteractionEnabled = true;
        page.getViewById("setPin").isUserInteractionEnabled = true;
        page.getViewById("deletePin").isUserInteractionEnabled = true;
        page.getViewById("dashboard").isUserInteractionEnabled = true;
        page.getViewById("languageBtn").isUserInteractionEnabled = true;
        page.getViewById("numCnf").isUserInteractionEnabled = true;
        page.getViewById("faq").isUserInteractionEnabled = true;

    })

}

exports.changeLanguageClicked = async function () {

    let r = await dialogs.prompt({
        title: globalVars.messageObjects.changeLanguage,
        message: globalVars.messageObjects.kindlyEnterCurrentPasswordToCompleteThisAction,
        okButtonText: globalVars.messageObjects.confirm,
        cancelButtonText: globalVars.messageObjects.cancel,
        inputType: dialogs.inputType.password
    })

    if (!r.result) return;

    if (!walletManager.verifyPasswordHash(crypto.PBKDF2(r.text, walletManager.getUuid(), { keySize: 32, iterations: 1000 }))) {

        await dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.passwordIncorrect, okButtonText: globalVars.messageObjects.Ok });

    }
    else {

        r.text = "************************"

        frameModule.topmost().navigate({
            moduleName: globalVars.navigation.chooseLanguage,
            context: {
                previousPage: globalVars.navigation.settings
            },
            animated: true,
            transition: globalVars.transitions.slideLeft
        })
    }
}

exports.showMnemonicsClicked = function () {

    frameModule.topmost().navigate({
        moduleName: globalVars.navigation.showMnemonic,
        animated: true,
        transition: globalVars.transitions.slideLeft
    })
}

exports.verifyMnemonicsClicked = async function () {

    let r = await dialogs.prompt({
        title: globalVars.messageObjects.verifyMnemonic,
        message: globalVars.messageObjects.kindlyEnterCurrentPasswordToCompleteThisAction,
        okButtonText: globalVars.messageObjects.confirm,
        cancelButtonText: globalVars.messageObjects.cancel,
        inputType: dialogs.inputType.password
    })

    if (!r.result) return;

    // if (!walletManager.verifyUserPassword(r.text)) {
    if (!walletManager.verifyPasswordHash(crypto.PBKDF2(r.text, walletManager.getUuid(), { keySize: 32, iterations: 1000 }))) {

        await dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.passwordIncorrect, okButtonText: globalVars.messageObjects.Ok });

    }
    else {

        let encMn = walletManager.getElementFromTable("Mnemonics", "mnemonic", "id", "1")
        let k = crypto.PBKDF2(r.text, walletManager.getUuid(), { keySize: 32, iterations: 1500 })
        let mn = crypto.AES.decrypt(encMn, k.toString()).toString(crypto.enc.Utf8);
        r.text = "************************"

        frameModule.topmost().navigate({
            moduleName: globalVars.navigation.verifyMnemonic,
            context: {
                previousPage: globalVars.navigation.settings,
                myMn : mn
            },
            animated: true,
            transition: globalVars.transitions.slideLeft
        })
        mn="***************************************************************************************"

    }

}

exports.deletePinClicked = async function () {

    let r = await dialogs.prompt({
        title: globalVars.messageObjects.deletePin,
        message: globalVars.messageObjects.kindlyEnterPasswordToCompleteThisAction,
        okButtonText: globalVars.messageObjects.confirm,
        cancelButtonText: globalVars.messageObjects.cancel,
        inputType: dialogs.inputType.password
    })

    if (!r.result) return;

    //if (!walletManager.verifyUserPassword(r.text)) {

    if (!walletManager.verifyPasswordHash(crypto.PBKDF2(r.text, walletManager.getUuid(), { keySize: 32, iterations: 1000 }))) {

        await dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.passwordIncorrect, okButtonText: globalVars.messageObjects.Ok });

    }
    else {

        walletManager.deletePin()
        r.text = "************************"
        await dialogs.alert({ title: globalVars.messageObjects.pinDeleted, message: globalVars.messageObjects.pinDeletedSuccessfully, okButtonText: globalVars.messageObjects.Ok });
    }

}

exports.deleteWalletClicked = async function () {


    let r = await dialogs.prompt({
        title: globalVars.messageObjects.deleteWallet,
        message: globalVars.messageObjects.deleteWalletSure + "\n" + globalVars.messageObjects.kindlyEnterPasswordToCompleteThisAction,
        okButtonText: globalVars.messageObjects.confirm,
        cancelButtonText: globalVars.messageObjects.cancel,
        inputType: dialogs.inputType.password
    })

    if (!r.result) return;

    //if (!walletManager.verifyUserPassword(r.text)) {
    if (!walletManager.verifyPasswordHash(crypto.PBKDF2(r.text, walletManager.getUuid(), { keySize: 32, iterations: 1000 }))) {

        await dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.passwordIncorrect, okButtonText: globalVars.messageObjects.Ok });

    }
    else {

        walletManager.deleteWallet()
        r.text = "************************"

        await dialogs.alert({ title: globalVars.messageObjects.walletDeleted, message: globalVars.messageObjects.walletDeletedSuccessfully, okButtonText: globalVars.messageObjects.Ok });
        walletManager.exit()
    }
}

exports.resetPasswordClicked = async function () {


    let r = await dialogs.prompt({
        title: globalVars.messageObjects.resetPassword,
        message: globalVars.messageObjects.kindlyEnterCurrentPasswordToCompleteThisAction,
        okButtonText: globalVars.messageObjects.confirm,
        cancelButtonText: globalVars.messageObjects.cancel,
        inputType: dialogs.inputType.password
    })

    if (!r.result) return;

    // if (!walletManager.verifyUserPassword(r.text)) {

    if (!walletManager.verifyPasswordHash(crypto.PBKDF2(r.text, walletManager.getUuid(), { keySize: 32, iterations: 1000 }))) {

        await dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.passwordIncorrect, okButtonText: globalVars.messageObjects.Ok });

    }
    else {

        frameModule.topmost().navigate({
            moduleName: globalVars.navigation.createPassword,
            context: {
                info: r.text,
                previousPage: globalVars.navigation.settings,
                execute: globalVars.execute.resetPassword
            },
            animated: true,
            transition: globalVars.transitions.slideLeft
        })

        r.text = "************************"

    }
}

exports.setPinClicked = async function () {


    let r = await dialogs.prompt({
        title: globalVars.messageObjects.setPin,
        message: globalVars.messageObjects.kindlyEnterCurrentPasswordToCompleteThisAction,
        okButtonText: globalVars.messageObjects.confirm,
        cancelButtonText: globalVars.messageObjects.cancel,
        inputType: dialogs.inputType.password
    })

    if (!r.result) return;

    //if (!walletManager.verifyUserPassword(r.text)) {

    if (!walletManager.verifyPasswordHash(crypto.PBKDF2(r.text, walletManager.getUuid(), { keySize: 32, iterations: 1000 }))) {

        await dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.passwordIncorrect, okButtonText: globalVars.messageObjects.Ok });

    }
    else {

        frameModule.topmost().navigate({
            moduleName: globalVars.navigation.setPin,
            animated: true,
            transition: globalVars.transitions.slideLeft
        })

        r.text = "************************"
    }
}

exports.goToDashboardClicked = function () {
    // frameModule.topmost().navigate(globalVars.navigation.dashboard)
    frameModule.topmost().navigate({
        moduleName: globalVars.navigation.dashboard,
        animated: true,
        transition: globalVars.transitions.slideLeft
    })
}

