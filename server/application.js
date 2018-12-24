const dl = require('damerau-levenshtein-js');
const levenshtein = require('levenshtein-edit-distance');
var stringSimilarity = require('string-similarity');
const async = require('async');
const nodeZip = require('node-zip');
const fs = require('fs-extra');
const junk = require('junk');
const path = require('path');

module.exports = new (function() {

    var _self = this;

    // Array.prototype.remove = function() {
    //     var what, a = arguments, L = a.length, ax;
    //     while (L && this.length) {
    //         what = a[--L];
    //         while ((ax = this.indexOf(what)) !== -1) {
    //             this.splice(ax, 1);
    //         }
    //     }
    //     return this;
    // };

    Array.prototype.PopObjectFromArray = function(comparisonValue, objectMemberToCompare) {
        for (var i = 0, len = this.length; i < len; ++i) {
            if (this[i].hasOwnProperty(objectMemberToCompare)) {
                if (this[i][objectMemberToCompare] == comparisonValue) {
                    
                    var removedItem = this.splice(i, 1);
                    return [this, removedItem[0]];
                }
            }
        };
        return [this, null];
    };

    //consider dl.distance instead but leaving this in out of interest:
    //https://en.wikipedia.org/wiki/Levenshtein_distance
    String.prototype.levenstein = function(string) {
        return levenshtein(this, string);
    };

    this.FindBestMatchBetweenLists = function(filenamesSet, datSet, topScorersCount, callback) {

        //creates a matrix of everything in datSet compared to everything in filenamesSet
        var eachFilenameScoreForThisDatEntry = BuildScoreMatrix(filenamesSet, datSet);

        var multipleDatEntriesWhichClaimMatchToOneFile = FindDuplicates(eachFilenameScoreForThisDatEntry);         
        
        var results = DiscardNonPerfectScores(eachFilenameScoreForThisDatEntry, multipleDatEntriesWhichClaimMatchToOneFile, 1);
        
        eachFilenameScoreForThisDatEntry = results[0];
        multipleDatEntriesWhichClaimMatchToOneFile = results[1];

        var topFilenameScoresForThisDatEntry = TopScorers(eachFilenameScoreForThisDatEntry, topScorersCount || 15); //creates a reverse matrix -> 

        return callback(null, topFilenameScoresForThisDatEntry, multipleDatEntriesWhichClaimMatchToOneFile);
    };

    var BuildScoreMatrix = function(filenamesSet, datSet) {

        eachFilenameScoreForThisDatEntry = {};
        var filenames = filenamesSet.set;
        var datEntries = datSet.set

        datEntries.forEach(datEntry => {

            console.log('[Score Matrix] Considering item {' + datEntry + '}');
            var sanitizedDatEntry = datSet.sanitize ? datSet.sanitize(datEntry) : datEntry;
            eachFilenameScoreForThisDatEntry[datEntry] = [];

            filenames.forEach(filename => {

                var sanitiziedFilename = filenamesSet.sanitize ? filenamesSet.sanitize(filename) : filename;

                result = {
                    filename: filename,
                    
                    score: stringSimilarity.compareTwoStrings(sanitiziedFilename, sanitizedDatEntry)
                    //score: levenshtein(sanitiziedFilename, sanitizedDatEntry)
                    //score: dl.distance(sanitiziedFilename, sanitizedDatEntry)
                };

                eachFilenameScoreForThisDatEntry[datEntry] = ObjectArraySortedInsert(eachFilenameScoreForThisDatEntry[datEntry], result, 'score');
            });
        });
        return eachFilenameScoreForThisDatEntry;
    };

    //creates a list 
    var TopScorers = function(eachFilenameScoreForThisDatEntry, limit) {

        var topFilenameScoresForThisDatEntry = {};
        for (var filename in eachFilenameScoreForThisDatEntry) {

            topFilenameScoresForThisDatEntry[filename] = [];
            for (var i = 0, len = eachFilenameScoreForThisDatEntry[filename].length; i < len && i < limit; ++i)
                topFilenameScoresForThisDatEntry[filename].push(eachFilenameScoreForThisDatEntry[filename][i]);
        }
        return topFilenameScoresForThisDatEntry;
    };
    
    var FindDuplicates = function(eachFilenameScoreForThisDatEntry) {

        var multipleDatEntriesWhichClaimMatchToOneFile = {};

        for (var datEntry in eachFilenameScoreForThisDatEntry) {
            
            var filenameScores = eachFilenameScoreForThisDatEntry[datEntry];
            
            if (filenameScores.length > 0) {

                var topScorer = filenameScores[0];

                if (!multipleDatEntriesWhichClaimMatchToOneFile.hasOwnProperty(topScorer.filename)) {
                    multipleDatEntriesWhichClaimMatchToOneFile[topScorer.filename] = [];
                }

                var insertObject = {
                    datEntry: datEntry,
                    score: filenameScores[0].score
                };

                multipleDatEntriesWhichClaimMatchToOneFile[topScorer.filename] = ObjectArraySortedInsert(multipleDatEntriesWhichClaimMatchToOneFile[topScorer.filename], insertObject, 'score');
            }
        };

        return multipleDatEntriesWhichClaimMatchToOneFile;
    };

    var DiscardNonPerfectScores = function(eachFilenameScoreForThisDatEntry, multipleDatEntriesWhichClaimMatchToOneFile, perfectScore) {

        var foundOtherThatCompeteAgainstAPefectScore = false;
        for (var filename in multipleDatEntriesWhichClaimMatchToOneFile) {
            var datEntries = multipleDatEntriesWhichClaimMatchToOneFile[filename];

            //a datEntry must have more than one match to vet others
            if (datEntries.length > 1) {

                //if a perfect score is defined, we only want to discard other matches WHEN that perfect score is achieved (at 0 since its position has the greatest)

                //the top entry has a perfect score, by definition, nothing else SHOULD match to this
                if (datEntries[0].score == perfectScore) {

                    console.log('[Perfect Score] ' + datEntries[0].datEntry + ' has a perfect score for ' + filename + ' but has other matches, these will be discarded');

                    //loop other all the other claims
                    for(var i = 1, len = datEntries.length; i < len; ++i) {
                        var datEntry = datEntries[i].datEntry;

                        //find the definition in eachFilenameScoreForThisDatEntry
                        //the other datEntry claiming this filename will be in position 0.
                        //let's simlply remove this score
                        eachFilenameScoreForThisDatEntry[datEntry].shift();
                        foundOtherThatCompeteAgainstAPefectScore = true;
                    }

                    //make this the only item in the multipleDatEntriesWhichClaimMatchToOneFile
                    //so as not to suggest it as a better match in the table
                    multipleDatEntriesWhichClaimMatchToOneFile[filename] = [datEntries[0]];

                }
            }
        }

        //run this function as many times as needed to discard all which claim against a perfect score
        if (foundOtherThatCompeteAgainstAPefectScore) {
            
            //rerun this
            multipleDatEntriesWhichClaimMatchToOneFile = FindDuplicates(eachFilenameScoreForThisDatEntry);
            
            //now recurse
            return DiscardNonPerfectScores(eachFilenameScoreForThisDatEntry, multipleDatEntriesWhichClaimMatchToOneFile, perfectScore);
        }

        return [eachFilenameScoreForThisDatEntry, multipleDatEntriesWhichClaimMatchToOneFile];
    }

    var ObjectArraySortedInsert = function(array, compareObject, objectMemberToCompare) {

        if (array.length == 0) {
            array.push(compareObject);
        }
        else {

            //walk backwards
            for(var i = array.length - 1; i > -1; --i) {

                //if current value is greater, insert behind
                if (array[i][objectMemberToCompare] > compareObject[objectMemberToCompare]) {
                    array.splice(i + 1, 0, compareObject);
                    break;
                }
                else {
                    //if the score is greater than everythng in the array, insert at front
                    if (i == 0) {
                        array.splice(0, 0, compareObject);
                    }
                }
            };
        }
        return array;
    };

    this.UnZipAllFiles = function(source, destination, callback) {

        var files;

        //get dir listing
        try {
            files = fs.readdirSync(source);
        }
        catch (e) {
            return callback(e.message);
        }

        files = files.filter(junk.not); //removes DS_Store

        fs.ensureDirSync(destination);
        fs.emptyDirSync(destination);

        async.eachSeries(files, (file, nextFile) => {

            console.log('[UNZIP] ' + file);

            //read file
            fs.readFile(path.join(source, file), function(err, buffer) {
                if (err) return nextFile(err);

                var zip = new nodeZip(buffer);

                //write zip to dest
                Object.keys(zip.files).forEach(function(filename) {
                    var content = zip.files[filename].asNodeBuffer();
                    fs.writeFileSync(path.join(destination, filename), content);
                    return nextFile();
                });
            });
        }, err => {
            if (err) return callback(err);

            //empty source dir as a courtesy
            fs.emptyDirSync(source);

            return callback(null, files.length);
        });
    };
});
