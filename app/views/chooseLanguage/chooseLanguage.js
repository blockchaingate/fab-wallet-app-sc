const frameModule = require("tns-core-modules/ui/frame");
const appSettings = require("tns-core-modules/application-settings")
const globalVars = require("../../globalVars")
var insomnia = require("nativescript-insomnia");
var orientationModule = require("nativescript-screen-orientation");
const app = require("tns-core-modules/application")
const walletManager = require("../../walletManager")
const dialogs = require("tns-core-modules/ui/dialogs");

var page;
var currentLanguage;
var context;

exports.pageLoaded = function (args) {
    page = args.object;

    orientationModule.setCurrentOrientation("portrait");

    
    if (page.navigationContext) {

        context = page.navigationContext
    }
    else {
        context = null

        //default language is english

        if (!appSettings.hasKey("language"))
            setCurrentLanguage(globalVars.langList.english)
    }


    if (page.ios) {
        //use this long method to hide the back link
        frameModule.topmost().ios.controller.visibleViewController.navigationItem.setHidesBackButtonAnimated(true, false);
    }
    else if (page.android) {
        //do android specific stuff here
        //handle back button events
        let activity = app.android.startActivity ||
            app.android.foregroundActivity ||
            frameModule.topmost().android.currentActivity ||
            frameModule.topmost().android.activity

        //This is how android back button can be overriden
        activity.onBackPressed = function () {

            if (!context) {
                dialogs.confirm({ title: globalVars.messageObjects.exit, message: globalVars.messageObjects.exitSure, okButtonText: globalVars.messageObjects.yes, cancelButtonText: globalVars.messageObjects.no }).then((res) => {

                    if (res) {
                        walletManager.exit();
                    }
                })
            }
            else {

                frameModule.topmost().navigate({
                    moduleName: context.previousPage,
                    animated: true,
                    transition: globalVars.transitions.slideRight
                })

            }
        }
    }



    if (appSettings.hasKey("language")) {
        setCurrentLanguage(appSettings.getString("language"))
    }
    else {
        setCurrentLanguage(globalVars.langList.english)
    }

    insomnia.keepAwake();
}

exports.engBtnClicked = function () {
    setCurrentLanguage(globalVars.langList.english)
}

exports.cnBtnClicked = function () {
    setCurrentLanguage(globalVars.langList.chinese)
}

exports.nextClicked = function () {

    //here, handle the change language from settings page
    if (context) {
        frameModule.topmost().navigate({
            moduleName: context.previousPage,
            animated: true,
            transition: globalVars.transitions.slideRight
        })
    }
    else { //no context - first time use
        frameModule.topmost().navigate({
            moduleName: globalVars.navigation.termsAndConditions, //go to terms and conditions page. user must agree to terms and conditions to proceed further
            animated: true,
            transition: globalVars.transitions.slideLeft
        })
    }
}

var setCurrentLanguage = function (lang) {

    currentLanguage = lang;
    appSettings.setString("language", lang)
    globalVars.setCurrentLanguage(lang)

  //  page.getViewById("engBtn").color = "gray";
  //  page.getViewById("cnBtn").color = "gray";

  page.getViewById("engBtn").class = "chooseLangBtn btn-outline disabled";
  page.getViewById("cnBtn").class = "chooseLangBtn btn-outline disabled";

    page.getViewById("nextBtn").text = globalVars.messageObjects.next
    page.getViewById("title").text = globalVars.messageObjects.selectPrefferedLanguage
    page.getViewById("actionBarTitle").title = globalVars.messageObjects.fabLightWallet

    if (lang === globalVars.langList.chinese) {
       // page.getViewById("cnBtn").color = "white";
       page.getViewById("cnBtn").class = "chooseLangBtn btn-outline";
    }
    else if (lang === globalVars.langList.english) {
      //  page.getViewById("engBtn").color = "white";
      page.getViewById("engBtn").class = "chooseLangBtn btn-outline";
    }
}

//this may be required for settings
var setCurrentLanguageEx = function (lang) { //external request
    currentLanguage = lang
    globalVars.setCurrentLanguage(lang)
    // /globalVars.currentLanguage = lang

}

var getCurrentLanguage = function () {
    return currentLanguage;
}

exports.setCurrentLanguage = setCurrentLanguage;
exports.getCurrentLanguage = getCurrentLanguage;
exports.setCurrentLanguageEx = setCurrentLanguageEx;

