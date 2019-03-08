const nodeify = require("nativescript-nodeify");
const globalVars = require("./globalVars")
const sqlite = require("nativescript-sqlite")


var clearTable = function (tableName) {
    if (tableExists(tableName)) {
        new sqlite(globalVars.databaseObjects.name, function (err, db) {
            db.execSQL("DELETE FROM " + tableName)
        })
    }
}

var createPasswordTable = async function () {


    if (tableExists(globalVars.databaseObjects.passwordTable.name)) {
        dropTable(globalVars.databaseObjects.passwordTable.name)
    }

    await new sqlite(globalVars.databaseObjects.name, function (err, db) {

        db.execSQL("CREATE TABLE IF NOT EXISTS Pass (id INTEGER PRIMARY KEY, pass TEXT)", [], function (err) {
            if (err) throw (err)
        })
    })

    return
}

var createPINTable = async function () {

    if (tableExists(globalVars.databaseObjects.pinTable.name)) {
        dropTable(globalVars.databaseObjects.pinTable.name)
    }

    await new sqlite(globalVars.databaseObjects.name, function (err, db) {

        db.execSQL("CREATE TABLE IF NOT EXISTS Pin (id INTEGER PRIMARY KEY, pin TEXT)", [], function (err) {
            if (err) throw (err)

        })
    })

    return
}

var createUtxoTable = async function () {

    await new sqlite(globalVars.databaseObjects.name, function (err, db) {
        db.execSQL("CREATE TABLE  UtxoTable (id INTEGER PRIMARY KEY ASC,Type TEXT ,AddressIndex INTEGER, TxId TEXT, TxIdx INTEGER,Amount TEXT,Height INTEGER,Confirmations INTEGER)", [], function (err) {
            if (err) throw (err)

        })
    })

    return
}

var createSpentBufferTable = async function () {

    if (!tableExists(globalVars.databaseObjects.spentBufferTable.name)) {

        await new sqlite(globalVars.databaseObjects.name, function (err, db) {

            db.execSQL("CREATE TABLE SpentBufferTable (id INTEGER PRIMARY KEY ASC,Type TEXT ,AddressIndex INTEGER, TxId TEXT, UtxoTxId TEXT, TxIdx INTEGER,Amount TEXT,Height INTEGER,Confirmations INTEGER)", [], function (err) {
                if (err) throw (err)

            })
        })

        return
    }


}

var createAddressIndexTable = async function () {

    if (!tableExists(globalVars.databaseObjects.addressIndexTable.name)) {

        await new sqlite(globalVars.databaseObjects.name, function (err, db) {
            db.execSQL("CREATE TABLE  AddressIndex (id INTEGER PRIMARY KEY ASC,type TEXT , idx INTEGER)", [], function (err) {
                if (err) throw (err)

            })

            db.execSQL("INSERT INTO AddressIndex (id,type, idx) VALUES (?,?,?)", [0, globalVars.databaseObjects.addressIndexTable.changeTypeName, 0], function (err, id) {
                if (err) throw (err)

            })

            db.execSQL("INSERT INTO AddressIndex (id,type, idx) VALUES (?,?,?)", [1, globalVars.databaseObjects.addressIndexTable.receiveTypeName, 0], function (err, id) {
                if (err) throw (err)

            })
        })

        return
    }
}

var createTxHistoryTable = async function () {

    if (!tableExists(globalVars.databaseObjects.TransactionHistoryTable.name)) {

        new sqlite(globalVars.databaseObjects.name, function (err, db) {
            db.execSQL("CREATE TABLE TransactionHistory (id INTEGER PRIMARY KEY ASC, Type TEXT, Date TEXT, Amount TEXT, TxFee TEXT, TxId TEXT, SentTo TEXT,Confirmations INTEGER,Comment TEXT)", function (err) {//Comment TEXT
                if (err) throw (err)
            })
        })

        return
    }
}

var createTokenHistoryTable = async function() {

    console.log("in create token history table")

    if(!tableExists(globalVars.databaseObjects.tokenHistoryTable.name)) {
        new sqlite(globalVars.databaseObjects.name, function(err,db) {
            db.execSQL("CREATE TABLE TokenHistory (id INTEGER PRIMARY KEY ASC, TokenName TEXT, TokenAmount TEXT, FabcoinAmount TEXT, TxType TEXT, TxId TEXT, ToAddress TEXT, Time TEXT)", function(err) { if (err){ console.log(err); throw err;}})

            if(err) throw err;
        })
    }
}

var createEncMnTable = function () {

}

var createChangeAddressTable = async function () {

    
    //isused - 0 is false, 1 is true
    if (!tableExists(globalVars.databaseObjects.ChangeAddressTable.name)) {
        await new sqlite(globalVars.databaseObjects.name, function (err, db) {
            db.execSQL("CREATE TABLE ChangeAddressList (Idx INTEGER PRIMARY KEY,Address TEXT, IsUsed INTEGER)", function (err) {
                if (err) throw (err)

            })
        })
        return
    }
}


var createReceiveAddressTable = async function () {
    //isused - 0 is false, 1 is true
    if (!tableExists(globalVars.databaseObjects.ReceiveAddressTable.name)) {
        await new sqlite(globalVars.databaseObjects.name, function (err, db) {
            db.execSQL("CREATE TABLE ReceiveAddressList (Idx INTEGER PRIMARY KEY,Address TEXT, IsUsed INTEGER)", function (err) {
                if (err) throw (err)

            })
        })
        return;
    }
}

