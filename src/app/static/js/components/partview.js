(async (fw, args) => {

    fw.components.tablejs({
        endpoint: `inventory_partial_view`
        , filters: [
            { name: 'sku_code', type: 'multiselect' }
            , { name: 'sku_size', type: 'multiselect' }
            , { name: 'sku_desc', type: 'multiselect' }
            , { name: 'plant', type: 'multiselect' }
            , { name: 'warehouse', type: 'multiselect'}
            , { name: 'department_name', type: 'multiselect' }
            , { name: 'customer', type: 'multiselect' }
            // , { name: 'customer_group', type: 'multiselect' }
            , { name: 'customer_global_group', type: 'multiselect' }
            // , { name: 'status', type: 'multiselect' }
            , { name: 'period', type: 'multiselect' }
            , { name: 'obsolete', type: 'multiselect' }
        ]   
        , allow_handlers: true
        , special_fields: fw.special_fields
        , tablejs_copy: function() {
            const 
            table = this
            , rows = table.$('.table-row')
            , data = rows.map(row => row.item)
            ;;
            return console.log(data)
        }
        // , post_process: table => {
        //     setTimeout(() => {
        //         const rows = table.$('.table-row.unprocessed').remClass('unprocessed') ;;
        //         rows.forEach(row => row.$('select.department_name')[0].value = row.item.department_name)
        //     }, AL)
        // }
    }, $(`main.-stage`)[0].empty()).then(() => setTimeout(loading.off, AL * 2))
})


// ev => {
//     const item = actions.filter(a => a.id == ev.target.value)[0] ;;
//     ev.target.upFind('td').$('input.note')[0].value = item.description
//     update({ action: item.id, note: item.description, hash: ev.target.upFind('table-row').item.hash })
//     ev.target.upFind('table').$('.checked').forEach(row => {
//         row.$('select.action').val(item.id)
//         row.$('input.note').val(item.description)
//         update({ action: item.id, note: item.description, hash: row.item.hash }, false)
//     }