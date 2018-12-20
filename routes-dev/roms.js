/**
 * 
 * Be aware of custom response codes and error messages. They are not descriptive on purpose. 
 * Please refer to the methods themselves for failure points.
 * 
 * Use correct response status codes:
 * 
 * 200 - success: In general this is the code to check on the client-end to ensure the expected response is returned
 * 201 - success and resource created.
 * 203 - The server processed the request successfully, but is returning data from another source (or something)
 * 204 - success, but no content (removes any content from the response body)
 * 
 * 400 - bad request
 * 403 - forbidden
 * 404 - not found
 */
var express = require('express');
var router = express.Router();
const config = require('config');
const Roms = require('../server/roms');
const MasterFiles = require('../server/masterfiles');

router.get('/audit/:system', function(req, res, next) {

    var system = req.params.system;
    var resultsFilter = req.query.filter;

    if (!system) {
        return res.status(400).end('err 0');
    }

    MasterFiles.Get(system, 'roms', (masterfile) => {

        Roms.Audit(system, (err, data, topScorers, dupes) => {

            if (err) return res.status(500).end(err);

            res.render('roms/audit', {
                title: 'Rom File Audit: ' + system,
                window: {
                    application: {
                        system: system,
                        data: data,
                        top: topScorers,
                        dupes: dupes,
                        masterfile: masterfile
                    }
                }
            });
        }, resultsFilter);
    });
});

router.post('/audit/:system', function(req, res, next) {

    var system = req.params.system;
    var tableData = req.body.tableData;

    if (!system) {
        return res.status(400).end('err 0');
    }
    if (!tableData) {
        return res.status(400).end('err 1');
    }
    try {
        tableData = JSON.parse(tableData);
    }
    catch(e) {
        return res.status(400).end('err 2');
    }

    MasterFiles.CreateRomsMasterFile(system, tableData, err => {
        if (err) {
            return res.status(500).json(err);
        }
        return res.status(200).json();
    });
});

module.exports = router;
