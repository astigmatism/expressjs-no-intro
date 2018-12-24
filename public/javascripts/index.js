(function() {

    var _self = this;
    var _systems = window.application.systems;
    var _auditDetails = window.application.auditDetails;

    $(document).ready(function() {

        var table = new Tabulator('#systems', {
            layout:'fitColumns',
            initialSort:[
                { column:"name", dir:"asc" },
            ],
            columns: [
                { title:'System Name', field:'name', sorter:'string', width:400, editor:true },
                { title:'UnZip to Media', field:'unzip', formatter: UnZipToMediaFormatter},
                { title:'Rom Audit', field:'romaudit', formatter: RomsAuditFormatter },
                { title:'Box Front Audit', field:'boxfrontaudit', formatter: BoxFrontAuditFormatter },
                { title:'Title Screen Audit', field:'titlescreenaudit', formatter: TitleScreenAuditFormatter },
                { title:'Screenshot Audit', field:'screenshotaudit', formatter: ScreenshotAuditFormatter }
            ]
        });

        $.each(window.application.systems, function(k, v) {

            table.addData([{ id: v.key, name: v.name }]);
        });
    });

    var UnZipToMediaFormatter = function(cell) {
        
        var id = cell.getData().id;
        return '<div>Files found in /media/roms/' + id + '/: ' + _auditDetails[id].filecounts.roms + '</div><a href="/dev/roms/unzip/' + id + '" target="_blank">Unzip to Media Folder</a>';
    };

    var RomsAuditFormatter = function(cell) {

        var id = cell.getData().id;
        return '<div>Has a Roms Masterfile Already: ' + _auditDetails[id].masterfiles.roms + '</div><a href="/dev/roms/audit/' + id + '" target="_blank">Audit Now</a>';
    };

    var BoxFrontAuditFormatter = function(cell) {

        var id = cell.getData().id;
        return '<div>Has a Box Front Masterfile Already: ' + _auditDetails[id].masterfiles['boxes-front'] + '</div><div>Has Art Ready in /media/boxes/front: ' + _auditDetails[id].filecounts['boxes-front'] + '</div><a href="/dev/boxes/audit/front/' + id + '" target="_blank">Audit Now</a>';
    };

    var TitleScreenAuditFormatter = function(cell) {

        var id = cell.getData().id;
        return '<div>Has a Title Screen Masterfile Already: ' + _auditDetails[id].masterfiles['screens-title'] + '</div><div>Has Art Ready in /media/screens/title: ' + _auditDetails[id].filecounts['screens-title'] + '</div><a href="/dev/screens/audit/title/' + id + '" target="_blank">Audit Now</a>';
    };

    var ScreenshotAuditFormatter = function(cell) {

        var id = cell.getData().id;
        return '<div>Has a Screenshot Masterfile Already: ' + _auditDetails[id].masterfiles['screens-shot'] + '</div><div>Has Art Ready in /media/screens/shot: ' + _auditDetails[id].filecounts['screens-shot'] + '</div><a href="/dev/screens/audit/shot/' + id + '" target="_blank">Audit Now</a>';
    };
})();