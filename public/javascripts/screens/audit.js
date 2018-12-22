(function() {

    var _self = this;
    var _table;
    var _system = window.application.system;
    var _tableData = window.application.tableData;
    var _topFilenameScoresForThisDatEntry = window.application.topFilenameScoresForThisDatEntry;
    var _multipleDatEnriesWhichClaimMatchToOneFile = window.application.multipleDatEnriesWhichClaimMatchToOneFile;
    var _screenType = window.application.screenType;
    var _masterfile = window.application.masterfile;

    $(document).ready(function() {
        
        _table = new Tabulator('#titles', {
            layout: 'fitColumns',
            tooltipsHeader: true, //enable header tooltips
            columns: [
                { title:'Master File Title', field:'title', sorter:'string', headerFilter: true, width:400 },
                { title:'Audit File Match', field:'auditfile', width:400, headerFilter: true, editor:'select', editorParams: PopulateAuditFiles, cellEdited: OnAuditFileChanged},
                { title:'Other Titles Which Claim Match', field:'othermatches', editor:'select', editorParams: PopulateOtherMatchesSelect, formatter: PopulateOtherMatchesValue, cellEdited: OnOtherMatchesChanged },
                { title:'Audit File Score', field:'auditscore', sorter: 'number'},
                { title:'Current Masterfile Assignment', field:'masterfileassignment', sorter: 'string', formatter: MasterfileMatch},
                { title:'MstFile Match', field:'masterfilematch', width:90,  align:'center', formatter: 'tickCross', sorter:'boolean' },
                { title:'Preview', field:'preview', width: 150, formatter: ImagePreview},
                { title:'Remove Association', formatter: RemoveColumnContent, width: 150, align: 'center', cellClick: RemoveColumnClick}
            ],
            data: _tableData
        });

        //create master file
        $('#create').on('click', function() {
            var $button = $(this);
            $button.attr('disabled', 'disabled');
            $('#processing').text('Working...');
            
            var titleToFile = {};
            _table.getData().forEach(data => {
                titleToFile[data.title] = data.auditfile; //also removes file ext
            });

            $.ajax({
                url: '/dev/screens/audit/' + _system,
                method: 'POST',
                data: {
                    screenType: _screenType,
                    tableData: JSON.stringify(titleToFile)
                },
                complete: function() {
                    $button.removeAttr('disabled');
                    $('#processing').text('Complete');
                }
            });
        });
    });

    var ImagePreview = function(cell, formatterParams, onRendered) {

        //cell - the cell component
        //formatterParams - parameters set for the column
        //onRendered - function to call when the formatter has been rendered

        var file = cell.getRow().getData().auditfile;
        if (file == '') {
            return '';
        }
        return '<a href="/dev/screens/media/' + _screenType + '/' + _system + '/' + file + '" target="_blank"><img src="/dev/screens/media/' + _screenType + '/' + _system + '/' + file + '" height="100px" /></a>';
    };

    //this function populates the select screen when "Audit File Match" is clicked. To be used to select correct match from all top scorers
    var PopulateAuditFiles = function(cell) {

        var title = cell.getRow().getData().title;
        var options = {};

        _topFilenameScoresForThisDatEntry[title].forEach(match => {
            options[match.filename] = match.filename + ' {' + match.score.toPrecision(5) + '}';
        });

        return options;
    };

    var RemoveColumnClick = function(e, cell) {
        //alert("Printing row data for: " + cell.getRow().getData().datname);
        cell.getRow().update({ auditfile:''});
        cell.getRow().reformat();
    };

    var RemoveColumnContent = function(cell, formatterParams, onRendered) { //plain text value
        return '<input type="button" value="Remove Association" />';
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

        var title = cell.getRow().getData().title;
        var auditfile = cell.getRow().getData().auditfile;

        var options = {};
        
        if (!_multipleDatEnriesWhichClaimMatchToOneFile.hasOwnProperty(auditfile)) {
            //console.log('The audit file has already changed from its original definition');
            return options;
        }

        _multipleDatEnriesWhichClaimMatchToOneFile[auditfile].forEach(match => {
            if (match.datEntry != title) {
                options[match.datEntry] = match.datEntry + ' {' + match.score.toPrecision(5) + '}';
            }
        });
        return options;
    };

    var OnAuditFileChanged = function(cell) {

        //with an auditfile change, the _multipleDatEnriesWhichClaimMatchToOneFile has now changed

        var title = cell.getRow().getData().title;
        var oldAuditFile = cell.getOldValue();
        var newAuditFile = cell.getValue();

        //remove old position
        //if it exists there, get it
        if (_multipleDatEnriesWhichClaimMatchToOneFile[oldAuditFile]) {
            var results = _multipleDatEnriesWhichClaimMatchToOneFile[oldAuditFile].PopObjectFromArray(title, 'datEntry');
            _multipleDatEnriesWhichClaimMatchToOneFile[oldAuditFile] = results[0];
            objectToInsert = results[1];
        }
        else {
            //otherwise create it. since we can't run a score on this one, just set it to 1
            objectToInsert = {
                datEntry: title,
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

    var OnOtherMatchesChanged = function(cell, formatterParams, onRendered) {
        
        var value = cell.getData().othermatches;
        cell.getTable().setHeaderFilterValue("title", value);
    };

    var MasterfileMatch = function(cell, formatterParams, onRendered) {

        //cell - the cell component
        //formatterParams - parameters set for the column
        //onRendered - function to call when the formatter has been rendered

        var row = cell.getRow();
        var rowData = row.getData();
        
        if (rowData.auditfile == rowData.masterfileassignment) {
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