const dl = require('damerau-levenshtein-js');
const levenshtein = require('levenshtein-edit-distance');
var stringSimilarity = require('string-similarity');
const async = require('async');

module.exports = new (function() {

    var _self = this;

    Array.prototype.remove = function() {
        var what, a = arguments, L = a.length, ax;
        while (L && this.length) {
            what = a[--L];
            while ((ax = this.indexOf(what)) !== -1) {
                this.splice(ax, 1);
            }
        }
        return this;
    };

    //consider dl.distance instead but leaving this in out of interest:
    //https://en.wikipedia.org/wiki/Levenshtein_distance
    String.prototype.levenstein = function(string) {
        return levenshtein(this, string);
    };

    this.FindBestMatchBetweenLists = function(seta, setb, topScorersCount, callback) {

        var matrix = BuildScoreMatrix(seta, setb, (err, matrix) => {
            if (err) return callback(err);

            var dupes = FindDuplicates(matrix);
            //var matrix = RemoveDuplicates(matrix);
            var top = TopScorers(matrix, topScorersCount || 15);

            //clean up
            var results = {};
            for (var item in matrix) {
                if (matrix[item].length > 0) {
                    results[item] = matrix[item][0];
                }
            };

            return callback(null, results, top, dupes);
        });
    };

    var BuildScoreMatrix = function(seta, setb, callback) {

        results = {};
        var lista = seta.set;
        var listb = setb.set

        async.forEach(listb, function(itemb, nextb) {

            console.log('[Score Matrix] Considering item {' + itemb + '}');

            var sanitizedItemb = setb.sanitize ? setb.sanitize(itemb) : itemb;
            results[itemb] = [];

            async.forEach(lista, function(itema, nexta) {

                var sanitizedItema = seta.sanitize ? seta.sanitize(itema) : itema;

                result = {
                    item: itema,
                    
                    score: stringSimilarity.compareTwoStrings(sanitizedItema, sanitizedItemb)
                    //score: levenshtein(sanitizedItema, sanitizedItemb)
                    //score: dl.distance(sanitizedItema, sanitizedItemb)
                };

                if (results[itemb].length == 0) {
                    results[itemb].push(result);
                }
                else {
                    //walk array until score is higher, then insert before and exit
                    var inserted = false;

                    //walk backwards
                    for(var i = results[itemb].length - 1; i > -1; --i) {

                        //if current value is greater, insert behind
                        if (results[itemb][i].score > result.score) {
                            results[itemb].splice(i + 1, 0, result);
                            break;
                        }
                        else {
                            //if the score is greater than everythng in the array, insert at front
                            if (i == 0) {
                                results[itemb].splice(0, 0, result);
                            }
                        }
                    };
                }

                nexta();
            }, err2 => {
                if (err2) return callback(err2);
                nextb();
            });
        }, err=> {
            if (err) return callback(err);
            
            return callback(null, results);
        });
    };

    var RemoveDuplicates = function(matrix) {
        
        for (var item in matrix) {
            var results = matrix[item];
            
            //if no more, go to next
            if (results.length == 0) {
                continue;
            }
            var lowestScore = results[0];

            for (var itemb in matrix) {
                var resultsb = matrix[itemb];

                if (resultsb.length == 0) {
                    continue;
                }

                var lowestScoreb = resultsb[0];

                //as long as this is not the same item but the lowest scoring match is the same thing
                if (item !== itemb && lowestScoreb.item == lowestScore.item) {
                    //console.log('[Remove Duplicates] Found Duplicate match for {' + lowestScore.item + '} between {' + item + '} {' + lowestScore.score + '} vs {' + itemb + '} {' + lowestScoreb.score + '}');

                    //which ever has the lower score keeps the match, the other must discard their claim
                    losingItem = lowestScoreb.score < lowestScore.score ? item : itemb;
                    winningItem = lowestScoreb.score < lowestScore.score ? itemb : item;

                    console.log('[Remove Dupes] {' + losingItem + '} loses match of {' + lowestScore.item + '} to {' + winningItem + '}');

                    matrix[losingItem].shift();

                    return RemoveDuplicates(matrix); //start again
                }
            };
        };
        return matrix;
    };

    var TopScorers = function(matrix, limit) {

        var result = {};
        for (var item in matrix) {

            result[item] = [];
            for (var i = 0, len = matrix[item].length; i < len && i < limit; ++i)
                result[item].push(matrix[item][i]);
        }
        return result;
    };
    
    var FindDuplicates = function(matrix) {

        var dupes = {};
        for (var item in matrix) {
            var results = matrix[item];
            if (results.length > 0) {
                if (!dupes.hasOwnProperty(results[0].item)) {
                    dupes[results[0].item] = [];
                }
                dupes[results[0].item].push({
                    item: item,
                    score: results[0].score
                });
            }
        };
        return dupes;
    }
});
