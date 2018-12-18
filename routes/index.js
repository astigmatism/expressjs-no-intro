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

router.get('/', function(req, res, next) {

    res.render('index', {
        title: 'No-Intro Service',
        window: {
            application: {
                systems: config.get('systems')
            }
        }
    });
});

module.exports = router;
