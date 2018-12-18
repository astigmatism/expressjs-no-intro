const fs = require('fs-extra');
const config = require('config');
const path = require('path');
const async = require('async');
const Dat = require('./dat');

const mediaRoot = path.join(__dirname, '../','media');
const boxesRoot = path.join(mediaRoot, 'boxes');
const boxesFullRoot = path.join(boxesRoot, 'full');
const boxesFrontRoot = path.join(boxesFullRoot, 'front');

module.exports = new (function() {

    var _self = this;

    this.Audit = function(system, callback) {

        var boxesFrontPath = path.join(boxesFrontRoot, system);
    };
});
