const fs = require('fs-extra');
const config = require('config');
const path = require('path');
const async = require('async');
const { crc32 } = require('crc');
const md5File = require('md5-file');
const sha1File = require('sha1-file');
const junk = require('junk');

const Dat = require('./dat');
const Application = require('./application');
const Masterfile = require('./masterfiles');

const mediaRoot = path.join(__dirname, '../','media');
const romsRoot = path.join(mediaRoot, 'roms');
const unzipPath = path.join(mediaRoot, 'to-unzip');

module.exports = new (function() {

    var _self = this;

    var Sanitize = function(name) {

        name = name.split('.').slice(0, -1).join('.'); //also removes file ext
        name = name.replace(/[\W\(.*\)]/g, ''); //strip out all non-words
        //name = name.replace(/\(.*\)|[\W]/g, ''); //same as above but also all (.*)
        return name;
    };

    this.UnZipToMedia = function(system, callback) {

        var sourcePath = unzipPath;
        var destinationPath = path.join(romsRoot, system);

        Application.UnZipAllFiles(sourcePath, destinationPath, (err, fileCount) => {
            if (err) callback(err);
            return callback(null, fileCount);
        });
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

        Masterfile.Get(system, 'roms', (masterfile, masterfileFileName) => {
        
            Dat.Get(system, (err, datfile, data) => {

                //compose list for comparison
                var datList = [];
                var dat = {};
                data.forEach(item => {
                    datList.push(item.name);
                    dat[item.name] = item;
                });       

                Application.FindBestMatchBetweenLists({
                        set: files, 
                        sanitize: Sanitize
                    }, {
                        set: datList, sanitize: Sanitize
                    }, 100, (err, topFilenameScoresForThisDatEntry, multipleDatEntriesWhichClaimMatchToOneFile) => {

                    //matrix, top, dupes
                    if (err) return callback(err);

                    //append the title name from the dat into the multipleDatEntriesWhichClaimMatchToOneFile for human reading on the table
                    for (var filename in multipleDatEntriesWhichClaimMatchToOneFile) {
                        for (var i = 0, len = multipleDatEntriesWhichClaimMatchToOneFile[filename].length; i < len; ++i) {
                            var datScoreResult = multipleDatEntriesWhichClaimMatchToOneFile[filename][i];
                            datScoreResult.title = dat[datScoreResult.datEntry].title;
                        }
                    };

                    var tableData = [];
                    async.forEachOf(topFilenameScoresForThisDatEntry, (topScorers, datEntry, next) => {
                        
                        var topScorer = topScorers[0];

                        //calculate different between filesize and expected file size
                        var diff = filedetails[topScorer.filename].stats.size - dat[datEntry].size;
                        var perc = diff / filedetails[topScorer.filename].stats.size * 100;

                        //respect filtering results to avoid overwhelming the client
                        switch(_resultsFilter) {

                            case'score':
                                if (topScorer.score == 1) {
                                    return next();
                                }

                                //intentional fallthrough

                            default:
                            
                                //build an understanding of exclusivity - if a duplicate dat entry matched a file,
                                //we only want to inform on the table if match has a better score with the other dupe
                                otherMatchHasBetterScore = false;
                                if (multipleDatEntriesWhichClaimMatchToOneFile.hasOwnProperty(topScorer.filename)) {
                                    multipleDatEntriesWhichClaimMatchToOneFile[topScorer.filename].forEach(datEntry => {
                                        if (datEntry.score > topScorer.score) otherMatchHasBetterScore = true;
                                    });
                                }

                                tableData.push({
                                    id: dat[datEntry].title,
                                    dattitle: dat[datEntry].title,
                                    datname: dat[datEntry].name,
                                    datsize: dat[datEntry].size,
                                    datcrc: dat[datEntry].crc,
                                    datmd5: dat[datEntry].md5,
                                    datsha1: dat[datEntry].sha1,
                                    auditfile: topScorer.filename,
                                    auditscore: topScorer.score,
                                    auditsize: filedetails[topScorer.filename].stats.size,
                                    auditdiff: perc,
                                    auditcrc: filedetails[topScorer.filename].crc.toUpperCase(),
                                    auditmd5: filedetails[topScorer.filename].md5.toUpperCase(),
                                    auditsha1: filedetails[topScorer.filename].sha1.toUpperCase(),
                                    masterfileassignment: (masterfile) ? masterfile.data[dat[datEntry].title] : ''
                                });
                            }

                        next();
                    }, err => {
                        if (err) return callback(err);

                        var masterfileDetails = (masterfile) ? masterfileFileName + '. Created On: ' + new Date(masterfile.createdOn) + '. From Dat File: ' + masterfile.originDatFile : 'Not Created Yet';

                        return callback(null, tableData, topFilenameScoresForThisDatEntry, multipleDatEntriesWhichClaimMatchToOneFile, masterfileDetails);
                    });
                });
            });
        });
    };

    this.CheckForRomsInMedia = function(system) {

        var source = path.join(romsRoot, system);
        //get dir listing
        try {
            files = fs.readdirSync(source);
        }
        catch (e) {
            return null;
        }
        return files.length;
    };
});
