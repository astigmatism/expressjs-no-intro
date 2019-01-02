const fs = require('fs-extra');
const path = require('path');
const config = require('config');
const parseString = require('xml2js').parseString;
const junk = require('junk');

const mediaRoot = path.join(__dirname, '../','data');
const datRoot = path.join(mediaRoot, '/dats');

module.exports = new (function() {

    var _self = this;

    this.GetSystemsWithDat = function(system, type) {
        var systems = {};
        fs.readdirSync(datRoot).forEach(dir => {
            if (fs.statSync(path.join(datRoot, dir)).isDirectory()) {
                var datFiles = fs.readdirSync(path.join(datRoot, dir)).filter(fn => fn.endsWith('.dat'));

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

    this.GetNewestFile = function(system) {

        var dir = path.join(datRoot, system);

        try {
            var files = fs.readdirSync(dir);
        }
        catch (e) {
            return null;
        }

        files = files.filter(junk.not); //removes DS_Store

        //empty dir catch
        if (files.length == 0) {
            return null;
        }

        return files[files.length - 1];
    };

    this.ParseLatest = function(system, callback) {

        var currentDatFile = this.GetNewestFile(system);

        if (!currentDatFile) {
            return callback('no dat files');
        }

        var datFilePath = path.join(datRoot, system, currentDatFile); //always take last file as most recent??
        var xml = fs.readFileSync(datFilePath, 'utf8');

        parseString(xml, function (err, result) {
            if (err) return callback(err);

            //we're expecting a specific structure
            if (!result.hasOwnProperty('datafile')) return callback('invalid dat structure 0');
            if (!result.datafile.hasOwnProperty('game')) return callback('invalid dat structure 1');

            var data = [];

            result.datafile.game.forEach(item => {
                var details = item.rom[0].$;
                details.title = item.description[0];
                data.push(details);
            });

            return callback(null, currentDatFile, data);
        });
    };
});
