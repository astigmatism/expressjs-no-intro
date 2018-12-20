(function() {

    var _self = this;
    var _table;
    var _system = window.application.system;
    var _data = window.application.data;
    var _top = window.application.top;
    var _dupes = window.application.dupes;
    var _masterfile = window.application.masterfile;
    var _tableData = [];

    $(document).ready(function() {
        
        _table = new Tabulator('#titles', {
            layout: 'fitColumns',
            columns: [
                { title:'Dat Title', field:'dattitle', sorter:'string', headerFilter: true, width:400 },
                { title:'Dat Rom File', field:'datname', sorter:'string', visible: false, width:400 },
                { title:'Audit File Match', field:'auditfile', width:400, headerFilter: true, editor:"select", editorParams: PopulateAuditFiles},
                { title:'Other Dat Titles Which Claim Match', field:'exclusive', editor:"select", editorParams: PopulateExclusive },
                { title:'Current Masterfile Assignment', field:'masterfilematch', sorter: 'string'},
                { title:'Audit File Score', field:'auditscore', sorter: 'number'},
                { title:'Dat Size', field:'datsize', sorter:'number', visible: false },
                { title:'Audit File Size', field:'auditsize', sorter: 'number', visible: false},
                { title:'File Size Difference', field:'auditdiff', sorter: 'number'},
                { title:'Dat CRC', field:'datcrc', visible: false},
                { title:'Audit CRC', field:'auditcrc', visible: false},
                { title:'Dat MD5', field:'datmd5', visible: false},
                { title:'Audit MD5', field:'auditmd5', visible: false},
                { title:'Dat SHA1', field:'datsha1', visible: false},
                { title:'Audit SHA1', field:'auditsha1', visible: false},
                { title:'Remove Association', formatter: RemoveColumnContent, width: 150, align: 'center', cellClick: RemoveColumnClick}
            ],
            data: _data
        });

        //add checkboxes for show/hide
        ShowHideColumns($('#romFileShow'), ['datname']);
        ShowHideColumns($('#sizeShow'), ['datsize', 'auditsize']);
        ShowHideColumns($('#crcShow'), ['datcrc', 'auditcrc']);
        ShowHideColumns($('#md5Show'), ['datmd5', 'auditmd5']);
        ShowHideColumns($('#sha1Show'), ['datsha1', 'auditsha1']);

        //create master file
        $('#create').on('click', function() {
            var $button = $(this);
            $button.attr('disabled', 'disabled');
            $('#processing').text('Working...');
            
            var titleToFile = {};
            _table.getData().forEach(data => {
                titleToFile[data.dattitle] = data.auditfile.split('.').slice(0, -1).join('.'); //also removes file ext
            });

            $.ajax({
                url: '/dev/roms/audit/' + _system,
                method: 'POST',
                data: {
                    tableData: JSON.stringify(titleToFile)
                },
                complete: function() {
                    $button.removeAttr('disabled');
                    $('#processing').text('Complete');
                }
            });
        });
    });

    var ShowHideColumns = function($checkbox, columns) {
        $checkbox.on('click', function() {
            columns.forEach(column => {
                _table.toggleColumn(column);
            })
            _table.redraw();
        });
    };

    var RemoveColumnClick = function(e, cell) {
        //alert("Printing row data for: " + cell.getRow().getData().datname);
        cell.getRow().update({ auditfile:''});
    };

    var RemoveColumnContent = function(cell, formatterParams, onRendered) { //plain text value
        return '<input type="button" value="Remove Association" />';
    };

    //this function populates the select box when "Audit File Match" is clicked. To be used to select correct match from all top scorers
    var PopulateAuditFiles = function(cell) {

        var name = cell.getRow().getData().datname;
        var options = {};

        _top[name].forEach(match => {
            options[match.item] = match.item + ' {' + match.score.toPrecision(5) + '}';
        });

        return options;
    };

    var PopulateExclusive = function(cell) {

        var title = cell.getRow().getData().dattitle;
        var auditfile = cell.getRow().getData().auditfile;

        var options = {};
        
        if (!_dupes.hasOwnProperty(auditfile)) {
            console.log('The audit file has already changed from its original definition');
            return;
        }

        _dupes[auditfile].forEach(match => {
            if (match.title != title) {
                options[match.item] = match.title + ' {' + match.score.toPrecision(5) + '}';
            }
        });
        return options;
    };

})();