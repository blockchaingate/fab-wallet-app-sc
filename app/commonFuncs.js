const sqlite = require("nativescript-sqlite");

var tableExists = function (tableName) {

    var tmp = false;

    //list all tables
    //needed only for debugging
    new sqlite("fabPass.db", function (err, db) {
        db.all("SELECT name FROM sqlite_master WHERE type = 'table'", function (err, res) {
          
        })
    })

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