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
const Dats = require('../server/dats');
const Masterfiles = require('../server/masterfiles');
const Roms = require('../server/roms');
const Boxes = require('../server/boxes');
const Screens = require('../server/screens');

router.get('/', function(req, res, next) {

    var auditDetails = {};
    var systems = Dats.GetSystemsWithDat();

    for (var system in systems) {
        auditDetails[system] = {
            filecounts: {
                roms: Roms.CheckForRomsInMedia(system),
                'boxes/front': Boxes.CheckForFilesInMedia(system, 'front'),
                'screens/title': Screens.CheckForFilesInMedia(system, 'title'),
                'screens/shot': Screens.CheckForFilesInMedia(system, 'shot')
            },
            masterfiles: {
                'roms': Masterfiles.Exists(system, 'roms'),
                'boxes/front': Masterfiles.Exists(system, 'boxes-front'),
                'screens/title': Masterfiles.Exists(system, 'screens-title'),
                'screens/shot': Masterfiles.Exists(system, 'screens-shot')
            }
        };
    };
    
    res.render('index', {
        title: 'No-Intro',
        window: {
            application: {
                systems: systems,
                auditDetails: auditDetails
            }
        }
    });
});

module.exports = router;
