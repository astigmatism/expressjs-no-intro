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
                { title:'UnZip to Media Folder', field:'unzip', width: 150, formatter: UnZipToMediaFormatter},
                { title:'Rom Audit', field:'romaudit', formatter: AuditFormatter, formatterParams:{ type: 'roms' }},
                { title:'Box Front Audit', field:'boxfrontaudit', formatter: AuditFormatter, formatterParams:{ type: 'boxes/front' }},
                { title:'Title Screen Audit', field:'titlescreenaudit', formatter: AuditFormatter, formatterParams:{ type: 'screens/title' }},
                { title:'Screenshot Audit', field:'screenshotaudit', formatter: AuditFormatter, formatterParams:{ type: 'screens/shot' }},
            ]
        });

        $.each(window.application.systems, function(k, v) {

            table.addData([{ id: v.key, name: v.name }]);
        });
    });

    var UnZipToMediaFormatter = function(cell) {
        
        var id = cell.getData().id;
        //return '<div>Files found in /media/roms/' + id + '/: ' + _auditDetails[id].filecounts.roms + '</div><a href="/dev/roms/unzip/' + id + '" target="_blank">Unzip to Media Folder</a>';
        return '<a href="/dev/roms/unzip/' + id + '" target="_blank">Unzip to Media Folder</a>';
    };

    var AuditFormatter = function(cell, obj) {

        var type = obj.type;
        var id = cell.getData().id;
        var existingMasterfile = _auditDetails[id].masterfiles[type];
        var auditFileCount = _auditDetails[id].filecounts[type];

        var auditFileCountMessage = 'Files not present';
        if (auditFileCount) {
            auditFileCountMessage = 'Number of files ready for audit in /media/' + type + '/' + id + ': ' + auditFileCount;
        }

        var masterfileMessage = 'No existing masterfile';
        if (existingMasterfile) {
            masterfileMessage = 'Preexisting masterfile: ' + existingMasterfile;
        }

        return  '<div class="' + (auditFileCount ? 'yes' : 'no') + '">' + auditFileCountMessage + '</div>' + 
                '<div class="' + (existingMasterfile ? 'yes' : 'warn') + '">' + masterfileMessage + '</div>' + 
                '<a href="/dev/roms/audit/' + id + '" target="_blank">Audit Now</a>' + 
                '';
    };
})();