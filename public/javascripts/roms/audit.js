(function() {

    var _self = this;
    var _table;
    var _system = window.application.system;
    var _data = window.application.data;
    var _top = window.application.top;
    var _tableData = [];

    $(document).ready(function() {

        var removeColumnClick = function(e, cell) {
            //alert("Printing row data for: " + cell.getRow().getData().datname);
            cell.getRow().update({ auditfile:''});
        };
        var removeColumnContent = function(cell, formatterParams, onRendered) { //plain text value
            return '<input type="button" value="Remove Association" />';
        };

        //this function populates the select box when "Audit File Match" is clicked. To be used to select correct match from all top scorers
        var populateAuditFiles = function(cell) {

            var name = cell.getRow().getData().datname;

            var options = {};

            _top[name].forEach(match => {
                options[match.item] = match.item + ' {' + match.score.toPrecision(5) + '}';
            });

            return options;
        };
        
        _table = new Tabulator('#titles', {
            layout: 'fitColumns',
            rowClick:function(e, row){
                row.update({ auditfile:''});
            },
            columns: [
                { title:'Dat Title', field:'dattitle', sorter:'string', width:400 },
                { title:'Dat Rom File', field:'datname', sorter:'string', visible: false, width:400 },
                { title:'Audit File Match', field:'auditfile', width:400, editor:"select", editorParams: populateAuditFiles},
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
                { title:'Remove Association', formatter: removeColumnContent, width: 150, align: 'center', cellClick: removeColumnClick}
            ],
            data: _data
        });

        //add checkboxes for show/hide
        ShowHideColumns($('#romFileShow'), ['datname']);
        ShowHideColumns($('#sizeShow'), ['datsize', 'auditsize']);
        ShowHideColumns($('#crcShow'), ['datcrc', 'auditcrc']);
        ShowHideColumns($('#md5Show'), ['datmd5', 'auditmd5']);
        ShowHideColumns($('#sha1Show'), ['datsha1', 'auditsha1']); 
    });

    var ShowHideColumns = function($checkbox, columns) {
        $checkbox.on('click', function() {
            columns.forEach(column => {
                _table.toggleColumn(column);
            })
            _table.redraw();
        });
    }

})();