const frameModule = require("tns-core-modules/ui/frame");
const globalVars = require("../../globalVars")
var insomnia = require("nativescript-insomnia");
var orientationModule = require("nativescript-screen-orientation");
const app = require("tns-core-modules/application")

var page;

exports.pageLoaded = function (args) {

    page = args.object;
    orientationModule.setCurrentOrientation("portrait");

    context = page.navigationContext;
    page.getViewById("actionBar").title = globalVars.messageObjects.faq

    if (globalVars.getCurrentLanguage() === globalVars.langList.english) {
        setEnglishTC()
    }
    else if (globalVars.getCurrentLanguage() === globalVars.langList.chinese) {
        setChineseTC()
    }



    if (page.ios) {
        frameModule.topmost().ios.controller.visibleViewController.navigationItem.setHidesBackButtonAnimated(true, false);
    }
    else if (page.android) {
        let activity = app.android.startActivity ||
            app.android.foregroundActivity ||
            frameModule.topmost().android.currentActivity ||
            frameModule.topmost().android.activity

        //This is how android back button can be overriden
        activity.onBackPressed = function () {
            frameModule.topmost().navigate({
                moduleName: globalVars.navigation.settings,
                animated: true,
                transition: globalVars.transitions.slideRight
            })
        }
    }

    insomnia.keepAwake();

};

exports.backClicked = function () {
    frameModule.topmost().navigate({
        moduleName: globalVars.navigation.settings,
        animated: true,
        transition: globalVars.transitions.slideRight
    })
}


