(function() {

    var _self = this;

    $(document).ready(function() {

        var table = new Tabulator('#systems', {
            layout:'fitColumns',
            columns: [
                { title:'System Name', field:'name', sorter:'string', width:400, editor:true },
                { title:'Rom Audit', field:'romaudit', formatter: 'link', formatterParams: {
                        label: 'audit',
                        urlPrefix: '/dev/roms/audit/',
                        urlField: 'id',
                        target: '_blank'
                    }
                },
                { title:'Box Front Audit', field:'boxfrontaudit', formatter: 'link', formatterParams: {
                        label: 'audit',
                        urlPrefix: '/dev/boxes/audit/front/',
                        urlField: 'id',
                        target: '_blank'
                    }
                },
                { title:'Title Screen Audit', field:'titlescreenaudit', formatter: 'link', formatterParams: {
                        label: 'audit',
                        urlPrefix: '/dev/screens/audit/title/',
                        urlField: 'id',
                        target: '_blank'
                    }
                },
                { title:'Screenshot Audit', field:'screenshotaudit', formatter: 'link', formatterParams: {
                    label: 'audit',
                    urlPrefix: '/dev/screens/audit/shots/',
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