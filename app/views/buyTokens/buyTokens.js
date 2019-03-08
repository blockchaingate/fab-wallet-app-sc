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
var tokenBuyPrice = 0;
var addressFabcoinBalance = 0;
var addressForToken;
var requiredFabcoins = 0;
exports.pageLoaded = async function (args) {

    page = args.object;
    info = page.navigationContext.info
    addressFabcoinBalance = info.AddressFabcoinBalance;
    addressForToken = info.Address;

   // console.log(info)

   // console.log(addressFabcoinBalance,addressForToken)   

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

    tokenBuyPrice = await walletManager.getTokenBuyPrice(info.ContractAddress)

    page.getViewById("actionBar").title = globalVars.messageObjects.fabLightWallet
    page.getViewById("title").text = globalVars.messageObjects.buy+ " "+info.Name
  
    page.getViewById("name").text = globalVars.messageObjects.tokenName+" : "+ info.Name
    page.getViewById("symbol").text = globalVars.messageObjects.tokenSymbol+ " : "+ info.Symbol
    page.getViewById("balance").text = globalVars.messageObjects.tokenBalance+ " : " + info.Balance
    page.getViewById("tokenPrice").text =  globalVars.messageObjects.tokenPrice + " : " + tokenBuyPrice
    page.getViewById("addressBalance").text = globalVars.messageObjects.addressFabcoinBalance + " : " + addressFabcoinBalance;
    page.getViewById("requiredFabcoins").text = globalVars.messageObjects.requiredFabcoins + " : " 
    tokenBalance = Number(info.Balance)
    page.getViewById("buyTokens").text = globalVars.messageObjects.buyTokens
    page.getViewById("back").text = globalVars.messageObjects.back

    page.getViewById("tokenAmount").on("textChange",tokenTextchanged)
};

var tokenTextchanged =function(){


    requiredFabcoins = tokenBuyPrice * Number(page.getViewById("tokenAmount").text)

    page.getViewById("requiredFabcoins").text = globalVars.messageObjects.requiredFabcoins + " : " + requiredFabcoins;
    
}

exports.buyTokensClicked = async function() {

   // console.log(page.getViewById("address").text)
   // console.log(page.getViewById("amount").text)
   // console.log(info.ContractAddress)
   // console.log(info.Name)
   // console.log(info.Balance)

   let tokenAmount = Number(page.getViewById("tokenAmount").text)
  
   //here, add checks for address and amounts
    if (!walletManager.isPositiveNumber(page.getViewById("tokenAmount").text)) {
        dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.amountMustBePositivenumber, okButtonText: globalVars.messageObjects.Ok })
        return;
    }


   /* var hexAddress;
    var bs58Address;

    if(address.length === 40 && walletManager.isStringHex(address)){
        ///this means that the address is already in the hex format
        hexAddress = address
    }
    else{
        try {
            let p = Btc.address.toOutputScript(address, globalVars.currentNetwork)
        }
        catch (e) {
            dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.invalidAddress, okButtonText: globalVars.messageObjects.Ok })
            page.getViewById("address").text = ""
            return;
        }

        bs58Address = address;
        hexAddress = walletManager.bs58ToVmAddress(bs58Address);
    }*/

    if (page.getViewById("tokenAmount").text === "") {
        dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.emptyAmount, okButtonText: globalVars.messageObjects.Ok })
        return;
    }
    

    let b = walletManager.getCurrentBalance()
  

    //if(info.AddressFabcoinBalance < requiredFabcoins){
    //This works because, the tokens can be bought with any fabcoins as long as the first UTXO is the address associated with the Fabcoin.
    if(b < requiredFabcoins){
        dialogs.alert({title:globalVars.messageObjects.error,message:globalVars.messageObjects.notEnoughFabcoinsToProceedWithTransaction,okButtonText:globalVars.messageObjects.Ok})
        return
    }


   // console.log(bs58Address,hexAddress)




    vm.set("isLoading",true)
  
    let address = info.Address;


    //add activity indicator here
    
   let res = await walletManager.buyTokens(info.Name, info.ContractAddress,address,tokenAmount,requiredFabcoins)



   vm.set("isLoading",false)

   

   if(res === 1){
        //transaction successful
        // reset the token balance and update it appropriately in the database.
        await dialogs.alert({title:globalVars.messageObjects.success,message:globalVars.messageObjects.buyTokenTxSubmittedSuccessfully,okButtonText:globalVars.messageObjects.Ok});

        //resetTokenBalance(contractAddress, address, newBalance)

      
       // console.log("before")
      //  dataManager.showTable(globalVars.databaseObjects.myTokensTable.name)

        walletManager.updateTokenBalance(info.ContractAddress,tokenBalance)



        dataManager.showTable(globalVars.databaseObjects.myTokensTable.name)

        page.getViewById("balance").text = globalVars.messageObjects.tokenBalance+ " : " +tokenBalance; 
        info.Balance = tokenBalance
        

   }
   else if( res === -3){
       //error - something went wrong
       await dialogs.alert({title:globalVars.messageObjects.error,message:globalVars.messageObjects.buyTokenTxCouldNotBeSubmitted,okButtonText:globalVars.messageObjects.Ok}); 
   }

}

exports.backClicked = function() {

    frameModule.topmost().navigate({
        moduleName:globalVars.navigation.tokenDashboard,
        animated:true,
        transition:globalVars.transitions.slideRight,
        context:{info:page.navigationContext.info}
    })  
}
    