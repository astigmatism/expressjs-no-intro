(function() {

    var _self = this;
    var _table;
    var _system = window.application.system;
    var _tableData = window.application.tableData;
    var _topFilenameScoresForThisDatEntry = window.application.topFilenameScoresForThisDatEntry;
    var _multipleDatEnriesWhichClaimMatchToOneFile = window.application.multipleDatEnriesWhichClaimMatchToOneFile;
    var _masterfile = window.application.masterfile;

    $(document).ready(function() {
        
        _table = new Tabulator('#titles', {
            layout: 'fitColumns',
            columns: [
                { title:'Dat Title', field:'dattitle', sorter:'string', headerFilter: true, width:400 },
                { title:'Dat Rom File', field:'datname', sorter:'string', visible: false, width:400 },
                { title:'Audit File Match', field:'auditfile', width:400, headerFilter: true, editor:"select", editorParams: PopulateAuditFiles, cellEdited: FileCellEditted},
                { title:'Other Dat Titles Which Claim Match', field:'othermatches', editor:'select', editorParams: PopulateOtherMatchesSelect, formatter: PopulateOtherMatchesValue },
                { title:'Audit File Score', field:'auditscore', sorter: 'number'},
                { title:'Current Masterfile Assignment', field:'masterfileassignment', sorter: 'string', formatter: MasterfileMatch},
                { title:'MstFile Match', field:'masterfilematch', width:90,  align:'center', formatter: 'tickCross', sorter:'boolean' },
                { title:'Dat Size', field:'datsize', sorter:'number', visible: false },
                { title:'Audit File Size', field:'auditsize', sorter: 'number', visible: false},
                { title:'File Size Diff', field:'auditdiff', width:100, sorter: 'number'},
                { title:'Dat CRC', field:'datcrc', visible: false},
                { title:'Audit CRC', field:'auditcrc', visible: false},
                { title:'Dat MD5', field:'datmd5', visible: false},
                { title:'Audit MD5', field:'auditmd5', visible: false},
                { title:'Dat SHA1', field:'datsha1', visible: false},
                { title:'Audit SHA1', field:'auditsha1', visible: false},
                { title:'Remove Association', formatter: RemoveColumnContent, width: 150, align: 'center', cellClick: RemoveColumnClick}
            ],
            data: _tableData
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
        cell.getRow().reformat();
    };

    var RemoveColumnContent = function(cell, formatterParams, onRendered) { //plain text value
        return '<input type="button" value="Remove Association" />';
    };

    //this function populates the select box when "Audit File Match" is clicked. To be used to select correct match from all top scorers
    var PopulateAuditFiles = function(cell) {

        var name = cell.getRow().getData().datname;
        var options = {};

        _topFilenameScoresForThisDatEntry[name].forEach(match => {
            options[match.filename] = match.filename + ' {' + match.score.toPrecision(5) + '}';
        });

        return options;
    };

    var FileCellEditted = function(cell) {

        //with an auditfile change, the _multipleDatEnriesWhichClaimMatchToOneFile has now changed

        var datTitle = cell.getRow().getData().dattitle;
        var oldAuditFile = cell.getOldValue();
        var newAuditFile = cell.getValue();


        //remove old position
        //if it exists there, get it
        if (_multipleDatEnriesWhichClaimMatchToOneFile[oldAuditFile]) {
            var results = _multipleDatEnriesWhichClaimMatchToOneFile[oldAuditFile].PopObjectFromArray(datTitle, 'title');
            _multipleDatEnriesWhichClaimMatchToOneFile[oldAuditFile] = results[0];
            objectToInsert = results[1];
        }
        else {
            //otherwise create it. since we can't run a score on this one, just set it to 1
            objectToInsert = {
                title: datTitle,
                score: 1
            };
        }

        if (objectToInsert) {
            if (!_multipleDatEnriesWhichClaimMatchToOneFile.hasOwnProperty(newAuditFile)) {
                _multipleDatEnriesWhichClaimMatchToOneFile[newAuditFile] = [];
            }

            _multipleDatEnriesWhichClaimMatchToOneFile[newAuditFile] = _multipleDatEnriesWhichClaimMatchToOneFile[newAuditFile].ObjectArraySortedInsert(objectToInsert, 'score');

            //must also update the other row(s) which claim credit to this match
            cell.getTable().getRows().forEach(row => {
                if (row.getData().auditfile == newAuditFile) {
                    row.reformat();
                }
            });
        }
        cell.getRow().reformat();
    };

    var PopulateOtherMatchesValue = function(cell) {

        var auditfile = cell.getRow().getData().auditfile;

        //if it doesn't even exist
        if (!_multipleDatEnriesWhichClaimMatchToOneFile.hasOwnProperty(auditfile)) {
            return '';
        }

        //if there are more matches than just the current
        if (_multipleDatEnriesWhichClaimMatchToOneFile[auditfile].length == 1) {
            return '';
        }

        return 'They exist, click to see which...';
    };

    var PopulateOtherMatchesSelect = function(cell) {

        var title = cell.getRow().getData().dattitle;
        var auditfile = cell.getRow().getData().auditfile;

        var options = {};
        
        if (!_multipleDatEnriesWhichClaimMatchToOneFile.hasOwnProperty(auditfile)) {
            console.log('The audit file has already changed from its original definition');
            return;
        }

        _multipleDatEnriesWhichClaimMatchToOneFile[auditfile].forEach(match => {
            if (match.title != title) {
                options[match.item] = match.title + ' {' + match.score.toPrecision(5) + '}';
            }
        });
        return options;
    };

    var MasterfileMatch = function(cell, formatterParams, onRendered) {

        //cell - the cell component
        //formatterParams - parameters set for the column
        //onRendered - function to call when the formatter has been rendered

        var row = cell.getRow();
        var rowData = row.getData();
        var auditFileWithoutExt = rowData.auditfile.split('.').slice(0, -1).join('.');

        if (auditFileWithoutExt == rowData.masterfileassignment) {
            row.update({
                masterfilematch: true
            });
            return cell.getValue();
        }
        row.update({
            masterfilematch: false
        });
        return cell.getValue();
    };

})();