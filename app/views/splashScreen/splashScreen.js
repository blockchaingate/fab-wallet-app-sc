
//This is very important - do not remove it from here. If removed, the application crashes
//---------------------------------------------------------------//
const nodeify = require("nativescript-nodeify");                 //
//---------------------------------------------------------------//
const frameModule = require("tns-core-modules/ui/frame");
const appSettings = require("tns-core-modules/application-settings")
const navigation = require("../../globalVars").navigation;
const chooseLanguage = require("../chooseLanguage/chooseLanguage");
const globalVars = require("../../globalVars")
const commonFunctions = require("../../commonFuncs")
const dataManager = require("../../dataManager")
const walletManager = require("../../walletManager")
var orientationModule = require("nativescript-screen-orientation");

const app = require("tns-core-modules/application")


exports.pageLoaded = async function (args) {
    page = args.object;

    orientationModule.setCurrentOrientation("portrait");
    //for testing purposes only. 
    //remove it after testing is completed
    //dataManager.dropAllTables()



    if (page.ios) {
        frameModule.topmost().ios.controller.visibleViewController.navigationItem.setHidesBackButtonAnimated(true, false);
    }
    else if (page.android) {
        //do android specific stuff here
        //handle the back key event
        let activity = app.android.startActivity ||
            app.android.foregroundActivity ||
            frameModule.topmost().android.currentActivity ||
            frameModule.topmost().android.activity

        //This is how android back button can be overriden
        activity.onBackPressed = function () {
            return;
        }
    }

    if (appSettings.hasKey("language")) {
        chooseLanguage.setCurrentLanguageEx(appSettings.getString("language"))
    }

    //testing purposes only
    // frameModule.topmost().navigate(globalVars.navigation.termsAndConditions)
    // return

    if (isReturningUser()) {

        let newRecRequired = await walletManager.areNewReceiveAddressesRequired();
        let newChRequired = await walletManager.areNewChangeAddressesRequired();

        if (newRecRequired || newChRequired) {

            frameModule.topmost().navigate({
                moduleName: globalVars.navigation.enterPassword,
                context: {
                    newReceiveAddressesRequired: newRecRequired,
                    newChangeAddressesRequired: newChRequired
                },
                animated: true,
                transition: globalVars.transitions.slideLeft
            })
        }
        else {

            if (commonFunctions.tableExists(globalVars.databaseObjects.pinTable.name)) {
                frameModule.topmost().navigate(navigation.enterPin)
            }
            else {
                frameModule.topmost().navigate(navigation.enterPassword)
            }
        }

        dataManager.updateTxHistoryTable()

        if (!dataManager.tableExists(globalVars.databaseObjects.myTokensTable.name)) {
            //the token and token history tables may not be present in the older version of the applications.
            dataManager.createMyTokenTable();
        }

        if (!dataManager.tableExists(globalVars.databaseObjects.tokenHistoryTable.name)) {
            //the token and token history tables may not be present in the older version of the applications.
            dataManager.createMyTokenTable();
        }

        //testing purposes only
        //dataManager.dropTable(globalVars.databaseObjects.myTokensTable.name);
        //dataManager.dropTable(globalVars.databaseObjects.tokenHistoryTable.name);
        dataManager.createTokenHistoryTable();
        dataManager.showTable(globalVars.databaseObjects.tokenHistoryTable.name)
        // console.log(1)
    }
    else {
        frameModule.topmost().navigate(navigation.chooseLanguage)
    }
}

var isReturningUser = function () {

    let returningUser = false;
    if (commonFunctions.tableExists(globalVars.databaseObjects.passwordTable.name) && commonFunctions.tableExists(globalVars.databaseObjects.MnemonicTable.name)) {
        returningUser = true;
    }
    return returningUser
}
