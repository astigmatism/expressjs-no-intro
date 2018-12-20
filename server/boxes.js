const fs = require('fs-extra');
const config = require('config');
const path = require('path');
const async = require('async');
const junk = require('junk');
const pako = require('pako');

const MasterFiles = require('./masterfiles');
const Application = require('./application');

const mediaRoot = path.join(__dirname, '../','media');
const boxesRoot = path.join(mediaRoot, 'boxes');
const boxesFullRoot = path.join(boxesRoot, 'full');
const boxesFrontRoot = path.join(boxesRoot, 'front');

module.exports = new (function() {

    var _self = this;

    this.Audit = function(system, type, callback) {

        var boxesPath = path.join(boxesFrontRoot, system);
        switch (type)
        {
            case 'full':
                //TODO
        }

        var files;

        //get dir listing
        try {
            files = fs.readdirSync(boxesPath);
        }
        catch (e) {
            return callback(e.message);
        }

        files = files.filter(junk.not); //removes DS_Store

        MasterFiles.Get(system, 'roms', (data) => {
            MasterFiles.Get(system, 'boxes-' + type, (masterfile) => {

                if (!data) return callback('no roms master file for ' + system + ' created yet');

                var titles = [];
                for (var title in data.data) {
                    titles.push(title);
                }

                Application.FindBestMatchBetweenLists({ set: files, sanitize: SanitizeFiles}, {set: titles, sanitize: SanitizeTitles}, 100, (err, matrix, top, dupes) => {
                    if (err) return callback(err);

                    var result = [];
                    async.forEachOf(matrix, (value, key, next) => {

                        //build an understanding of exclusivity - if a duplicate dat entry matched a file,
                        //we only want to inform on the table if match has a better score with the other dupe
                        otherMatchHasBetterScore = false;
                        if (dupes.hasOwnProperty(value.item)) {
                            dupes[value.item].forEach(item => {
                                if (item.score > value.score) otherMatchHasBetterScore = true;
                            });
                        }

                        result.push({
                            id: key,
                            title: key,
                            auditfile: value.item,
                            auditscore: value.score,
                            exclusive: otherMatchHasBetterScore ? 'Click to see other titles' : '',
                            masterfilematch: (masterfile) ? masterfile.data[key] : ''
                        });

                        next();
                    }, err => {
                        if (err) return callback(err);

                        return callback(null, result, top, dupes);
                    });
                });
            });
        });
    };

    var SanitizeFiles = function(name) {

        name = name.split('.').slice(0, -1).join('.'); //also removes file ext
        name = name.replace(/[\W\(.*\)]/g, ''); //strip out all non-words
        return name;
    };

    var SanitizeTitles = function(name) {

        name = name.replace(/[\W\(.*\)]/g, ''); //strip out all non-words
        return name;
    };

    //just get the raw image src from the cdn location of choice. I use this for the media browser
    this.GetAuditSrc = function(system, type, filename, callback) {

        var boxesPath = path.join(boxesFrontRoot, system, filename);
        switch (type)
        {
            case 'full':
                //TODO
        }

        fs.readFile(boxesPath, (err, buffer) => {
            if (err) return callback(err)
            return callback(null, buffer);
        });
    };

});