//set terms and conditions in english
var setEnglishTC = function () {
    page.getViewById("text0").text = "1. Is the FAB Mobile Wallet ideal for me?\nThe FAB Mobile Wallet is a BETA version and there will be frequent updates.  There may be potential bugs that will need to be resolved before it becomes stable. We encourage use of the FAB Mobile Wallet; we use it internally ourselves. We welcome all valuable feedback from our users. However, if you are an advanced (high volume/high value transactions) user, the FAB Mobile Wallet in its current state may not be right for you. For advanced users, the full node wallet is recommended. The full node wallet can be found at fabcoin.pro.\n\n2. Does the wallet support address QR Code generation and scanning?\nYes, The wallet does support address QR Code generation and scanning. In order to use this functionality, you must allow the use of camera.\n\n3. Is FAB Mobile Wallet Secure?\nThe FAB Mobile Wallet does not store any private keys and no user data is ever stored on our servers. Your private key is generated as needed from a seed which is encrypted and stored locally along with your addresses and Unspent Transaction Outputs (UTXOs). FAB Mobile Wallet is still in BETA: while we are not aware of any security vulnerabilities, there could possibly be undiscovered ones. The source code of our wallet is open to the public and can be viewed on GitHub. We welcome all feedback from our users and community members!\n\n4. How can I backup my wallet?\nYou should write down the 12 mnemonic words in the same order as they are displayed and keep them in a safe and secure place. If later on you want to restore the same wallet, you can use these mnemonic words.\n\n5. Do I absolutely need to save the mnemonic words?\nYes. You must write down the 12 mnemonic words on paper and store it in a safe and secure place. Make sure to write down the mnemonic words in the same order as they are displayed.\nWe advise against taking screenshots of the mnemonic words in case your phone is lost or stolen.  The wallet application is currently in BETA and more updates will be coming in the future. At the time of update, you may be asked for the mnemonic words for security reasons.\n\n6. How do I receive FABcoins into my Wallet?\nFrom dashboard, tap ‘Receive FABcoins’. On the ‘Receive FABcoins’ screen, you can see the address and copy it using the ‘Copy Address’ button. You can then supply this address to the sender to receive FABcoins.  If you expect to receive FABcoins, you should click on the refresh button on the dashboard.\n\n7. How long should it take to receive FABcoins?\nAfter a transaction is submitted by the sender, it can take anywhere between 2 to 10 minutes for the receiver to receive FABcoins. If you expect to receive FABcoins, you should click on the refresh button on the dashboard. If this doesn’t work, go to ‘Settings’ and click ‘Synchronize.’\nHowever, depending upon network traffic and other factors, it may take longer.\n\n8. How do I send FABcoins?\nFrom the dashboard, tap ‘Send FABcoins’. On the ‘Send FABcoins’ screen, you can type or paste the receiver’s address. You can specify the amount you wish to send. The amount must be greater than 0 and less than the spendable balance.\n\n9. How is the transaction fee calculated?\nIn the Beta version of the wallet, the transaction fee is set to 0.00003000 FABcoin for each transaction.\n\n10. Why is my current balance and spendable balance different?\nIf the option “Deduct Transaction Fee From Send Amount” is disabled, the transaction fee will be paid by the sender. In this case, the spendable balance will be less than the current balance.\n\n11. My wallet isn’t showing the correct balance. What should I do?\nYou can click on the ‘Synchronize’ button which will update your wallet with the most recent balance.\n\n12. I am unable to send FABcoins. What should I do?\nFirst, verify that you have a stable internet connection.\nThe next step is to retry synchronizing. In some instances if your wallet does not have correct UTXOs, transactions will not be sent. To avoid this, go to ‘Settings” tap ‘Synchronize’ and try again.\n\n13. Can I cancel my transaction? \nDue to the nature of blockchain, all transactions are irreversible. \n\n14. If my mobile device is crashed or if I get a new phone, how do I get access to my FAB Wallet?\nIf you get a new phone, make sure to delete the wallet from your old device first by going to  ‘Settings’ -> ‘Delete Wallet’ and then uninstalling the application.\nYou can reinstall the FAB Mobile Wallet application on your new device and choose menu option ‘Restore Wallet’ on the welcome screen. In the ‘Restore Wallet’ mode, once you set up your password, you can enter the 12 mnemonic words from your previous device in the same order as they were presented to you. The wallet will then generate the required number of addresses and update the balance.\n\n15. Why does the Light Wallet automatically close down?\nFor security reasons, the light wallet is designed to shut down after 30 minutes of inactivity.\n\n16. I am having technical issues, who can I contact for support? \nFor all technical issues, email info@fabcoin.co . \n\n17. What kind of software license does the wallet have?\nOur wallet is free and open source software, licensed  under the Apache 2.0 license. You are free to use, share and modify the wallet and its source code. The full text of the Apache 2.0 license can be found at https://www.apache.org/licenses/LICENSE-2.0\n\n\nPrivacy Policy\nUser privacy is of utmost importance to us. The FAB Wallet is designed around the industry standard privacy and security principles.\nFAB wallet follows the Hierarchical Deterministic Wallet guidelines. While setting up the wallet, a mnemonic seed is randomly generated, encrypted and saved locally. The user MUST write down these words, verify them and keep them in a safe and secure place. We do not receive this information. If the user loses the mnemonic seed, we have no way to recover the wallet.\nAll data, including addresses, transaction history, and address balances are stored locally in the user’s mobile device. Sensitive information is appropriately hashed or encrypted before saving.\nNo personally identifiable information is ever sent to our servers. The application communicates with the FAB API for sending Transactions and querying purposes only.\nThe FAB Wallet does not keep any personally identifiable information. The password set up by the user is used for encryption purposes and MUST be protected by the user. We do not receive your password in any form and we have no way to recover or reset it if you forget your password."
}

