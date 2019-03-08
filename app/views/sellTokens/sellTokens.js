const frameModule = require("tns-core-modules/ui/frame");
const dialogs = require("tns-core-modules/ui/dialogs");
const globalVars = require("../../globalVars")
const walletManager = require("../../walletManager")
const dataManager = require("../../dataManager")
const app = require("tns-core-modules/application")
const ObservableModule = require("tns-core-modules/data/observable");


var page;   
var info;
var tokenBalance = 0;
var vm;
var tokenSellPrice = 0;
var addressFabcoinBalance = 0;
var addressForToken;
var expectedFabcoins = 0;
exports.pageLoaded = async function (args) {

    page = args.object;
    info = page.navigationContext.info
    addressFabcoinBalance = info.AddressFabcoinBalance;
    addressForToken = info.Address;

    //console.log(addressFabcoinBalance,addressForToken)   
    vm = new ObservableModule.Observable();
    vm.set("isLoading",false)
    page.bindingContext = vm

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

    tokenSellPrice = await walletManager.getTokenSellPrice(info.ContractAddress)
    
    page.getViewById("actionBar").title = globalVars.messageObjects.fabLightWallet
    page.getViewById("title").text =  globalVars.messageObjects.sell +" "+info.Name
  
    page.getViewById("name").text = globalVars.messageObjects.tokenName + " : "+ info.Name
    page.getViewById("symbol").text = globalVars.messageObjects.tokenSymbol + " : "+ info.Symbol
    page.getViewById("balance").text = globalVars.messageObjects.tokenBalance+ " : " + info.Balance
    page.getViewById("tokenPrice").text = globalVars.messageObjects.tokenPrice + " : " + tokenSellPrice
    page.getViewById("addressBalance").text = globalVars.messageObjects.addressFabcoinBalance +  " : " + addressFabcoinBalance;
    page.getViewById("expectedFabcoins").text = globalVars.messageObjects.expectedFabcoins + " : " 
    tokenBalance = Number(info.Balance)
    page.getViewById("tokenAmount").hint = globalVars.messageObjects.numberOfTokensToSell
    page.getViewById("sellTokens").text = globalVars.messageObjects.sellTokens
    page.getViewById("back").text = globalVars.messageObjects.back


    page.getViewById("tokenAmount").on("textChange",tokenTextchanged)
};

var tokenTextchanged =function(){

    expectedFabcoins = tokenSellPrice * Number(page.getViewById("tokenAmount").text)
    page.getViewById("expectedFabcoins").text = globalVars.messageObjects.expectedFabcoins + " : " + expectedFabcoins;
    
}

exports.sellTokensClicked = async function() {


   let tokenAmount = Number(page.getViewById("tokenAmount").text)
  
   //here, add checks  amounts
    if (!walletManager.isPositiveNumber(page.getViewById("tokenAmount").text)) {
        dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.amountMustBePositivenumber, okButtonText: globalVars.messageObjects.Ok })
        return;
    }


    if (page.getViewById("tokenAmount").text === "") {
        dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.emptyAmount, okButtonText: globalVars.messageObjects.Ok })
        return;
    }
    



    if(info.Balance < tokenAmount){
        dialogs.alert({title:globalVars.messageObjects.error,message:globalVars.messageObjects.doNotHaveEnoughTokensToProceedWithThisTx,okButtonText:globalVars.messageObjects.Ok})
        return
    }

    vm.set("isLoading",true)
  
    let address = info.Address;

    //add activity indicator here

   let res = await walletManager.sellTokens(info.Name ,info.ContractAddress,address,tokenAmount,expectedFabcoins)



   vm.set("isLoading",false)

   

   if(res === 1){
        //transaction successful
        // reset the token balance and update it appropriately in the database.
        await dialogs.alert({title:globalVars.messageObjects.success,message:globalVars.messageObjects.sellTokenTxSubmittedSuccessfully,okButtonText:globalVars.messageObjects.Ok});

        //resetTokenBalance(contractAddress, address, newBalance)

      
       // console.log("before")
      //  dataManager.showTable(globalVars.databaseObjects.myTokensTable.name)

        walletManager.updateTokenBalance(info.ContractAddress,tokenBalance)



    
        dataManager.showTable(globalVars.databaseObjects.myTokensTable.name)

        page.getViewById("balance").text = globalVars.messageObjects.tokenBalance + " : " +tokenBalance; 
        info.Balance = tokenBalance
        

   }
   else if( res === -3){
       //error - something went wrong
       await dialogs.alert({title:globalVars.messageObjects.error,message:globalVars.messageObjects.sellTokenTxCouldNotBeSubmitted,okButtonText:globalVars.messageObjects.Ok}); 
   }

  // console.log(res)

}

exports.backClicked = function() {

    frameModule.topmost().navigate({
        moduleName:globalVars.navigation.tokenDashboard,
        animated:true,
        transition:globalVars.transitions.slideRight,
        context:{info:page.navigationContext.info}
    })  
}
    