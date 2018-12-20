const fs = require('fs-extra');
const config = require('config');
const path = require('path');
const async = require('async');

const mediaRoot = path.join(__dirname, '../','media');
const masterfilesRoot = path.join(mediaRoot, 'masterfiles')

module.exports = new (function() {

    var _self = this;

    //Get's newest master file title -> file
    //callback returns null on error
    this.Get = function(system, type, callback) {

        var dir = path.join(masterfilesRoot, system, type);

        try {
            var files = fs.readdirSync(dir);
        }
        catch (e) {
            return callback(null);
        }

        //empty dir catch
        if (files.length == 0) {
            return callback(null);
        }

        //the last file is the newest and the one to use
        fs.readJson(path.join(dir, files[files.length -1]), (err, content) => {
            if (err) return callback(null);
            return callback(content);
        });
    };

    this.CreateRomsMasterFile = function(system, tableData, callback) {

        var currentDatFile = config.get('systems.' + system + '.datFile');
        var timestamp = + new Date();
        var filePath = path.join(masterfilesRoot, system, 'roms', timestamp + '.json');

        var content = {
            createdOn: new Date, //human readable
            originDatFile: currentDatFile,
            data: tableData
        };

        fs.outputJson(filePath, content, err => {
            if (err) {
                return callback(err);
            }
            return callback();
        });
    };

    this.CreateBoxesMasterFile = function(system, type, tableData, callback) {

        var timestamp = + new Date();
        var filePath = path.join(masterfilesRoot, system, 'boxes-' + type, timestamp + '.json');

        var content = {
            createdOn: new Date, //human readable
            data: tableData
        };

        fs.outputJson(filePath, content, err => {
            if (err) {
                return callback(err);
            }
            return callback();
        });
    };
});
