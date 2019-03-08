const frameModule = require("tns-core-modules/ui/frame");
const dialogs = require("tns-core-modules/ui/dialogs");
const globalVars = require("../../globalVars")
const walletManager = require("../../walletManager")
const dataManager = require("../../dataManager")
const app = require("tns-core-modules/application")
const ObservableModule = require("tns-core-modules/data/observable")
const Btc = require('bitcoinjs-lib');
const clipboard = require("nativescript-clipboard")
var BarcodeScanner = require("nativescript-barcodescanner").BarcodeScanner;


var page;   
var info;
var tokenBalance = 0;
var vm;
var addressForToken;

exports.pageLoaded = async function (args) {

    page = args.object;
    console.log(page.navigationContext)

    //custom Local Wallet address for a token is now available
    addressForToken = page.navigationContext.info.LocalWalletAddress;

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

    info = page.navigationContext.info

    page.getViewById("actionBar").title = globalVars.messageObjects.fabLightWallet
    page.getViewById("title").text = globalVars.messageObjects.send + " "+info.Name
    page.getViewById("name").text = globalVars.messageObjects.tokenName + " : "+ info.Name
    page.getViewById("symbol").text = globalVars.messageObjects.tokenSymbol + " : "+ info.Symbol
    page.getViewById("balance").text = globalVars.messageObjects.tokenBalance + " : " + info.Balance
    page.getViewById("address").hint = globalVars.messageObjects.receiversAddress ; 
    page.getViewById("pasteBtn").text = globalVars.messageObjects.pasteAddress
    page.getViewById("qrcodeBtn").text = globalVars.messageObjects.scanQrCode
    page.getViewById("amount").hint = globalVars.messageObjects.tokenAmount
    page.getViewById("sendTokens").text = globalVars.messageObjects.sendTokens
    page.getViewById("back").text = globalVars.messageObjects.back
    tokenBalance = Number(info.Balance)
};


exports.pasteClicked = function () {
    clipboard.getText().then(function (text) {
        page.getViewById("address").text = text
    })
}

exports.qrClicked = function () {

    var barcodescanner = new BarcodeScanner();
    barcodescanner.scan({
        formats: "QR_CODE,PDF_417",   // Pass in of you want to restrict scanning to certain types
        cancelLabel: "EXIT. Also, try the volume buttons!", // iOS only, default 'Close'
        cancelLabelBackgroundColor: "#333333", // iOS only, default '#000000' (black)
        message: "Use the volume buttons for extra light", // Android only, default is 'Place a barcode inside the viewfinder rectangle to scan it.'
        showFlipCameraButton: false,   // default false
        preferFrontCamera: false,     // default false
        showTorchButton: true,        // default false
        beepOnScan: true,             // Play or Suppress beep on scan (default true)
        torchOn: false,               // launch with the flashlight on (default false)
        closeCallback: function () { /* console.log("Scanner closed");*/ return; }, // invoked when the scanner was closed (success or abort)
        resultDisplayDuration: 500,   // Android only, default 1500 (ms), set to 0 to disable echoing the scanned text
        orientation: "portrait",     // Android only, optionally lock the orientation to either "portrait" or "landscape"
        openSettingsIfPermissionWasPreviouslyDenied: true // On iOS you can send the user to the settings app if access was previously denied
    }).then(
        function (result) {
            // console.log("Scan format: " + result.format);
            // console.log("Scan text:   " + result.text);

            //The address might come in any format
          /*  try {

                Btc.address.toOutputScript(result.text, globalVars.currentNetwork)
            }
            catch (e) {

                //In Error : It means that the QR Code Does not repesent a valid addresss
                //dialogs.alert({ title: globalVars.messageObjects.error, message: "The address you scanned is not valid Fabcoin address.", okButtonText: globalVars.messageObjects.Ok })
                page.getViewById("rAddress").text = ""
                return;
            }*/
            page.getViewById("rAddress").text = result.text;
        },
        function (error) {
            //console.log("No scan: " + error);
            dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.addressCouldntBeScanned_tryAgain, okButtonText: globalVars.messageObjects.Ok })
        }
    );
}


exports.sendTokensClicked = async function() {

   // console.log(page.getViewById("address").text)
   // console.log(page.getViewById("amount").text)
   // console.log(info.ContractAddress)
   // console.log(info.Name)
   // console.log(info.Balance)

    let address = page.getViewById("address").text
    let amount = Number(page.getViewById("amount").text)

  //  console.log(address,amount);

    console.log(walletManager.isStringHex(address))


   //here, add checks for address and amounts
    if (!walletManager.isPositiveNumber(page.getViewById("amount").text)) {
        dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.amountMustBePositivenumber, okButtonText: globalVars.messageObjects.Ok })
        return;
    }


    var hexAddress;
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
    }

    if (page.getViewById("amount").text === "") {
        dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.emptyAmount, okButtonText: globalVars.messageObjects.Ok })
        return;
    }
    

    if(amount > tokenBalance){
        dialogs.alert({title:globalVars.messageObjects.error,message:globalVars.messageObjects.amountCannotBeGreaterThenAvailableTokenBalance,okButtonText:globalVars.messageObjects.Ok})
        return
    }


    //console.log(bs58Address,hexAddress)


    vm.set("isLoading",true)

   let res = await walletManager.sendTokens(info.Name,info.ContractAddress,address,amount,addressForToken)

   vm.set("isLoading",false)

   if(res === 1){
        //transaction successful
        // reset the token balance and update it appropriately in the database.
        await dialogs.alert({title:globalVars.messageObjects.success,message:globalVars.messageObjects.sendTokenTxSubmittedSuccessfully,okButtonText:globalVars.messageObjects.Ok});

        //resetTokenBalance(contractAddress, address, newBalance)

        //deduct sent token amount from the token balance
        tokenBalance -= amount;

        dataManager.showTable(globalVars.databaseObjects.myTokensTable.name)

        walletManager.updateTokenBalance(info.ContractAddress,tokenBalance)

        dataManager.showTable(globalVars.databaseObjects.myTokensTable.name)

        page.getViewById("balance").text = globalVars.messageObjects.tokenBalance + " : " +tokenBalance; 
        info.Balance = tokenBalance
        

   }
   else if( res === -3){
       //error - something went wrong 
       await dialogs.alert({title:globalVars.messageObjects.error,message:globalVars.messageObjects.sendTokenTxCouldNotBeSubmitted,okButtonText:globalVars.messageObjects.Ok}); 
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
    