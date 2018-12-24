(function() {

    var _self = this;

    $(document).ready(function() {

    });

    //i wrote this. it returns an array, oh well
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

    Array.prototype.ObjectArraySortedInsert = function(compareObject, objectMemberToCompare) {

        if (this.length == 0) {
            this.push(compareObject);
        }
        else {

            //walk backwards
            for(var i = this.length - 1; i > -1; --i) {

                //if current value is greater, insert behind
                if (this[i][objectMemberToCompare] > compareObject[objectMemberToCompare]) {
                    this.splice(i + 1, 0, compareObject);
                    break;
                }
                else {
                    //if the score is greater than everythng in the array, insert at front
                    if (i == 0) {
                        this.splice(0, 0, compareObject);
                    }
                }
            };
        }
        return this;
    };


    String.prototype.capitalize = function() {
        return this.charAt(0).toUpperCase() + this.slice(1);
    }

})();