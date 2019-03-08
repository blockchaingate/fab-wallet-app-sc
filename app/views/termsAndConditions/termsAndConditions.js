const frameModule = require("tns-core-modules/ui/frame");
const globalVars = require("../../globalVars")
const walletManager = require("../../walletManager")
var insomnia = require("nativescript-insomnia");
var orientationModule = require("nativescript-screen-orientation");
const app = require("tns-core-modules/application")

var page;

exports.pageLoaded = function (args) {

    page = args.object;
    orientationModule.setCurrentOrientation("portrait");

    context = page.navigationContext;
    page.getViewById("actionBar").title = globalVars.messageObjects.termsAndConditions

    if (globalVars.getCurrentLanguage() === globalVars.langList.english) {
        setEnglishTC()
    }
    else if (globalVars.getCurrentLanguage() === globalVars.langList.chinese) {
        setChineseTC()
    }

    page.getViewById("agreeButton").text = globalVars.messageObjects.iAgreeToTermsAndConditions
    page.getViewById("cancelButton").text = globalVars.messageObjects.cancel


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
                moduleName: globalVars.navigation.chooseLanguage,
                animated: true,
                transition: globalVars.transitions.slideRight
            })
        }
    }
    insomnia.keepAwake();

};

exports.agreeClicked = function () {
    //after user agrees to the terms and conditions, go to welcome page
    frameModule.topmost().navigate({
        moduleName: globalVars.navigation.welcomePage,
        animated: true,
        transition: globalVars.transitions.slideLeft
    })
}

exports.cancelClicked = function () {

    walletManager.exit();
}

//set terms and conditions in english
var setEnglishTC = function () {
    page.getViewById("text0").text = "This is a binding agreement between the FAB Foundation  and the person, persons, or entity (“you” or “your”) using the service, Software, or application (“Software”).\n\nFAB Wallet Software is provided solely on the terms and conditions set forth in this Agreement and on the condition that you accept and comply with them. By using the Software, you (a) accept this agreement and agree that you are legally bound by its terms; and (b) represent and warrant that: (i) You are of legal age to enter into a binding agreement; and (ii) if you are a corporation, governmental organization or other legal entity, you have the right, power and authority to enter into this Agreement on behalf of the corporation, governmental organization or other legal entity and bind them to these terms.\n\nThis Software functions as a free and open source digital wallet. The Software does not constitute an account where the FAB Foundation or other third parties serve as financial intermediaries or custodians of Your FABcoins.\n\nAs the software is still in Beta and continues to be improved by feedback from the open-source user and developer community, the FAB Foundation cannot guarantee that the software will be free from bugs and/or security vulnerabilities. You acknowledge that your use of this Software is at your own discretion and in compliance with all applicable laws. You are responsible for safekeeping your password, seed, PIN, and any other codes you use to access the Software.\n\nIf you lose access to your wallet and you have not separately stored a backup of your seed words, you acknowledge and agree that any FABcoin you have associated with that wallet will become inaccessible.\n\nAll transaction requests are irreversible. The authors of the Software, employees and affiliates of the FAB Foundation, copyright holders, and partners cannot retrieve your private keys or passwords if You lose or forget them and cannot guarantee transaction confirmation as they do not have control over the network.\n\nIn case of loss or theft, accidental or otherwise, the authors of the Software, employees and affiliates of the FAB Foundation, copyright holders, and partners cannot be held liable.\n\nThe FAB Wallet is provided \"as is\", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose and non-infringement. In no event shall the authors of the software, employees and affiliates of the FAB Foundation, copyright holders, or partners be liable for any claim, damages or other liability, whether in an action of contract, tort or otherwise, arising from, out of or in connection with the software or the use or other dealings in the software.\n\nIn no event will the FAB Foundation or its affiliates, or any of its or their respective service providers, be liable to you or any third party for any use, interruption, delay or inability to use the software, lost revenues or profits, delays, interruption or loss of services, business or goodwill, loss or corruption of data, loss resulting from system or system service failure, malfunction or shutdown, failure to accurately transfer, read or transmit information, failure to update or provide correct information, system incompatibility or provision of incorrect compatibility information or breaches in system security, or for any consequential, incidental, indirect, exemplary, special or punitive damages, whether arising out of or in connection with this agreement, breach of contract, tort (including negligence) or otherwise, regardless of whether such damages were foreseeable and whether or not we were advised of the possibility of such damages.\n\n\nPrivacy Policy\nUser privacy is of utmost importance to us. The FAB Wallet is designed around the industry standard privacy and security principles.\nFAB wallet follows the Hierarchical Deterministic Wallet guidelines. While setting up the wallet, a mnemonic seed is randomly generated, encrypted and saved locally. The user MUST write down these words, verify them and keep them in a safe and secure place. We do not receive this information. If the user loses the mnemonic seed, we have no way to recover the wallet.\nAll data, including addresses, transaction history, and address balances are stored locally in the user’s mobile device. Sensitive information is appropriately hashed or encrypted before saving.\nNo personally identifiable information is ever sent to our servers. The application communicates with the FAB API for sending Transactions and querying purposes only.\nThe FAB Wallet does not keep any personally identifiable information. The password set up by the user is used for encryption purposes and MUST be protected by the user. We do not receive your password in any form and we have no way to recover or reset it if you forget your password."
}

