(async function(fw, config){
    console.log({ config })
    const
    w = fw.dialog(DIV('row px').append([
        DIV('row flex fields px').append([
            TAG('select', 'px mx').attr({ placeholder: 'Campos' }).append([
                ... Object.keys(config).map(item => TAG('option').attr({ value: item }).html(translate(item)))
            ])
            , TAG('select', 'px mx').attr({ placeholder: 'Operadores' }).append([
                TAG('option').attr({ value: 'eq' }).html('=')
                , TAG('option').attr({ value: 'ne' }).html('!=')
                , TAG('option').attr({ value: 'lt' }).html('<')
                , TAG('option').attr({ value: 'le' }).html('<=')
                , TAG('option').attr({ value: 'gt' }).html('>')
                , TAG('option').attr({ value: 'ge' }).html('>=')
                , TAG('option').attr({ value: 'in' }).html('in')
                , TAG('option').attr({ value: 'ni' }).html('not in')
                , TAG('option').attr({ value: 'rx' }).html('regex')
            ])
            , DIV('values').append(TAG('input', 'mx px').attr({ placeholder: 'Valor' }))
            , DIV('padd col-1')
            , TAG('input', 'pointer pv ph2', { background: '{{span}}' }).attr({ type: 'button', value: '+' }).on('click', _ => _)
        ])
        , ROW('px').append(
            DIV('row pt2 pl2 filters', { background: '{{font}}22', border: '1px solid {{font}}44', borderRadius: '.5em' })
        )
        , ROW('px').append([
            ROW('flex').append([
                DIV('col-1 content-right px2').html('Responsible')
                , DIV('col-2 px').append(
                    TAG('select', 'px').append([ ... ])
                )
            ])
        ])
    ]), 'Actions', { width: '40vw' })
    , add_filters = config => {
        const
        field = config?.field || w.$('select')[0].value
        , operator = config?.operator || w.$('select')[1].value
        , value = config?.value || w.$('input')[0].value
        , stage = w.$('.filters')[0]
        , pill = DIV('left px2 filter mr2 mb2', { background: '{{foreground}}', borderRadius: '.5em', border: '1px solid {{font}}44' }).append([
            SPAN(field||'empty', 'left px')
            , SPAN(operator||'empty', 'left px')
            , SPAN(value||'empty', 'left px')
            , DIV('left px pointer').append(SPAN('close', 'icon')).on('click', ev => ev.target.upFind('filter').remove())
        ])
        ;;
        if(field === undefined || operator === undefined || value === undefined) return config?.no_warn ? null : fw.error('Missing values!')
        pill.item = { field, operator, value }
        stage.append(pill)
    }
    ;;

    add_filters({ field: 'plant', operator: 'eq', value: config?.plant, no_warn: true })
    add_filters({ field: 'customer_1', operator: 'eq', value: config?.customer_1, no_warn: true })
    add_filters({ field: 'sku_code', operator: 'eq', value: config?.sku_code, no_warn: true })
    add_filters({ field: 'warehouse', operator: 'eq', value: config?.warehouse, no_warn: true })
    add_filters({ field: 'status', operator: 'eq', value: config?.status, no_warn: true })

    multiselects()

})