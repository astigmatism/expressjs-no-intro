const fs = require('fs-extra');
const config = require('config');
const path = require('path');
const async = require('async');

const Dat = require('./dats');

const dataRoot = path.join(__dirname, '../','data');
const datsRoot = path.join(dataRoot, 'dats');
const masterfilesRoot = path.join(dataRoot, 'masterfiles');

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
            return callback(content, files[files.length -1]);
        });
    };

    this.Exists = function(system, type) {
        
        var dir = path.join(masterfilesRoot, system, type);
        if (!fs.pathExistsSync(dir)) {
            return null;
        }
        return fs.readdirSync(dir).filter(fn => fn.endsWith('.json'));
    };

    this.GetSystemsFromDatDirectory = function(system, type) {
        var systems = {};
        fs.readdirSync(datsRoot).forEach(dir => {
            if (fs.statSync(path.join(datsRoot, dir)).isDirectory()) {
                var datFiles = fs.readdirSync(path.join(datsRoot, dir)).filter(fn => fn.endsWith('.dat'));

                systems[dir] = {
                    key: dir,
                    datFiles: [],
                    name: ''
                }

                if (datFiles) { 
                    
                    systems[dir].datFiles = datFiles;
                    
                    //we can also surmise a name from the dat filename
                    var name = datFiles[0].split('.').slice(0, -1).join('.'); //also removes file ext
                    name = name.replace(/\([\d-]*\)/g, '');
                    systems[dir].name = name.trim();
                }
            }
        });
        return systems;
    };

    this.CreateRomsMasterFile = function(system, tableData, callback) {

        var currentDatFile = Dat.GetNewestFile(system);
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

    this.CreateScreensMasterFile = function(system, type, tableData, callback) {

        var timestamp = + new Date();
        var filePath = path.join(masterfilesRoot, system, 'screens-' + type, timestamp + '.json');

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