//set terms and conditions in Chinese
var setChineseTC = function () {
    page.getViewById("text0").text = "这是FAB基金会与使用服务，软件或应用程序（“软件”）的个人，个人或实体（“您”或“您的”）之间的约束性协议。\n\nFAB钱包软件仅根据本协议中规定的条款和条件提供，条件是您接受并遵守这些条款和条件。通过使用本软件，您（a）接受本协议并同意您受其条款的法律约束;及（b）声明及保证：（i）您达成具约束力协议的法定年龄; （ii）如果您是公司，政府组织或其他法律实体，您有权代表公司，政府组织或其他法律实体签订本协议，并将其约束于这些条款。\n\n该软件可用作免费和开源数字钱包。本软件不构成FAB基金会或其他第三方作为您的FAB币的金融中介或托管人的账户。\n\n由于该软件仍处于测试阶段并且继续通过开源用户和开发人员社区的反馈进行改进，因此FAB Foundation无法保证软件不会出现错误和/或安全漏洞。您承认您对本软件的使用由您自行决定并遵守所有适用法律。您有责任妥善保管密码，种子，PIN以及用于访问本软件的任何其他代码。\n\n如果您无法访问自己的钱包并且没有单独存储种子词的备份，则表示您承认并同意您与该钱包相关联的任何FAB币都将无法访问。\n\n所有交易请求都是不可逆转的。本软件的作者，FAB基金会的员工和附属机构，版权所有者和合作伙伴如果您丢失或忘记了私钥或密码，则无法检索您的私钥或密码，并且无法保证交易确认，因为他们无法控制网络。\n\n如果丢失或被盗，无意或无意，本软件的作者，FAB基金会的员工和附属机构，版权所有者和合作伙伴均不承担任何责任。\n\nFAB钱包“按原样”提供，没有任何明示或暗示的担保，包括但不限于适销性，适用于特定用途和不侵权的担保。在任何情况下，软件的作者，FAB基金会的员工和附属机构，版权所有者或合作伙伴均不对任何索赔，损害赔偿或其他责任承担责任，无论是在合同，侵权或其他方面，由于或与软件或软件中的使用或其他交易有关。\n\n在任何情况下，FAB基金会或其附属公司或其任何或其各自的服务提供商均不对您或任何第三方对任何使用，中断，延迟或无法使用该软件，收入或利润损失，延迟，中断或丢失服务，业务或商誉，数据丢失或损坏，系统或系统服务故障导致的损失，故障或关机，无法准确传输，读取或传输信息，无法更新或提供正确信息，系统不兼容或提供不正确的兼容性信息或违反系统安全性，或因任何因本协议，违反合同，侵权（包括疏忽）或其他原因引起或与之相关的任何间接，偶然，间接，示范，特殊或惩罚性损害，无论此类损害是否可预见，以及我们是否被告知可能发生此类损害。\n\n\n隐私权政策\n用户隐私对我们至关重要。 FAB钱包是围绕行业标准隐私和安全原则设计的。\nFAB钱包遵循Hierarchical Deterministic Wallet指南。在设置钱包时，会随机生成，加密并在本地保存助记词。用户必须写下这些单词，验证它们并将它们保存在安全可靠的地方。我们不会收到此信息。如果用户丢失助记符种子，我们无法恢复钱包。\n所有数据（包括地址，交易历史记录和地址余额）都本地存储在用户的移动设备中。在保存之前，将对敏感信息进行适当的进行哈希运算或加密。\n我们的服务器不会发送任何个人身份信息。应用程序与FAB API通讯，且仅用于发送交易和查询目的。\nFAB钱包不会保留任何个人身份信息。用户设置的密码用于加密目的，必须由用户保护。我们不会以任何形式收到您的密码，如果您忘记了密码，我们无法恢复或重置密码。"
}