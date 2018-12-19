(function() {

    var _self = this;
    var _table;
    var _system = window.application.system;
    var _data = window.application.data;
    var _top = window.application.top;
    var _dupes = window.application.dupes;

    $(document).ready(function() {
        
        _table = new Tabulator('#titles', {
            layout: 'fitColumns',
            columns: [
                { title:'Master File Title', field:'title', sorter:'string', headerFilter: true, width:400 },
                { title:'Audit File Match', field:'auditfile', width:400, headerFilter: true, editor:"select", editorParams: PopulateAuditFiles, cellEdited: FileCellEditted},
                { title:'Other Titles Which Claim Match', field:'exclusive', editor:"select", editorParams: PopulateExclusive },
                { title:'Audit File Score', field:'auditscore', sorter: 'number'},
                { title:'Preview', field:'preview', formatter: ImagePreview},
                { title:'Remove Association', formatter: RemoveColumnContent, width: 150, align: 'center', cellClick: RemoveColumnClick}
            ],
            data: _data
        });

        //create master file
        $('#create').on('click', function() {
            var $button = $(this);
            $button.attr('disabled', 'disabled');
            $('#processing').text('Working...');
            
            //TODO: massage data back to server

            // $.ajax({
            //     url: '/boxes/audit/' + _system,
            //     method: 'POST',
            //     data: {
            //         tableData: JSON.stringify(titleToFile)
            //     },
            //     complete: function() {
            //         $button.removeAttr('disabled');
            //         $('#processing').text('Complete');
            //     }
            // });
        });
    });

    var ImagePreview = function(cell, formatterParams, onRendered) {

        //cell - the cell component
        //formatterParams - parameters set for the column
        //onRendered - function to call when the formatter has been rendered

        var file = cell.getRow().getData().auditfile;
        return '<img src="' + file + '" height="50px" />';
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

        //TODO update preview value
    };

})();