const fs = require('fs-extra');
const config = require('config');
const path = require('path');
const async = require('async');
const Dat = require('./dat');
const Application = require('./application');
const { crc32 } = require('crc');
const md5File = require('md5-file');
const sha1File = require('sha1-file');
const junk = require('junk');

const mediaRoot = path.join(__dirname, '../','media');
const romsRoot = path.join(mediaRoot, 'roms');

module.exports = new (function() {

    var _self = this;

    var Sanitize = function(name) {

        name = name.split('.').slice(0, -1).join('.'); //also removes file ext
        name = name.replace(/[\W\(.*\)]/g, ''); //strip out all non-words
        //name = name.replace(/\(.*\)|[\W]/g, ''); //same as above but also all (.*)
        return name;
    };

    this.Audit = function(system, callback, _resultsFilter) {

        var files;
        var filessize = {};
        var filescrc = {};
        var filemd5 = {};
        var romsPath = path.join(romsRoot, system);

        //get dir listing
        try {
            files = fs.readdirSync(romsPath);
        }
        catch (e) {
            return callback(e.message);
        }

        var filedetails = {};

        files = files.filter(junk.not); //removes DS_Store

        //get file sizes and crc
        files.forEach(file => {
            filedetails[file]           = {};
            filedetails[file].stats     = fs.statSync(path.join(romsPath, file));
            filedetails[file].crc       = crc32(fs.readFileSync(path.join(romsPath, file), 'utf8')).toString(16);
            filedetails[file].md5       = md5File.sync(path.join(romsPath, file));
            filedetails[file].sha1      = sha1File(path.join(romsPath, file));
        });

        Dat.Get(system, (err, datfile, data) => {

            //compose list for comparison
            var datList = [];
            var dat = {};
            data.forEach(item => {
                datList.push(item.name);
                dat[item.name] = item;
            });       

            Application.FindBestMatchBetweenLists({set: files, sanitize: Sanitize}, {set: datList, sanitize: Sanitize}, 100, (err, matrix, top, dupes) => {
                if (err) return callback(err);

                //massage dupes for table display
                for (var file in dupes) {
                    for (var i = 0, len = dupes[file].length; i < len; ++i) {
                        //include dat title
                        dupes[file][i].title = dat[dupes[file][i].item].title;
                    }
                };

                var result = [];
                async.forEachOf(matrix, (value, key, next) => {
                    
                    //calculate different between filesize and expected file size
                    var diff = filedetails[value.item].stats.size - dat[key].size;
                    var perc = diff / filedetails[value.item].stats.size * 100;

                    //respect filtering results to avoid overwhelming the client
                    switch(_resultsFilter) {

                        case'score':
                            if (value.score == 1) {
                                return next();
                            }

                            //intentional fallthrough

                        default:
                        
                            //build an understanding of exclusivity - if a duplicate dat entry matched a file,
                            //we only want to inform on the table if match has a better score with the other dupe
                            otherMatchHasBetterScore = false;
                            if (dupes.hasOwnProperty(value.item)) {
                                dupes[value.item].forEach(item => {
                                    if (item.score > value.score) otherMatchHasBetterScore = true;
                                });
                            }

                            result.push({
                                id: dat[key].title,
                                dattitle: dat[key].title,
                                datname: dat[key].name,
                                datsize: dat[key].size,
                                datcrc: dat[key].crc,
                                datmd5: dat[key].md5,
                                datsha1: dat[key].sha1,
                                auditfile: value.item,
                                auditscore: value.score,
                                auditsize: filedetails[value.item].stats.size,
                                auditdiff: perc,
                                auditcrc: filedetails[value.item].crc.toUpperCase(),
                                auditmd5: filedetails[value.item].md5.toUpperCase(),
                                auditsha1: filedetails[value.item].sha1.toUpperCase(),
                                exclusive: otherMatchHasBetterScore ? 'Click to see other titles' : ''
                            });
                        }

                    next();
                }, err => {
                    if (err) return callback(err);

                    return callback(null, result, top, dupes);
                });
            });
        });
    };
});
