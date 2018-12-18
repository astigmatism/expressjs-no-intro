const fs = require('fs-extra');
const path = require('path');
const config = require('config');
const parseString = require('xml2js').parseString;

const mediaRoot = path.join(__dirname, '../','media');
const datRoot = path.join(mediaRoot, '/dats');

module.exports = new (function() {

    var _self = this;

    this.Get = function(system, callback) {

        var currentDatFile;

        try {
            currentDatFile = config.get('systems.' + system + '.datFile');
        }
        catch (e) {
            return callback(e.message);
        }

        var datFilePath = path.join(datRoot, system, currentDatFile + '.dat');
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
