const frameModule = require("tns-core-modules/ui/frame");
const dialogs = require("tns-core-modules/ui/dialogs");
const globalVars = require("../../globalVars")
const walletManager = require("../../walletManager")
var utils = require("tns-core-modules/utils/utils");
const dataManager = require("../../dataManager")
const sqlite = require("nativescript-sqlite")
const crypto = require("crypto-js")
const app = require("tns-core-modules/application")

var page;

exports.pageLoaded = function (args) {

    page = args.object;
    let pinField = page.getViewById("pin")

    if (page.ios) {

        page.getViewById("pin").style = "height:35;"
        //use this long method to hide the back link
        frameModule.topmost().ios.controller.visibleViewController.navigationItem.setHidesBackButtonAnimated(true, false);
        pinField.focus();
    }
    else if (page.android) {
        //do android specific stuff here
        setTimeout(function () {
            pinField.android.requestFocus();
            var imm = utils.ad.getInputMethodManager()
            imm.showSoftInput(pinField.android, 0);
        }, 300)

        let activity = app.android.startActivity ||
            app.android.foregroundActivity ||
            frameModule.topmost().android.currentActivity ||
            frameModule.topmost().android.activity

        //This is how android back button can be overriden
        activity.onBackPressed = function () {
            frameModule.topmost().navigate({
                moduleName: globalVars.navigation.settings,
                animated: true,
                transition: globalVars.transitions.slideRight
            })
        }
    }

    page.getViewById("actionBar").title = globalVars.messageObjects.fabcoinWallet
    page.getViewById("title").text = globalVars.messageObjects.createPinTitle
    page.getViewById("pin").hint = globalVars.messageObjects.createPin
    page.getViewById("nextBtn").text = globalVars.messageObjects.next

    let psInput = page.getViewById('pin')
    psInput.on("textChange", test);
};


var test = function () {
    let s = String(page.getViewById("pin").text)
    if (s.length < 4) return false
    else return true
}


exports.nextClicked = async function () {

    let s = String(page.getViewById("pin").text)
    if (!test()) {
        dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.pinAtLeast4Digits, okButtonText: globalVars.messageObjects.Ok })
    }
    else {
        //pin is set
        //save pin to database

        if (dataManager.tableExists(globalVars.databaseObjects.PinTable.name)) {
            dataManager.dropTable(globalVars.databaseObjects.PinTable.name)
        }

        new sqlite(globalVars.databaseObjects.name, function (err, db) {
            db.execSQL("CREATE TABLE Pin (id INTEGER PRIMARY KEY, pin TEXT)", [], function (err) {

                let h = new crypto.PBKDF2(s, walletManager.getUuid(), { keySize: 32, iterations: 500 }) //encrypted Mnemonic

                db.execSQL("INSERT INTO Pin (pin) VALUES (?)", [h], function (err, id) {
                
                    h = "*********************************************"
                    s = "*************************************"
                })
            })
        })

        await dialogs.alert(
            { title: globalVars.messageObjects.loginPinSet, message: globalVars.messageObjects.pinSetSuccessfully, okButtonText: globalVars.messageObjects.Ok })

        frameModule.topmost().navigate({
            moduleName: globalVars.navigation.settings,
            animated: true,
            transition: globalVars.transitions.slideRight
        })
    }
}