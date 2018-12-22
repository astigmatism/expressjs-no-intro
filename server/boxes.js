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

module.exports = new (function() {

    var _self = this;

    this.Audit = function(system, boxType, callback) {

        var boxesPath = path.join(boxesRoot, boxType, system);
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
            MasterFiles.Get(system, 'boxes-' + boxType, (masterfile, masterfileFileName) => {

                if (!data) return callback('no roms master file for ' + system + ' created yet');

                var titles = [];
                for (var title in data.data) {

                    //if in the masterfile the title is NOT associated with a file, it means we
                    //dont offer the file for play, so dont considering it when making matches
                    if (data.data[title] == '') {
                        continue;
                    }
                    titles.push(title);
                }

                Application.FindBestMatchBetweenLists({ 
                    set: files,
                    sanitize: SanitizeFiles
                }, {
                    set: titles, 
                    sanitize: SanitizeTitles
                }, 100, (err, topFilenameScoresForThisDatEntry, multipleDatEnriesWhichClaimMatchToOneFile) => {
                    
                    if (err) return callback(err);

                    var tableData = [];
                    async.forEachOf(topFilenameScoresForThisDatEntry, (topScorers, title, nextDayEntry) => {
                        
                        var topScorer = topScorers[0]; //its possible this is null if all possible top scores were vetted out

                        //build an understanding of exclusivity - if a duplicate dat entry matched a file,
                        //we only want to inform on the table if match has a better score with the other dupe
                        otherMatchHasBetterScore = false;

                        /*
                        this section of code slightly differs from that in roms.js:
                        when an item is found with a higher score, simply remove
                        the audit file match and let the user decide what to do. 

                        For art, I found it easier to leave the audit blank when its top match was
                        likely the highest score
                        */
                        if (topScorer) {
                            if (multipleDatEnriesWhichClaimMatchToOneFile.hasOwnProperty(topScorer.filename)) {

                                var datEntries = multipleDatEnriesWhichClaimMatchToOneFile[topScorer.filename];
                                for (i = 0, len = datEntries.length; i < len; ++i) {
                                    if (datEntries[i].score > topScorer.score) {
                                        multipleDatEnriesWhichClaimMatchToOneFile[topScorer.filename] = [multipleDatEnriesWhichClaimMatchToOneFile[topScorer.filename][0]];
                                        topScorer = null;
                                        break;
                                    }
                                }
                            }
                        }

                        tableData.push({
                            id: title,
                            title: title,
                            auditfile: topScorer ? topScorer.filename : '',
                            auditscore: topScorer ? topScorer.score : '',
                            masterfileassignment: (masterfile) ? masterfile.data[title] : ''
                        });

                        nextDayEntry();
                    }, err => {
                        if (err) return callback(err);

                        var masterfileDetails = (masterfile) ? masterfileFileName + '. Created On: ' + new Date(masterfile.createdOn) : 'Not Created Yet';

                        return callback(null, 
                            tableData, 
                            topFilenameScoresForThisDatEntry, 
                            multipleDatEnriesWhichClaimMatchToOneFile,
                            masterfileDetails
                            );
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
    this.GetAuditPreview = function(system, boxType, filename, callback) {

        var boxesPath = path.join(boxesRoot, boxType, system, filename);

        fs.readFile(boxesPath, (err, buffer) => {
            if (err) return callback(err)
            return callback(null, buffer);
        });
    };

});
