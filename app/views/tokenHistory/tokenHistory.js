const globalVars = require("../../globalVars");
const walletManager = require("../../walletManager");
const frameModule = require("tns-core-modules/ui/frame");
const observableModule = require("tns-core-modules/data/observable");
var ObservableArray = require("tns-core-modules/data/observable-array").ObservableArray;
const app = require("tns-core-modules/application")

var page;
var curTxHistoryIdx = 0;
var maxTxPerPage = 5; // change it to 100 later
var tmpArray = new Array();
var allHistory = new Array();
var pageData;
var language;


exports.pageLoaded = function (args) {

    language = globalVars.currentLanguage
    walletManager.setIdleTime()
    page = args.object;
    // let tmp = walletManager.getTxHistory()


    tmpArray = JSON.parse(JSON.stringify(walletManager.getTokenHistoryFromDatabase()))
    allHistory = JSON.parse(JSON.stringify(walletManager.getTokenHistoryFromDatabase()))

    setTmpArray()


    page.getViewById("actionBar").title = globalVars.messageObjects.tokens
    page.getViewById("title").text = globalVars.messageObjects.tokenHistory
    
    page.getViewById("goToDashboard").text = globalVars.messageObjects.goToDashboard
    page.getViewById("back").text = globalVars.messageObjects.back


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
                transition: globalVars.transitions.slideRight
            })
        }
    }

    //remove date now from txhistory in view


    page.bindingContext = pageData;


    let p = page.getViewById("rere")

    p.on("itemTap", async function (args) {
   

        let i = args.index;

        let obj = tmpArray[i]

        console.log(obj)
        frameModule.topmost().navigate({
            moduleName: globalVars.navigation.tokenTransactionDetail,
             context: {
                type: obj.Type,
                txid: obj.TxId,
                amt: obj.TokenAmount,
                to: obj.ToAddress,
                fee: obj.FabcoinAmount,
               // date: obj.Date
               date: obj.DateStr+ " "+obj.time
            },
            animated: true,
            transition: globalVars.transitions.slideLeft
        })
    })
}

var resetTxHistory = function() {

    allHistory = JSON.parse(JSON.stringify(walletManager.getTokenHistoryFromDatabase()))
    curTxHistoryIdx = 0
    setTmpArray()
}

var setTmpArray = function () {

    tmpArray = []

    for (let i = curTxHistoryIdx; i < curTxHistoryIdx + maxTxPerPage; i++) {

        if (i >= allHistory.length) break
        tmpArray.push(allHistory[i])

    }

    tmpArray.forEach(element => {
        

        console.log(element)
        let dt = new Date(Number(element.Time))
        let dtStr = dt.toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
        element.DateStr = dtStr;
        element.time = getTimeString(dt) // dt.getHours().toString()+":"+dt.getMinutes().toString()
        element.AmtAndFee = (element.Type === globalVars.addressType.send) ? Number(Number(element.Amount).toFixed(8)) + " + " + Number(Number(element.TxFee).toFixed(8)) : Number(Number(element.Amount).toFixed(8))

        element.Testt = globalVars.messageObjects.tokenName+" : "+element.TokenName
        
        element.Test0 = globalVars.messageObjects.transactionType+" : "  + ((element.Type === globalVars.tokenTransactionType.send) ? globalVars.messageObjects.send : ((element.Type === globalVars.tokenTransactionType.receive) ? globalVars.messageObjects.receive : ((element.Type === globalVars.tokenTransactionType.buy) ? globalVars.messageObjects.buy : ((element.Type === globalVars.tokenTransactionType.sell) ?  globalVars.messageObjects.sell : "" ))))

        element.Test1 = globalVars.messageObjects.amount+ " : " + element.TokenAmount
        element.Test2 = globalVars.messageObjects.Date+" : " + element.DateStr+ " "+element.time

      //  element.Test3 = (globalVars.messageObjects.Comment+" : "+((element.Comment == "None") ? "" : element.Comment))
    });

    pageData = new observableModule.fromObject({
        myList: new ObservableArray(tmpArray)
    })

    page.bindingContext = pageData;

}

exports.goToDashboardClicked = function () {
    //frameModule.topmost().navigate(globalVars.navigation.dashboard)
    frameModule.topmost().navigate({
        moduleName: globalVars.navigation.dashboard,
        animated: true,
        transition: globalVars.transitions.slideRight
    })
}

var getTimeString = function (date) {

    let d = new Date(date)

    let h = (d.getHours() > 12) ? d.getHours() - 12 : d.getHours()
    let m = d.getMinutes()
    if (m < 10) m = "0" + String(m)
    let ampm = (d.getHours() > 11) ? "PM" : "AM"

    return h + ":" + m + " " + ampm

}


exports.nextClicked = function () {
    curTxHistoryIdx = (curTxHistoryIdx - maxTxPerPage < 0) ? 0 : curTxHistoryIdx - maxTxPerPage;

    setTmpArray()


}

exports.prevClicked = function () {

    if(allHistory.length < maxTxPerPage) {
        return
    }

    curTxHistoryIdx = (curTxHistoryIdx + maxTxPerPage >= allHistory.length) ? curTxHistoryIdx : curTxHistoryIdx + maxTxPerPage;
 
    setTmpArray()
}

//this button may not be required at all
exports.exitClicked = function () {

    walletManager.exit();
}

exports.backClicked = function() {

    frameModule.topmost().navigate({
        moduleName:globalVars.navigation.tokenPage,
        animated:true,
        transition:globalVars.transitions.slideRight
    })
}

exports.resetTxHistory = resetTxHistory