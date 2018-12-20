(function() {

    var _self = this;
    var _table;
    var _system = window.application.system;
    var _data = window.application.data;
    var _top = window.application.top;
    var _dupes = window.application.dupes;
    var _type = window.application.type;
    var _masterfile = window.application.masterfile;

    $(document).ready(function() {
        
        _table = new Tabulator('#titles', {
            layout: 'fitColumns',
            columns: [
                { title:'Master File Title', field:'title', sorter:'string', headerFilter: true, width:400 },
                { title:'Audit File Match', field:'auditfile', width:400, headerFilter: true, editor:"select", editorParams: PopulateAuditFiles, cellEdited: FileCellEditted},
                { title:'Other Titles Which Claim Match', field:'exclusive', editor:"select", editorParams: PopulateExclusive },
                { title:'Current Masterfile Assignment', field:'masterfilematch', sorter: 'string'},
                { title:'Audit File Score', field:'auditscore', sorter: 'number'},
                { title:'Preview', field:'preview', width: 150, formatter: ImagePreview},
                { title:'Remove Association', formatter: RemoveColumnContent, width: 150, align: 'center', cellClick: RemoveColumnClick}
            ],
            data: _data
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
                url: '/dev/boxes/audit/' + _system,
                method: 'POST',
                data: {
                    type: _type,
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
        return '<a href="/dev/boxes/media/' + _type + '/' + _system + '/' + file + '" target="_blank"><img src="/dev/boxes/media/' + _type + '/' + _system + '/' + file + '" height="70px" /></a>';
    };

    //this function populates the select box when "Audit File Match" is clicked. To be used to select correct match from all top scorers
    var PopulateAuditFiles = function(cell) {

        var title = cell.getRow().getData().title;
        var options = {};

        _top[title].forEach(match => {
            options[match.item] = match.item + ' {' + match.score.toPrecision(5) + '}';
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

    var PopulateExclusive = function(cell) {

        var title = cell.getRow().getData().title;
        var auditfile = cell.getRow().getData().auditfile;

        var options = {};
        
        if (!_dupes.hasOwnProperty(auditfile)) {
            console.log('The audit file has already changed from its original definition');
            return;
        }

        _dupes[auditfile].forEach(match => {
            if (match.item != title) {
                options[match.item] = match.item + ' {' + match.score.toPrecision(5) + '}';
            }
        });
        return options;
    };

    var FileCellEditted = function(cell) {

        console.log('file cell editted');
        cell.getRow().reformat();
    };

})();