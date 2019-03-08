
const Btc = require('bitcoinjs-lib');
const Observable = require("tns-core-modules/data/observable");
const frameModule = require("tns-core-modules/ui/frame");
const dialogs = require("tns-core-modules/ui/dialogs");
const clipboard = require("nativescript-clipboard")
const globalVars = require("../../globalVars")
const walletManager = require("../../walletManager")
const app = require("tns-core-modules/application")
const ActivityIndicator = require("tns-core-modules/ui/activity-indicator").ActivityIndicator
var BarcodeScanner = require("nativescript-barcodescanner").BarcodeScanner;
//Add big number handling later on

var page;
var sendAddress; // the address where the funds are to be sent
var sendAmount;

var acti; //activity indicator binding object
var indicator;

var currentBalance;
//var fee = 0.00003000; //testing purposes only. It will be calculated dynamically in  the real application

var fee;// = walletManager.getFlatFee();

var deductFeeFromSendAmount;

var mySwitch;

exports.pageLoaded = function (args) {

     page = args.object;
   // console.log(page.navigationContext)
    if(page.navigationContext){
        if(page.navigationContext.address){
            page.getViewById("rAddress").text = page.navigationContext.address
        }
    }

    fee = walletManager.getFlatFee()
   
    walletManager.setIdleTime()
    acti = new Observable.fromObject({
        isLoading: false
    })

    indicator = new ActivityIndicator();
    indicator.rowSpan = "2"
    indicator.colSpan = "2"
    indicator.color = "white"
    indicator.bind({
        sourceProperty: "isLoading",
        targetProperty: "busy",
        twoWay: true
    }, acti);
    page.getViewById("myGrid").addChild(indicator)

    if (page.ios) {

        page.getViewById('rAddress').style = "height:35;";
        page.getViewById('amount').style = "height:35;";
        page.getViewById('comment').style = "height:35;";
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

    page.getViewById("actionBar").title = globalVars.messageObjects.sendFabcoin
    page.getViewById("text1").text = globalVars.messageObjects.receiversAddress
    page.getViewById("spendBalanceLabel").text = globalVars.messageObjects.spendableBalance
    page.getViewById("deductTxFeeLabel").text = globalVars.messageObjects.deductTxFee


    page.getViewById("rAddress").hint = globalVars.messageObjects.enterReceiversAddress
    page.getViewById("pasteBtn").text = globalVars.messageObjects.pasteAddress
    page.getViewById("qrcodeBtn").text = globalVars.messageObjects.scanQrCode

    page.getViewById("amountLabel").text = globalVars.messageObjects.amount
    page.getViewById("amount").hint = globalVars.messageObjects.enterAmountToBeSent
    page.getViewById("comment").hint = globalVars.messageObjects.enterComment

    page.getViewById("sendBtn").text = globalVars.messageObjects.send
    page.getViewById("backBtn").text = globalVars.messageObjects.goToDashboard

    mySwitch = page.getViewById("deductFeeSwitch")
    deductFeeFromSendAmount = mySwitch.checked;

    updateCurrentBalance();
    updateSpendableBalance();


    mySwitch.on("checkedChange", function () {

        deductFeeFromSendAmount = mySwitch.checked;
        updateSpendableBalance()
    })
};

var updateSpendableBalance = function () {

    let tmp = (mySwitch.checked) ? currentBalance : Number(currentBalance - fee - (walletManager.getUtxoCount() * walletManager.getFeePerVin())).toFixed(8);

    //get spendable balance for this transaction 
    // let tmp = walletManager.getSpendableBalance(mySwitch.checked)

    page.getViewById("spendBalanceLabel").text = globalVars.messageObjects.spendableBalance + " : " + tmp

    if (tmp < 0) {
        page.getViewById("spendBalanceLabel").text = globalVars.messageObjects.spendableBalance + " : 0"
    }
}

//This is not working - nativescript bug
exports.deductFeeSwitchChanged = function () {

    ;
}

exports.pasteClicked = function () {
    clipboard.getText().then(function (text) {
        page.getViewById("rAddress").text = text
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

            try {

                Btc.address.toOutputScript(result.text, globalVars.currentNetwork)
            }
            catch (e) {

                //In Error : It means that the QR Code Does not repesent a valid addresss
                //dialogs.alert({ title: globalVars.messageObjects.error, message: "The address you scanned is not valid Fabcoin address.", okButtonText: globalVars.messageObjects.Ok })
                page.getViewById("rAddress").text = ""
                return;
            }

            page.getViewById("rAddress").text = result.text;


        },
        function (error) {
            //console.log("No scan: " + error);
            dialogs.alert({ title: globalVars.messageObjects.error, message: "The address could not be scanned. Kindly try again.", okButtonText: globalVars.messageObjects.Ok })

        }



    );
}

exports.backClicked = function () {
    //  frameModule.topmost().navigate(globalVars.navigation.dashboard)
    frameModule.topmost().navigate({
        moduleName: globalVars.navigation.dashboard,
        animated: true,
        transition: globalVars.transitions.slideRight
    })
}

var updateBalance = function (balance) {
    if (currentBalance === undefined) return
    currentBalance = balance;
    page.getViewById("currentBalanceLabel").text = globalVars.messageObjects.currentBalance + " : " + currentBalance + " FAB"

    updateSpendableBalance()
}

function updateCurrentBalance() {

    currentBalance = walletManager.getCurrentBalance()
    page.getViewById("currentBalanceLabel").text = globalVars.messageObjects.currentBalance + " : " + currentBalance + " FAB"


}

exports.sendClicked = async function () {

    //check the send address
    //check if there are sufficient funds to cover the amount and fee
    //show activity indicator
    sendAddress = page.getViewById("rAddress").text

    //this is to take care of ios specific bug
    //console.log(walletManager.isPositiveNumber(page.getViewById("amount").text))
    if (!walletManager.isPositiveNumber(page.getViewById("amount").text)) {
        dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.amountMustBePositivenumber, okButtonText: globalVars.messageObjects.Ok })
        return;
    }



    sendAmount = Number(page.getViewById("amount").text)

    let p;

    //check if address is good
    try {
        p = Btc.address.toOutputScript(sendAddress, globalVars.currentNetwork)
    }
    catch (e) {


        dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.invalidAddress, okButtonText: globalVars.messageObjects.Ok })
        page.getViewById("rAddress").text = ""
        return;
    }

    if (page.getViewById("amount").text === "") {
        dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.emptyAmount, okButtonText: globalVars.messageObjects.Ok })
        return;
    }
    else {





        if (deductFeeFromSendAmount) {

            if (sendAmount <= (globalVars.minimumThresholdAmount + fee)) {

                dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.amountMustBeGreaterThenZero, okButtonText: globalVars.messageObjects.Ok })
                page.getViewById("amount").text = ""
                return
            }


            /* if ((sendAmount) > currentBalance) {
                 dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.insufficientFunds, okButtonText: globalVars.messageObjects.Ok })
                 page.getViewById("amount").text = ""
                 return
             }*/

            if (sendAmount > currentBalance) {
                dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.insufficientFunds, okButtonText: globalVars.messageObjects.Ok })
                page.getViewById("amount").text = ""
                return
            }
        }
        else {
            if (sendAmount <= globalVars.minimumThresholdAmount) {

                dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.amountMustBeGreaterThenZero, okButtonText: globalVars.messageObjects.Ok })
                page.getViewById("amount").text = ""
                return
            }

            /* if ((sendAmount + fee) > currentBalance) {
                 dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.insufficientFunds, okButtonText: globalVars.messageObjects.Ok })
                 page.getViewById("amount").text = ""
                 return
             }*/

            if (sendAmount + fee + (walletManager.getUtxoCount() * 0.00000200) > currentBalance) {
                dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.insufficientFunds, okButtonText: globalVars.messageObjects.Ok })
                page.getViewById("amount").text = ""
                return
            }
        }



        //this translation should be done without global object
        if (sendAmount > walletManager.getSpendableBalance(deductFeeFromSendAmount)) {

            if (globalVars.getCurrentLanguage() === globalVars.langList.english) {
               
                dialogs.alert({ title: globalVars.messageObjects.error, message: "The Light Wallet supports first 100 UTXOs to be used as an input for Send Transaction.\nAs per Your Local UTXO Set, The total of first 100 UTXOs is " + walletManager.getSpendableBalance(deductFeeFromSendAmount) + ".\nKindly enter an amount lower then " + walletManager.getSpendableBalance(deductFeeFromSendAmount) + ".\nIf you wish to send larger amount, combine your UTXOs first by sending these amounts to yourself.", okButtonText: globalVars.messageObjects.Ok })
              
            } 
            else if (globalVars.getCurrentLanguage() === globalVars.langList.chinese) {

                dialogs.alert({ title: globalVars.messageObjects.error, message: "轻钱包支持前100个UTXO用作发送交易的输入。\n根据您的本地UTXO设置，前100个UTXO的总数为 " + walletManager.getSpendableBalance(deductFeeFromSendAmount) + ".\n请输入低于 " + walletManager.getSpendableBalance(deductFeeFromSendAmount) + ".\n的金额如果您希望发送更大金额，请先合并您的UTXO通过将这些金额发送给您自己。", okButtonText: globalVars.messageObjects.Ok })
            } 
            
            page.getViewById("amount").text = ""
            return
        }


    }


    //this is to make sure that the transaction isn't duplicated if the user preses the send button twice
    page.getViewById("amount").text = ""

    acti.set("isLoading", true)

    let cmt = page.getViewById("comment").text

    if (cmt === "") cmt = "None"

    //here, call a wallet function to prepare and send the transaction
   let result = await walletManager.sendFabcoins(sendAddress, sendAmount, deductFeeFromSendAmount, cmt)
    acti.set("isLoading", false)

}


exports.updateBalance = updateBalance;