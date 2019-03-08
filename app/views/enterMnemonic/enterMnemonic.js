const bip39 = require('bip39');
const Observable = require("tns-core-modules/data/observable");
const frameModule = require("tns-core-modules/ui/frame");
const dialogs = require("tns-core-modules/ui/dialogs");
const ActivityIndicator = require("tns-core-modules/ui/activity-indicator").ActivityIndicator
const globalVars = require("../../globalVars")
const walletManager = require("../../walletManager");
var insomnia = require("nativescript-insomnia");
var orientationModule = require("nativescript-screen-orientation");
const app = require("tns-core-modules/application")

var page;
var pageData;
var acti; //activity indicator binding object
var indicator;


exports.pageLoaded = function (args) {


    page = args.object;
    orientationModule.setCurrentOrientation("portrait");
    

    page.getViewById("actionBar").title = globalVars.messageObjects.fabLightWallet
    page.getViewById("title").text = globalVars.messageObjects.enterMnemonic
    page.getViewById("text1").text = globalVars.messageObjects.kindlyEnterMnemonic
    page.getViewById("nextBtn").text = globalVars.messageObjects.next

    acti = new Observable.fromObject({
        isLoading:false
    })
    
    indicator = new ActivityIndicator() ;
   // indicator.rowSpan = "4"
   // indicator.colSpan = "4"
    indicator.color = "white"

    if(page.ios){
        indicator.ios.activityIndicatorViewStyle = UIActivityIndicatorViewStyle.UIActivityIndicatorViewStyleWhiteLarge;
    }
    else if(page.android){
        indicator.width = 100;
        indicator.height = 100;
    }
    
    indicator.bind({
        sourceProperty:"isLoading",
        targetProperty:"busy",
        twoWay:true
    },acti);
    
    if(page.ios){
        
        page.getViewById('mw1').style = "height:35;";
        page.getViewById('mw2').style = "height:35;";
        page.getViewById('mw3').style = "height:35;";
        page.getViewById('mw4').style = "height:35;";
        page.getViewById('mw5').style = "height:35;";
        page.getViewById('mw6').style = "height:35;";
        page.getViewById('mw7').style = "height:35;";
        page.getViewById('mw8').style = "height:35;";
        page.getViewById('mw9').style = "height:35;";
        page.getViewById('mw10').style = "height:35;";
        page.getViewById('mw11').style = "height:35;";
        page.getViewById('mw12').style = "height:35;";
        
        //use this long method to hide the back link
        frameModule.topmost().ios.controller.visibleViewController.navigationItem.setHidesBackButtonAnimated(true, false);
    }
    else if(page.android){
        //do android specific stuff here
        
        let activity = app.android.startActivity ||
            app.android.foregroundActivity ||
            frameModule.topmost().android.currentActivity ||
            frameModule.topmost().android.activity

        //This is how android back button can be overriden
        activity.onBackPressed = function () {

            if(acti.isLoading === true) return;
            
            dialogs.confirm({ title: globalVars.messageObjects.exit, message: globalVars.messageObjects.exitSure, okButtonText: globalVars.messageObjects.yes, cancelButtonText: globalVars.messageObjects.no }).then((res) => {
              

                if (res) {
                    walletManager.exit();
                }
            })
        }
    }
    
    if(page.ios){
        page.getViewById("myStack").addChild(indicator)
    }
    else if(page.android){
        indicator.rowSpan = "4"
        indicator.colSpan = "4"
        indicator.color = "blue"
        page.getViewById("myGrid").addChild(indicator)
    }

    insomnia.keepAwake();

};

exports.nextClicked =  async function () {

    myUtxo = [];
    
    let w1 = sanitize(page.getViewById("mw1").text)
    let w2 = sanitize(page.getViewById("mw2").text)
    let w3 = sanitize(page.getViewById("mw3").text)
    let w4 = sanitize(page.getViewById("mw4").text)
    let w5 = sanitize(page.getViewById("mw5").text)
    let w6 = sanitize(page.getViewById("mw6").text)
    let w7 = sanitize(page.getViewById("mw7").text)
    let w8 = sanitize(page.getViewById("mw8").text)
    let w9 = sanitize(page.getViewById("mw9").text)
    let w10 = sanitize(page.getViewById("mw10").text)
    let w11 = sanitize(page.getViewById("mw11").text)
    let w12 = sanitize(page.getViewById("mw12").text)

    var mnemonic = w1 + " " + w2 + " " + w3 + " " + w4 + " " + w5 + " " + w6 + " " + w7 + " " + w8 + " " + w9 + " " + w10 + " " + w11 + " " + w12

    if (w1 === "" ||
        w2 === "" ||
        w3 === "" ||
        w4 === "" ||
        w5 === "" ||
        w6 === "" ||
        w7 === "" ||
        w8 === "" ||
        w9 === "" ||
        w10 === "" ||
        w11 === "" ||
        w12 === ""){ dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.kindlyEnterAllWords, okButtonText: globalVars.messageObjects.Ok}); return }

    let isMnemonicValid = bip39.validateMnemonic(mnemonic);

    if (isMnemonicValid) {

        dialogs.alert({ title: globalVars.messageObjects.success, message: globalVars.messageObjects.mnemonicsVerifiedMsg, okButtonText: globalVars.messageObjects.Ok }).then(async function () {

            page.getViewById("info").text = globalVars.messageObjects.synchronizing

            page.getViewById("nextBtn").isUserInteractionEnabled = false;
            page.getViewById('mw1').isUserInteractionEnabled = false;
            page.getViewById('mw2').isUserInteractionEnabled = false;
            page.getViewById('mw3').isUserInteractionEnabled = false;
            page.getViewById('mw4').isUserInteractionEnabled = false;
            page.getViewById('mw5').isUserInteractionEnabled = false;
            page.getViewById('mw6').isUserInteractionEnabled = false;
            page.getViewById('mw7').isUserInteractionEnabled = false;
            page.getViewById('mw8').isUserInteractionEnabled = false;
            page.getViewById('mw9').isUserInteractionEnabled = false;
            page.getViewById('mw10').isUserInteractionEnabled = false;
            page.getViewById('mw11').isUserInteractionEnabled = false;
            page.getViewById('mw12').isUserInteractionEnabled = false;

            
            acti.set("isLoading",true)
       
            await new Promise(resolve => setTimeout(resolve, 1000));
            //save mnemonics
            walletManager.saveMnemonics(mnemonic,page.navigationContext.info)
            await walletManager.restoreWallet(mnemonic)
            await acti.set("isLoading",false)

           page.getViewById("nextBtn").isUserInteractionEnabled = true;
   

           await  dialogs.alert({ title: globalVars.messageObjects.success, message: globalVars.messageObjects.walletRestoredSuccessfully, okButtonText: globalVars.messageObjects.Ok })

            //and finally go to dashboard
            page.navigationContext.info = "**********"
            mnemonic = "**********************************"

           frameModule.topmost().navigate({
               moduleName:globalVars.navigation.dashboard,
               animated:true,
               transition:globalVars.transitions.slideLeft
           })
        })
    }
    else {
        dialogs.alert({ title: globalVars.messageObjects.error, message: globalVars.messageObjects.mnemonicErrorMsg, okButtonText:globalVars.messageObjects.Ok})
    }
}

function sanitize(word) {

    //convert to lowercase from upper case if any
    //remove any unwated space and/or characters
    let p = String(word).toLowerCase();
    p.replace(/\s+/g, '')
    let q="";

    for(let i = 0; i < p.length; i++){
        if(p[i].match(/[a-z]/i)){
            q += p[i]
        }
    }

    return q
}
