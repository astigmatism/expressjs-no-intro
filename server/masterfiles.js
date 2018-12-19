const fs = require('fs-extra');
const config = require('config');
const path = require('path');

const mediaRoot = path.join(__dirname, '../','media');
const masterfilesRoot = path.join(mediaRoot, 'masterfiles')

module.exports = new (function() {

    var _self = this;

    //Get's newest master file title -> file
    this.Get = function(system, callback) {

        var dir = path.join(masterfilesRoot, system);

        try {
            var files = fs.readdirSync(dir);
        }
        catch (e) {
            return callback(e.message);
        }

        //the last file is the newest and the one to use
        fs.readJson(path.join(masterfilesRoot, system, files[files.length -1]), (err, content) => {
            if (err) return callback(err);
            return callback(null, content);
        });
    };

    this.CreateMasterFile = function(system, tableData, callback) {

        var currentDatFile = config.get('systems.' + system + '.datFile');
        var timestamp = + new Date();
        var filename = path.join(masterfilesRoot, system, timestamp + '.json');

        var content = {
            createdOn: new Date, //human readable
            originDatFile: currentDatFile,
            data: tableData
        };

        fs.outputJson(filename, content, err => {
            if (err) {
                return callback(err);
            }
            return callback();
        });
    };
});
