const dl = require('damerau-levenshtein-js');
const levenshtein = require('levenshtein-edit-distance');
var stringSimilarity = require('string-similarity');

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

    this.FindBestMatchBetweenLists = function(lista, listb, topScorersCount, _sanitizeFunction) {

        var matrix = BuildScoreMatrix(lista, listb, _sanitizeFunction);
        //var matrix = RemoveDuplicates(matrix);
        var top = TopScorers(matrix, topScorersCount || 15);

        //clean up
        var results = {};
        for (var item in matrix) {
            if (matrix[item].length > 0) {
                results[item] = matrix[item][0];
            }
        }
        return {
            results: results,
            top: top
        }
    };

    var BuildScoreMatrix = function(lista, listb, _sanitizeFunction) {

        results = {};

        listb.forEach(itemb => {

            console.log('[Score Matrix] Considering item {' + itemb + '}');

            var sanitizedItemb = _sanitizeFunction ? _sanitizeFunction(itemb) : itemb;
            results[itemb] = [];

            lista.forEach(itema => {
                var sanitizedItema = _sanitizeFunction ? _sanitizeFunction(itema) : itema;

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
                    for(var i = 0, len = results[itemb].length; i < len; ++i) {
                        if (results[itemb][i].score > result.score) continue;
                        results[itemb].splice(i, 0, result);
                        break;
                    }
                }
            });
        });
        return results;
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
            for (var i = 0, len = result[item].length; i < len || i < limit; ++i)
                result[item].push(matrix[item][i]);
        }
        return result;
    };
    var BuildScoreMatrix_ = function(lista, listb, _sanitizeFunction) {

        var results = {};

        //lista is primary (like files) and must find a match to listb with a score.
        lista.forEach(itema => {

            console.log('[List Matching] Considering item {' + itema + '}');

            var sanitizedItema = _sanitizeFunction ? _sanitizeFunction(itema) : itema;
            
            //get a score for this item against all others in the other list
            var scores = {};
            listb.forEach(itemb => {
                var sanitizedItemb = _sanitizeFunction ? _sanitizeFunction(itemb) : itemb;
                
                //var score = sanitizedItema.levenstein(sanitizedItemb);
                var score = dl.distance(sanitizedItema, sanitizedItemb);
                
                scores[itemb] = score;

                //how does the score for this item compare to that of the results?
                if (results[itemb]) {

                    //if this score is lower, take the place
                    if (score < results[itemb].score) {
                        results[itemb] = {
                            item: itema,
                            score: score
                        }
                    }

                }
                else {
                    //since no score is recorded yet, make this best match
                    results[itemb] = {
                        item: itema,
                        score: score
                    }
                }
            });
        });
        return results;
    };

    this.ListCompare = function(lista, listb, _sanitizeFunction) {

        //two lists in which one or the other could be greater
        
        //first find the best matches in list b from list a
        var atobScores = {};
        var btoaScores = {};

        console.log('[List Compare] Buliding Score Matrix...');

        lista.forEach(itema => {

            atobScores[itema] = {};
            var sanitizedItema = _sanitizeFunction ? _sanitizeFunction(itema) : itema;

            
            listb.forEach(itemb => {

                var sanitizedItemb = _sanitizeFunction ? _sanitizeFunction(itemb) : itemb;
                
                //choose the scoring algorithum:
                //var score = dl.distance(sanitizedItema, sanitizedItemb);
                var score = sanitizedItema.levenstein(sanitizedItemb);

                atobScores[itema][itemb] = score;
            });
        });

        //find the lowest score for each item in lista
        var matches = {};
        for (itema in atobScores) {

            var match = { item: null, score: -1 };

            for (itemb in atobScores[itema]) {
                
                var score = atobScores[itema][itemb];

                if (score < match.score || match.score == -1) {

                    console.log('[List Compare] Low score of ' + score + ' for {' + itema + '} -> {' + itemb + '}');

                    //does any other item in lista score lower to claim this match?
                    lowestscore = true;
                    for (itema2 in atobScores) {
                        var otherscore = atobScores[itema2][itemb];
                        
                        if (otherscore < score) {
                            lowestscore = false;
                            console.log('[List Compare] Lower score of ' + otherscore + ' for {' + itema2 + '} -> {' + itemb + '}');
                            break;
                        }
                    }

                    if (lowestscore) {
                        match.item = itemb;
                        match.score = score;
                    }
                }
            }

            if (match.score != -1) {
                matches[itema] = {
                    item: match.item,
                    score: match.score
                };
            }

        }

        return matches;
    };
});
