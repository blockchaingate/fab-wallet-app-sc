const frameModule = require("tns-core-modules/ui/frame");
const dialogs = require("tns-core-modules/ui/dialogs");
const globalVars = require("../../globalVars")
const bip39 = require("bip39")
const crypto = require("crypto-js")
const dataManager = require("../../dataManager")
const sqlite = require("nativescript-sqlite")
var utils = require("tns-core-modules/utils/utils");
const walletManager = require("../../walletManager")
const Observable = require("tns-core-modules/data/observable");
const ActivityIndicator = require("tns-core-modules/ui/activity-indicator").ActivityIndicator
var insomnia = require("nativescript-insomnia");
const app = require("tns-core-modules/application")

var page;
var context;
var password; // password from the context
var cPassword; //current PAssword 
var resetPasswordRequested = false;
var newWallet = false;
var restoreWallet = false;

var acti; //activity indicator binding object
var indicator;

exports.pageLoaded = function (args) {

    page = args.object;
    let passField = page.getViewById("password");


    if (page.ios) {

        page.getViewById("password").style = "height:35;"
        //use this long method to hide the back link
        frameModule.topmost().ios.controller.visibleViewController.navigationItem.setHidesBackButtonAnimated(true, false);
        passField.focus();
    }
    else if (page.android) {
        //do android specific stuff here
        setTimeout(function () {

            passField.android.requestFocus();
            var imm = utils.ad.getInputMethodManager()
            imm.showSoftInput(passField.android, 0);
        }, 300)

        let activity = app.android.startActivity ||
            app.android.foregroundActivity ||
            frameModule.topmost().android.currentActivity ||
            frameModule.topmost().android.activity

        //This is how android back button can be overriden
        activity.onBackPressed = function () {
            frameModule.topmost().navigate({
                moduleName: globalVars.navigation.createPassword,
                animated: true,
                transition: globalVars.transitions.slideRight
            })
        }
    }

    context = page.navigationContext;
    password = context.info;


    page.getViewById("actionBar").title = globalVars.messageObjects.fabcoinWallet
    page.getViewById("title").text = globalVars.messageObjects.verifyYourPassword
    page.getViewById("password").hint = globalVars.messageObjects.enterPassword
    page.getViewById("nextBtn").text = globalVars.messageObjects.next

    if (context.execute) {
        resetPasswordRequested = (context.execute === globalVars.execute.resetPassword)
        newWallet = (context.execute === globalVars.execute.newWallet)
        restoreWallet = (context.execute === globalVars.execute.restoreWallet)
    }

    acti = new Observable.fromObject({
        isLoading: false
    })

    indicator = new ActivityIndicator();
    //indicator.rowSpan = "2"
    //indicator.colSpan = "2"
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

    page.getViewById("myStack").addChild(indicator)

    insomnia.keepAwake();

};


//this function can be executed on both next clicked or return pressed.
//TODO : check if next button is required

