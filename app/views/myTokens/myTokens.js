const frameModule = require("tns-core-modules/ui/frame");
const globalVars = require("../../globalVars")
const walletManager = require("../../walletManager")
const app = require("tns-core-modules/application")
const ObservableModule = require("tns-core-modules/data/observable")


var page;

var myTokens;


exports.pageLoaded = async function (args) {

    page = args.object;

    myTokens =  walletManager.getMyTokens();

    //set Token Balances from the API at load time
    
    let tokenBalanceChange = false;

    myTokens.forEach(async function(token){

       let b = await walletManager.getTokenBalance(token.ContractAddress,info.Name)

       if(b != token.Balance){
       //save the correct balance in the database and reRead the database and reset the tokens       
       //console.log(b,token.Balance)
       walletManager.updateTokenBalance(token.ContractAddress,b)
       tokenBalanceChange = true;
       


       }
    })
   
    if(tokenBalanceChange) myTokens = walletManager.getMyTokens();

    let tmpArray = myTokens;
    
    tmpArray.forEach(element=>{
        element.test0 = globalVars.messageObjects.tokenName + " : "+element.Name;
        element.test1 = globalVars.messageObjects.tokenSymbol + " : "+element.Symbol;
        element.test2 = globalVars.messageObjects.tokenBalance + " : "+element.Balance;
    })

    const vm = new ObservableModule.Observable();
    vm.set("myTokens",tmpArray)
    page.bindingContext = vm;

    if(myTokens.length === 0) {
        page.getViewById("noTokens").text = globalVars.messageObjects.doNotHaveAnyTokens_addTokens
    }

 

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
    page.getViewById("actionBar").title = globalVars.messageObjects.fabLightWallet
    page.getViewById("title").text = globalVars.messageObjects.myTokens
    page.getViewById("addTokens").text = globalVars.messageObjects.addTokens
    page.getViewById("addOtherTokens").text = globalVars.messageObjects.addOtherTokens
    page.getViewById("back").text = globalVars.messageObjects.back
};


exports.backClicked = function() {

    frameModule.topmost().navigate({
        moduleName:globalVars.navigation.tokenPage,
        animated:true,
        transition:globalVars.transitions.slideRight
    })
}

exports.addTokensClicked = function() {
    frameModule.topmost().navigate({
        moduleName:globalVars.navigation.tokenList,
        animated:true,
        transition:globalVars.transitions.slideLeft,
        context:{previousPage:globalVars.navigation.myTokens}
    })
}

exports.addOtherTokensClicked = function(){

    frameModule.topmost().navigate({
        moduleName:globalVars.navigation.addOtherTokens,
        animated:true,
        transition:globalVars.transitions.slideLeft,
        context:{previousPage:globalVars.navigation.myTokens}
    })   
}


exports.onItemTap = function(args){

    const index = args.index;

    frameModule.topmost().navigate({
        moduleName : globalVars.navigation.tokenDashboard,
        animated:true,
        transition:globalVars.transitions.slideLeft,
        context:{info:myTokens[index]}
    })  
}