//set terms and conditions in Chinese
var setChineseTC = function () {
    page.getViewById("text0").text = "1. FAB手机钱包是否适合我？\nFAB移动钱包是BETA版本。在变得稳定之前，有可能需要修复一些潜在的故障。我们鼓励使用FAB手机钱包; 我们自己在内部使用它。我们欢迎来自用户的所有宝贵意见。但是，如果您是高级用户（拥有非常多FAB），则当前状态下的FAB移动钱包可能不适合您。对于高级用户，建议使用完整节点钱包。完整的节点钱包可以在fabcoin.pro找到。\n\n2. 钱包是否支持QR码生成和扫描？\n本钱包支持二维码的生成和扫描，使用本功能需要你允许访问照相功能。\n\n3. FAB手机钱包安全吗？\nFAB移动钱包不存储任何私钥，也不会在我们的服务器上存储任何用户数据。您的私钥是根据需要从种子生成的，该种子在本地加密并与您的地址和UTXO一起存储。 FAB移动钱包仍然在BETA中：虽然我们不知道任何安全漏洞，但可能还有未被发现的漏洞。我们钱包的源代码向公众开放，可以在GitHub上查看。我们欢迎来自用户和社区成员的所有反馈！\n\n4. 我该如何备份我的钱包？\n您需要按照显示的顺序记下12个助记词，并将它们保存在安全可靠的地方。如果以后要恢复相同的钱包，可以使用这些助记词。\n\n5. 我是否绝对需要保存助记词？\n是。您必须在纸上写下12个记忆词并将其存放在安全可靠的地方。确保按照显示的顺序记下助记词。\n我们建议您不要拍摄助记词的屏幕截图，以防手机丢失或被盗。钱包应用程序目前在BETA中，将来会有更多更新。在更新时，出于安全原因，可能会要求您输入助记词。\n\n6. 如何将FAB币收入我的电子钱包？\n在仪表板中，点按“接收FAB币”。在“接收FABcoin”屏幕上，您可以看到地址并使用“复制地址”按钮进行复制。然后，您可以将此地址提供给发件人以接收FAB币。\n\n7. 接收FABcoins需要多长时间？\n在发件人提交交易后，接收者可能需要2到10分钟才能接收FAB币。如果您发送或希望接收fabcoins，则应单击仪表板上的刷新按钮。并且您的余额不反映交易，转到您的设置并点击“同步”，交易应该更新。\n但是，根据网络流量和其他因素，可能需要更长时间。\n\n8. 我如何发送FAB币？\n在信息中心，点击“发送FAB币”。在“发送FABcoins”屏幕上，您可以键入或粘贴接收者的地址。您可以输入要发送的金额。金额必须大于0且小于可支配余额。\n\n9. 如何计算交易费？\n在钱包的Beta版本中，每笔交易的交易费用设置为0.00003000 FABcoin。\n\n10. 为什么我目前的余额和可用余额不同？\n如果禁用“从发送金额扣除交易费”选项，交易费将由发件人支付。在这种情况下，可支配余额将小于当前余额。\n\n11. 我的钱包没有显示正确的余额。我该怎么办？\n您可以点击“同步”按钮，该按钮将使用最新余额更新您的钱包。\n\n12. 我无法发送FAB币。我该怎么办？\n首先，确认您有稳定的互联网连接。\n下一步是重试同步。在某些情况下，如果您的钱包没有正确的UTXO，则不会发送交易。要避免这种情况，请点按“同步”，然后重试。\n\n13. 我可以取消交易吗？\n由于区块链的性质，所有交易都是不可逆转的。\n\n14. 如果我的手机丢失或者我有新手机，我如何才能访问我的FAB钱包？\n如果您有新手机，请先从设置中删除钱包 -->删除钱包，然后从旧手机中卸载该应用程序。\n您可以重新安装FAB Mobile Wallet应用程序，并在首页上选择菜单选项“Restore Wallet”。在“恢复电子钱包”模式下，设置好了密码，您就可以按照提供给您的顺序输入之前设备中的12个助记词。然后钱包将生成所需数量的地址并更新余额。\n\n15. 为什么Light Wallet会自动关闭？\n出于安全原因，轻型钱包设计为在30分钟无任何操作后自动关闭。\n\n16. 我遇到技术问题，我可以联系谁寻求支持？\n所有有关技术的问题，请发送电子邮件至info@fabcoin.co。\n\n17. 该钱包有什么软件许可证？\n我们的钱包是免费的开源软件，根据Apache 2.0许可证授权。 您可以自由使用，共享和修改钱包及其源代码。 可以在https://www.apache.org/licenses/LICENSE-2.0上找到Apache 2.0许可证的全文。0\n\n\n隐私权政策\n用户隐私对我们至关重要。 FAB钱包是围绕行业标准隐私和安全原则设计的。\nFAB钱包遵循Hierarchical Deterministic Wallet指南。在设置钱包时，会随机生成，加密并在本地保存助记词。用户必须写下这些单词，验证它们并将它们保存在安全可靠的地方。我们不会收到此信息。如果用户丢失助记符种子，我们无法恢复钱包。\n所有数据（包括地址，交易历史记录和地址余额）都本地存储在用户的移动设备中。在保存之前，将对敏感信息进行适当的进行哈希运算或加密。\n我们的服务器不会发送任何个人身份信息。应用程序与FAB API通讯，且仅用于发送交易和查询目的。\nFAB钱包不会保留任何个人身份信息。用户设置的密码用于加密目的，必须由用户保护。我们不会以任何形式收到您的密码，如果您忘记了密码，我们无法恢复或重置密码。"
}