exports.test = async function () {

    cPassword = page.getViewById('password').text;

    if (cPassword === password) {
        page.getViewById("nextBtn").disabled = true
        if (resetPasswordRequested) {
            //TODO change the password hash and decrypt and reencrypt the mnemonics
            var hash = new crypto.PBKDF2(password, walletManager.getUuid(), { keySize: 32, iterations: 1000 })

            await new sqlite(globalVars.databaseObjects.name, function (err, db) {
                db.execSQL("UPDATE Pass SET pass = ? WHERE id = 1", [hash], function (err, id) {
                    ;
                })
            })

            let prevPd = page.navigationContext.previousPassword;
            let encMn = walletManager.getElementFromTable("Mnemonics", "mnemonic", "id", "1")
            let k = crypto.PBKDF2(prevPd, walletManager.getUuid(), { keySize: 32, iterations: 1500 })

            //let mn = crypto.AES.decrypt(encMn, prevPd).toString(crypto.enc.Utf8);
            let mn = crypto.AES.decrypt(encMn, k.toString()).toString(crypto.enc.Utf8);
            await walletManager.saveMnemonics(mn, password)

            mn = "****************************************"
            password = "**************************************"
            cPassword = "**************************************"
            prevPd = "*********************************"
            page.navigationContext.previousPassword = "*************************"

            dialogs.alert({ title: globalVars.messageObjects.resetPassword, message: globalVars.messageObjects.yourPasswordResetSuccessfully, okButtonText: globalVars.messageObjects.Ok }).then(res => {
                // frameModule.topmost().navigate(globalVars.navigation.dashboard)
                frameModule.topmost().navigate({
                    moduleName: globalVars.navigation.settings,
                    animated: true,
                    transition: globalVars.transitions.slideRight
                })
            })
        }
        else {

            if (newWallet) {
                let p = await dialogs.alert({ title: globalVars.messageObjects.passwordVerified, message: globalVars.messageObjects.passwordVerifyMessage, okButtonText: globalVars.messageObjects.Ok }).then(res => { return res })
            }

            walletManager.setUuid();
            dataManager.createPasswordTable();

            // save the hash of the password  here using uuid as a salt
            // var hash = new crypto.PBKDF2(password, 'fabcoin', { keySize: 32, iterations: 1000 })
            var hash = new crypto.PBKDF2(password, walletManager.getUuid(), { keySize: 32, iterations: 1000 })

            new sqlite(globalVars.databaseObjects.name, function (err, db) {
                db.execSQL("INSERT INTO Pass (pass) VALUES (?)", [hash], function (err, id) {

                })
            })

            dataManager.createAddressIndexTable();
            dataManager.createUtxoTable();
            dataManager.createSpentBufferTable();
            dataManager.createTxHistoryTable();
            dataManager.createReceiveAddressTable();
            dataManager.createChangeAddressTable();
            //This may change later on 
            dataManager.createMyTokenTable();



            //save password hash in database
            //create utxo, spentBuffer, addressindex, txhistory tables

            if (newWallet) {
                //generate mnemonic, create encmn, changeAdderss, receiveAddress tables and put all the data into it

               page.getViewById("info").text = globalVars.messageObjects.generatingNewAddresses

               acti.set("isLoading", true)
                await new Promise(resolve => setTimeout(resolve, 1000));

                let mn = bip39.generateMnemonic()
                await walletManager.saveMnemonics(mn, password)

              
                walletManager.generateChangeAddresses(mn)
                walletManager.generateChangeAddresses(mn)
                walletManager.generateReceiveAddresses(mn)
                walletManager.generateReceiveAddresses(mn)
    

                await acti.set("isLoading", false)

                seed = ""
                masterNode = ""
                changeNode = ""
                receiveNode = ""
                hash = ""

                //navigate to show mnemonics - send it via context and then delete context
                frameModule.topmost().navigate({
                    moduleName: globalVars.navigation.showMnemonic,
                    context: {
                        info: mn
                    },
                    animated: true,
                    transition: globalVars.transitions.slideLeft
                })

                mn = "********************************"

            }
            else if (restoreWallet) {
                //go to enter mnemonics page and then create encmn, changeAdderss, receiveAddress tables and put all the data into it

                frameModule.topmost().navigate({
                    moduleName: globalVars.navigation.enterMnemonic,
                    context: {
                        info: password
                    },
                    animated: true,
                    transition: globalVars.transitions.slideLeft
                })
            }
        }
    }
    else {
        dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.passwordsNoMatchCreateNew, okButtonText: globalVars.messageObjects.Ok }).then(function () {
            frameModule.topmost().navigate({
                moduleName: globalVars.navigation.createPassword,
                animated: true,
                transition: globalVars.transitions.slideRight
            })
        })
    }


    //disable next key
    //save password hash
    //create all the necessary tables
    //create mnemonics and save

    //after all the operations are completed, overwrite the both the passwords
    password = "*****************************"
    cPassword = "*******************************"

}