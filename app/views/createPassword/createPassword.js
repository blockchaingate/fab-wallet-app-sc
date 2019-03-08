const frameModule = require("tns-core-modules/ui/frame");
const dialogs = require("tns-core-modules/ui/dialogs");
const globalVars = require("../../globalVars")
var utils = require("tns-core-modules/utils/utils");
var insomnia = require("nativescript-insomnia");
var orientationModule = require("nativescript-screen-orientation");
const app = require("tns-core-modules/application")

var psInput;
var page;

var password;
var minimumLength = globalVars.minimumPasswordLength;
var containsNoSpace = false;
var containsNumber = false;
var containsSpecialChar = false;
var validPassword = false;
var context;
var resetPasswordRequest = false;
var newWallet = false;
var restoreWallet = false;


exports.pageLoaded = function (args) {

    page = args.object;
    orientationModule.setCurrentOrientation("portrait");
    //TODO handle back button event for android and automatic back link for ios 

    if (args.object.navigationContext) {
        context = args.object.navigationContext;
        resetPasswordRequest = (context.execute === globalVars.execute.resetPassword)
        newWallet = (context.execute === globalVars.execute.newWallet)
        restoreWallet = (context.execute === globalVars.execute.restoreWallet)
    }

    if (page.ios) {

        page.getViewById('password').style = "height:35;";
        page.getViewById('password').focus()
        //use this long method to hide the back link
        frameModule.topmost().ios.controller.visibleViewController.navigationItem.setHidesBackButtonAnimated(true, false);
    }
    else if (page.android) {
        //do android specific stuff here
        //show keyboard 
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

            //set context specific navigation
            if (resetPasswordRequest) {

                //overwrite the password 
                page.navigationContext.info = "************"
                
                frameModule.topmost().navigate({
                    moduleName: globalVars.navigation.settings,
                    animated: true,
                    transition: globalVars.transitions.slideRight
                })
            }
            else { //first time use
                frameModule.topmost().navigate({
                    moduleName: globalVars.navigation.welcomePage,
                    animated: true,
                    transition: globalVars.transitions.slideRight
                })
            }
        }
    }

    page.getViewById('nextBtn').disabled = true;
    page.getViewById('nextBtn').class = 'btn btn-outline btn-rounded-lg disabled';


    page.getViewById("actionBar").title = globalVars.messageObjects.fabLightWallet
    page.getViewById("title").text = globalVars.messageObjects.createASecurePassword
    page.getViewById("text1").text = globalVars.messageObjects.yourPasswordIsKeyToYourWallet
    page.getViewById("lenCheck").text = globalVars.messageObjects.passwordEightCharLong
    page.getViewById("spaceCheck").text = globalVars.messageObjects.passwordNoSpace
    page.getViewById("spCharCheck").text = globalVars.messageObjects.passwordSpChar
    page.getViewById("numCheck").text = globalVars.messageObjects.passwordOneNumber
    page.getViewById("password").hint = globalVars.messageObjects.createASecurePassword
    page.getViewById("nextBtn").text = globalVars.messageObjects.next



    psInput = page.getViewById('password')
    psInput.on("textChange", testFunc);
    insomnia.keepAwake();
};


var testFunc = function () {

    var s = page.getViewById("password").text

    if (String(s).length >= minimumLength) {
        var sufficientLength = true;
        page.getViewById('lenCheck').color = 'green';
    }
    else {
        sufficientLength = false;
        page.getViewById('lenCheck').color = 'red';
    }

    if (String(s).indexOf(' ') < 0) {
        containsNoSpace = true
        page.getViewById('spaceCheck').color = 'green';

    }
    else {
        containsNoSpace = false
        page.getViewById('spaceCheck').color = 'red';
    }

    if (RegExp('[0-9]').test(s)) {
        containsNumber = true;
        page.getViewById('numCheck').color = 'green';
    }
    else {
        containsNumber = false;
        page.getViewById('numCheck').color = 'red';
    }

    if (RegExp(/[/!/@/#/$/%/^/&/*/(/)/_/+/-/=/~/]/).test(s)) {
        containsSpecialChar = true;
        page.getViewById('spCharCheck').color = 'green';
    }
    else {
        containsSpecialChar = false;
        page.getViewById('spCharCheck').color = 'red';
    }


    if (sufficientLength && containsNoSpace && containsNumber && containsSpecialChar) {

        page.getViewById('nextBtn').disabled = false;
        page.getViewById('nextBtn').class = 'btn btn-outline btn-rounded-lg';
        password = s
        validPassword = true;
    }
    else {
        page.getViewById('nextBtn').disabled = true;
        page.getViewById('nextBtn').class = 'btn btn-outline btn-rounded-lg disabled';
        validPassword = false;
    }
}

exports.nextClicked = function () {

    if (!validPassword) return;

    if (resetPasswordRequest) {

        if (String(page.navigationContext.info) === password) {

            dialogs.alert({
                title: globalVars.messageObjects.error,
                message: globalVars.messageObjects.yourNewPasswordIsSameAsOld,
                okButtonText: globalVars.messageObjects.Ok
            }).then(res => {
                psInput.text = ""
                return
            })
        }
        else {
            frameModule.topmost().navigate({
                moduleName: globalVars.navigation.verifyPassword,
                context: {
                    info: password,
                    previousPassword: page.navigationContext.info,
                    execute: globalVars.execute.resetPassword
                },
                animated: true,
                transition: globalVars.transitions.slideLeft
            })
        }
    }
    else {
        if (newWallet) {
            frameModule.topmost().navigate({
                moduleName: globalVars.navigation.verifyPassword,
                context: { info: password, execute: globalVars.execute.newWallet },
                animated: true,
                transition: globalVars.transitions.slideLeft
            })
        }
        else if (restoreWallet) {
            frameModule.topmost().navigate({
                moduleName: globalVars.navigation.verifyPassword,
                context: { info: password, execute: globalVars.execute.restoreWallet },
                animated: true,
                transition: globalVars.transitions.slideLeft
            }
            )
        }
    }
}