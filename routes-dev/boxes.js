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
const Boxes = require('../server/boxes');
const MasterFiles = require('../server/masterfiles');

router.get('/audit/:type/:system', function(req, res, next) {

    var type = req.params.type;
    var system = req.params.system;

    if (!type) {
        return res.status(400).end('err 0');
    }
    if (!system) {
        return res.status(400).end('err 1');
    }

    Boxes.Audit(system, type, (err, results, top, dupes) => {
        if (err) return res.status(500).end(err);

        res.render('boxes/audit', {
            title: 'Box Audit: ' + system,
            window: {
                application: {
                    system: system,
                    type: type,
                    data: results,
                    top: top,
                    dupes: dupes
                }
            }
        });
    });
});

router.get('/media/:type/:system/:filename', (req, res, next) => {

    var system = req.params.system;
    var type = req.params.type;
    var filename = req.params.filename;

    if (!type) {
        return res.status(400).end('err 0');
    }
    if (!system) {
        return res.status(400).end('err 1');
    }
    if (!filename) {
        return res.status(400).end('err 2');
    }

    Boxes.GetAuditSrc(system, type, filename, (err, imageBuffer) => {
        if (err) return res.status(500).end();
        res.status(200).end(imageBuffer, 'buffer');
    });
});

router.post('/audit/:system', function(req, res, next) {

    var system = req.params.system;
    var tableData = req.body.tableData;
    var type = req.body.type;

    if (!system) {
        return res.status(400).end('err 0');
    }
    if (!tableData) {
        return res.status(400).end('err 1');
    }
    if (!type) {
        return res.status(400).end('err 2');
    }
    try {
        tableData = JSON.parse(tableData);
    }
    catch(e) {
        return res.status(400).end('err 3');
    }

    MasterFiles.CreateBoxesMasterFile(system, type, tableData, err => {
        if (err) {
            return res.status(500).json(err);
        }
        return res.status(200).json();
    });
});

module.exports = router;
