(async (fw, args) => {
    const 
    departments = await get('departments') 
    , actions = await get('actions')
    , update = async data => {
        await post('/inventory_aging/update', { 
            data
            , cb: _ => fw.success('Record updated!')
        })
    }
    ;;

    fw.components.tablejs({
        endpoint: `inventory_aging${args?.payload ? '?' + args.payload : ''}`
        , filters: [
            { name: 'sku_code', type: 'multiselect' }
            , { name: 'sku_size', type: 'multiselect' }
            , { name: 'sku_desc', type: 'multiselect' }
            , { name: 'plant', type: 'multiselect' }
            , { name: 'department_name', type: 'multiselect' }
            , { name: 'customer', type: 'multiselect' }
            , { name: 'status', type: 'multiselect' }
            , { name: 'period', type: 'multiselect' }
            , { name: 'obsolete', type: 'multiselect' }
        ]   
        , allow_handlers: true
        , calculated_fields: [ 
            'available', 'blocked', 'quality', 'volume_total'
        ]   
        , special_fields: {
            period: (v, k, item)=> DIV('row px').append([
                SPAN(v, 'row content-left px')
                , SPAN('<b>' + item.lifespan + '</b> dias', 'row content-left px')
            ])
            , customer: v => SPAN(v, 'row content-left px')
            , plant: (v, k , item) => SPAN('<b>' + v + '</b>' + (item.ag || item.warehouse ? ' (' + [item.warehouse, item.ag].filter(i=>i).join('/') + ')' : ''), 'row content-left px')
            , available: (v, k, item) => ROW('px').append([
                SPAN((item.quality * 1 + item.blocked * 1).toFixed(3), 'row blck content-right px').css({ opacity: item.quality * 1 + item.blocked * 1 ? 1 : 0.32 })
                , TAG('b', 'row blck content-right px', {}, (v * 1).toFixed(3))
            ])
            , obsolete: (v, k) => {
                return DIV('rel wrap', { height: '2em' }).append([
                    DIV('abs centered circle px2', { background: v * 1 ? '{{alizarin}}' : '{{font}}22' })
                    , DIV('wrap abs pointer ' + k).on('click', ev => {
                        const 
                        row = ev.target.upFind('table-row')
                        , state = Boolean(row.item.obsolete * 1)
                        ;;
                        row.item.obsolete = state ? 0 : 1
                        if(!state) row.$('.circle.centered').css({ background: '{{alizarin}}' })
                        else row.$('.circle.centered').css({ background: '{{font}}22' })
                        // ev.target.upFind('table').$('.' + k).not(ev.target).forEach(e => e.dispatchEvent(new Event('click')))
                        update({ obsolete: state ? 0 : 1, hash: row.item.hash })
                        ev.target.upFind('table').$('.checked').forEach(row => {
                            row.item.obsolete = state ? 0 : 1
                            update({ obsolete: state ? 0 : 1, hash: row.item.hash })
                            if(!state) row.$('.circle.centered').css({ background: '{{alizarin}}' })
                            else row.$('.circle.centered').css({ background: '{{font}}22' })
                        }) 
                    })
                ])
            }
            , actions: (v, k, item) => {
                return DIV('row').append([
                    DIV('row flex').append([
                        DIV('col-3 px').append(
                            // ACTION
                            TAG('select', 'action row').attr({ placeholder: 'Ações' }).append([
                                TAG('option').attr({ value: '' }).html('-')
                                , ... actions.map(a => TAG('option').attr({ value: a.id }).html(a.name))
                            ]).on('change', ev => {
                                const item = actions.filter(a => a.id == ev.target.value)[0] ;;
                                ev.target.upFind('td').$('input.note')[0].value = item.description
                                update({ action: item.id, note: item.description, hash: ev.target.upFind('table-row').item.hash })
                                ev.target.upFind('table').$('.checked').forEach(row => {
                                    row.$('select.action').val(item.id)
                                    row.$('input.note').val(item.description)
                                    update({ action: item.id, note: item.description, hash: row.item.hash })
                                })
                            }).val(item.action||'')
                        )
                        // DEPT
                        , DIV('col-3 px').append(
                            TAG('select', 'department_name row').append([
                                TAG('option').attr({ value: '' }).html('-')
                                , ... departments.map(d => TAG('option').attr({ value: d.name }).html(d.name))
                            ]).on('change', ev => {
                                update({ department_name: ev.target.value, hash: ev.target.upFind('table-row').item.hash })
                                ev.target.upFind('table').$('.checked').forEach(row => {
                                    row.$('select.department_name').val(ev.target.value)
                                    update({ department_name: ev.target.value, hash: row.item.hash })
                                })
                            }).val(item.department_name || '')
                        )
                        // DATE LIMIT
                        , DIV('col-3 px').append(
                            TAG('input', 'row date_limit').attr({ type: 'date', placeholder : 'Data limite', value: item.limit_date }).on('change', ev => {
                                update({ hash: ev.target.upFind('table-row').item.hash, limit_date: ev.target.value })
                                ev.target.upFind('table').$('.checked').forEach(row => {
                                    row.$('input.limit_date').val(ev.target.value)
                                    update({ limit_date: ev.target.value, hash: row.item.hash })
                                })
                            })
                        )
                        // CHAR STORAGE
                        , DIV('col-3 px').append(
                            TAG('input', 'row px2 content-right charge_storage').attr({ type: 'number', value: item.charge_storage }).on('change', ev => {
                                update({ charge_storage: ev.target.value, hash: ev.target.upFind('table-row').item.hash })
                                ev.target.upFind('table').$('.checked').forEach(row => {
                                    row.$('.charge_storage input').val(ev.target.value)
                                    update({ charge_storage: ev.target.value, hash: row.item.hash })
                                })
                            })
                        )
                    ])
                    // NOTE
                    , DIV('row px').append(
                        TAG('input', 'row note').attr({ type: 'text', placeholder : 'Observações' }).on('change', ev => {
                            update({ note: ev.target.value, hash: item.hash })
                            ev.target.upFind('table').$('.checked').forEach(row => {
                                row.item.note = ev.target.value
                                row.$('input.notes').val(ev.target.value)
                                update({ note: ev.target.value, hash: row.item.hash })
                            })
                        }).val(item.note || '')
                    )
                ])
            }
            , sku_code: (v, k, item) => {
                return DIV('row px pointer').append([
                    DIV('row content-left px').html(`<b>${v}</b> (${item.sku_size})`)
                    , DIV('row content-left px').text(item.sku_desc)
                ]).on('click', ev => fw.copy2clipboard(v, true))
            }
            , status: (v, k , item) => {
                return ROW('row flex px').append([
                    SPAN(v || '-', 'col-4 content-center px bold')
                    , SPAN(item.abc || '-', 'col-4 content-center px')
                    , SPAN(item.flag || '-', 'col-4 content-center px')
                ])
            }
        }
        // , post_process: table => {
        //     setTimeout(_ => {
        //         const rows = table.$('.table-row.unprocessed').remClass('unprocessed') ;;
        //         rows.forEach(row => row.$('select.department_name')[0].value = row.item.department_name)
        //     }, AL)
        // }
    }, $(`main.-stage`)[0].empty()).then(_ => setTimeout(loading.off, AL * 2))
})