var createMyTokenTable = function() {
    if(!tableExists(globalVars.databaseObjects.myTokensTable.name)){
        new sqlite(globalVars.databaseObjects.name, function(err,db) { //token amount can be a floating point
            db.execSQL("CREATE TABLE MyTokens (id INTEGER PRIMARY KEY,ContractAddress TEXT, LocalWalletAddress TEXT, TokenName TEXT, TokenSymbol TEXT, Balance TEXT)",function(err){
                if(err) throw (err)
            })
        })
    }
}



var dropTable = async function (tableName) {

    if (tableExists(tableName)) {
        await new sqlite(globalVars.databaseObjects.name, function (err, db) {
            db.execSQL("DROP TABLE " + tableName, [], function (er) {
                if (er) throw (er)
            })
        })

        return
    }
}

//for debugging purposes only
var showTable = function (tableName) {
    if (tableExists(tableName)) {
        new sqlite(globalVars.databaseObjects.name, function (err, db) {
            db.all("SELECT * FROM " + tableName, function (err, rows) {
                rows.forEach(row => {
                    console.log(row)
                })
            })
        })
    }
}

//very dangerous - use it carefully
var dropAllTables = function () {

    dropTable(globalVars.databaseObjects.utxoTable.name)
    dropTable(globalVars.databaseObjects.passwordTable.name)
    dropTable(globalVars.databaseObjects.pinTable.name)
    dropTable(globalVars.databaseObjects.spentBufferTable.name)
    dropTable(globalVars.databaseObjects.addressIndexTable.name)
    dropTable(globalVars.databaseObjects.TransactionHistoryTable.name)
    dropTable(globalVars.databaseObjects.MnemonicTable.name)
    dropTable(globalVars.databaseObjects.ChangeAddressTable.name)
    dropTable(globalVars.databaseObjects.ReceiveAddressTable.name)
    dropTable(globalVars.databaseObjects.uuidTable.name)
    dropTable(globalVars.databaseObjects.myTokensTable.name)
    dropTable(globalVars.databaseObjects.tokenHistoryTable.name)
}

var listAllTables = function () {
    //list all tables
    //needed only for debugging
    new sqlite("fabPass.db", function (err, db) {
        db.all("SELECT name FROM sqlite_master WHERE type = 'table'", function (err, res) {
            console.log(res)
        })
    })
}

var listTableColumns = function (tableName) {

    let c = new Array()
    new sqlite("fabPass.db", function (err, db) {
        db.all("PRAGMA table_info(" + tableName + ")", function (err, res) {
            //   /console.log(res[][1])
            for (let i = 0; i < res.length; i++) {
                c.push(res[i][1])
            }
        })
    })

    return c
}

var updateTxHistoryTable = function () {

   // console.log(listTableColumns(globalVars.databaseObjects.TransactionHistoryTable.name))
    //showTable(globalVars.databaseObjects.passwordTable.name)
    //console.log(listTableColumns(globalVars.databaseObjects.TransactionHistoryTable.name))
    let t = listTableColumns(globalVars.databaseObjects.TransactionHistoryTable.name)
    if (t.length === 8) {
        console.log("hee")

        let tmp = new Array()

        new sqlite(globalVars.databaseObjects.name, function (err, db) {
            db.all("SELECT * FROM " + globalVars.databaseObjects.TransactionHistoryTable.name, function (err, rows) {
                rows.forEach(row => {
                    tmp.push(row)
                })
            })
        })

        dropTable(globalVars.databaseObjects.TransactionHistoryTable.name)

    
        createTxHistoryTable()

        new sqlite(globalVars.databaseObjects.name, function (err, db) {

            for (let i = 0; i < tmp.length; i++) {
                db.execSQL("INSERT INTO TransactionHistory (Type,Date,Amount,TxFee,TxId,SentTo,Confirmations,Comment) VALUES (?,?,?,?,?,?,?,?)", [tmp[i][1], tmp[i][2], tmp[i][3], tmp[i][4], tmp[i][5], tmp[i][6], tmp[i][7], "None"], function (err) {
                    throw (err)
                })
            }
        })



        new sqlite("fabPass.db", function (err, db) {
            db.execSQL("ALTER TABLE " + globalVars.databaseObjects.TransactionHistoryTable.name + " ADD COLUMN Comment TEXT DEFAULT 'None'", function (err, res) {
                if (err) throw (err)
            })
        })
    }
    else {
        return
    }

}

var tableExists = function (tableName) {

    var tmp = false;

    new sqlite("fabPass.db", function (err, db) {
        db.get("SELECT count(*) FROM sqlite_master WHERE type = 'table' AND name = ?", [tableName], function (err, table) {

            if (err !== null) {
                tmp = false
            }
            if (Number(table) === 0) {
                tmp = false
            }

            if (Number(table) === 1) {
                tmp = true
            }
        })
    })

    return tmp
}

exports.tableExists = tableExists;
exports.createPasswordTable = createPasswordTable;
exports.createPINTable = createPINTable;
exports.createUtxoTable = createUtxoTable;
exports.createSpentBufferTable = createSpentBufferTable;
exports.createAddressIndexTable = createAddressIndexTable;
exports.createTxHistoryTable = createTxHistoryTable;
exports.createEncMnTable = createEncMnTable;
exports.createChangeAddressTable = createChangeAddressTable;
exports.createReceiveAddressTable = createReceiveAddressTable;
exports.dropTable = dropTable;
exports.showTable = showTable;
exports.dropAllTables = dropAllTables;
exports.listAllTables = listAllTables;
exports.clearTable = clearTable;
exports.listTableColumns = listTableColumns;
exports.updateTxHistoryTable = updateTxHistoryTable;
exports.createMyTokenTable = createMyTokenTable;
exports.createTokenHistoryTable = createTokenHistoryTable;
