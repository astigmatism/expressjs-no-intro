(function() {

    var _self = this;

    $(document).ready(function() {

        var table = new Tabulator('#systems', {
            layout:'fitColumns',
            columns: [
                { title:'Name', field:'name', sorter:'string', width:400, editor:true },
                { title:'Rom Audit', field:'romaudit', formatter: 'link', formatterParams: {
                        label: 'audit',
                        urlPrefix: '/roms/audit/',
                        urlField: 'id',
                        target: '_blank'
                    }
                },
                { title:'Box Front Audit', field:'boxfrontaudit', formatter: 'link', formatterParams: {
                    label: 'audit',
                    urlPrefix: '/boxes/audit/front/',
                    urlField: 'id',
                    target: '_blank'
                }
            }
            ]
        });

        $.each(window.application.systems, function(k, v) {

            table.addData([{ id: v.key, name: v.name }]);
        });
    });
})();