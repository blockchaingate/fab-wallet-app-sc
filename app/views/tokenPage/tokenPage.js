const frameModule = require("tns-core-modules/ui/frame");
const globalVars = require("../../globalVars")
const app = require("tns-core-modules/application")

var page;

exports.pageLoaded = function (args) {

    page = args.object;

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
                moduleName: globalVars.navigation.dashboard,
                animated: true,
                transition: globalVars.transitions.slideLeft
            })
        }
    }

    page.getViewById("actionBar").title = globalVars.messageObjects.tokens
    page.getViewById("title").text = globalVars.messageObjects.tokens
    page.getViewById("myTokensBtn").text = globalVars.messageObjects.myTokens
    page.getViewById("addTokensFromListBtn").text = globalVars.messageObjects.addTokensFromList
    page.getViewById("addOtherTokensBtn").text = globalVars.messageObjects.addOtherTokens
    page.getViewById("tokenHistoryBtn").text = globalVars.messageObjects.tokenHistory
    page.getViewById("backButton").text = globalVars.messageObjects.goToDashboard

   // page.getViewById("receiveTokensBtn").text = globalVars.messageObjects.receiveTokens
};

exports.tokenHistoryClicked = function() {
    frameModule.topmost().navigate({
        moduleName:globalVars.navigation.tokenHistory,
        animated:true,
        transition:globalVars.transitions.slideLeft,
        context:{previousPage:globalVars.navigation.tokenPage}
    })
}

exports.myTokensClicked = function() {
    frameModule.topmost().navigate({
        moduleName:globalVars.navigation.myTokens,
        animated:true,
        transition:globalVars.transitions.slideLeft
    })
}



exports.addTokensFromListClicked = function() {
    frameModule.topmost().navigate({
        moduleName:globalVars.navigation.tokenList,
        animated:true,
        transition:globalVars.transitions.slideLeft,
        context:{previousPage:globalVars.navigation.tokenPage}
    })
}

exports.addOtherTokensClicked = function(){
    frameModule.topmost().navigate({
        moduleName:globalVars.navigation.addOtherTokens,
        animated:true,
        transition:globalVars.transitions.slideLeft,
        context:{previousPage:globalVars.navigation.tokenPage}
    })
}

exports.goToDashboardClicked = function() {
    frameModule.topmost().navigate({
        moduleName:globalVars.navigation.dashboard,
        animated:true,
        transition:globalVars.transitions.slideRight
    })
}