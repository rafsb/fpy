(async (fw, args) => {
    
    loading.on()
    
    const
    status_2 = fw.cache.status_2 || (await get('inventory_aging/distinct/status')).sort()
    , sizes = fw.cache.sizes || (await get('inventory_aging/distinct/sku_size')).sort()
    , plants = fw.cache.plants || (await get('inventory_aging/distinct/plant')).sort()
    , aging_period = fw.cache.aging_period || (await get('inventory_aging/distinct/period')).sort()
    , customers = fw.cache.customers || (await get('inventory_aging/distinct/customer_1')).sort()
    , departments = fw.cache.departments || (await get('inventory_aging/distinct/department_name')).sort()
    , stage = $(`main.-stage`)[0].empty().append([
        ROW('flex -filters').append([
            // HEADER
            DIV('col-2 px', { height: '2.75em' }).append(
                TAG('fmultiselect').attr({ name: 'period', label: 'Período' }).append([
                    ... aging_period.map(item => TAG('option').attr({ value: item || '' }).html(item || '-'))
                ])
            )
            , DIV('col-1 px', { height: '2.75em' }).append(
                TAG('fmultiselect').attr({ name: 'plant', label: 'Planta' }).append([
                    ... plants.map(item => TAG('option').attr({ value: item || '' }).html(item || '-'))
                ])
            )
            , DIV('col-2 px', { height: '2.75em' }).append(
                TAG('fmultiselect').attr({ name: 'sku_size', label: 'Formato' }).append([
                    ... sizes.map(item => TAG('option').attr({ value: item || '' }).html(item || '-'))
                ])
            )
            , DIV('col-1 px', { height: '2.75em' }).append(
                TAG('fmultiselect').attr({ name: 'status', label: 'Status' }).append([
                    ... status_2.map(item => TAG('option').attr({ value: item || '' }).html(item || '-'))
                ])
            )
            , DIV('col-2 px', { height: '2.75em' }).append(
                TAG('fmultiselect').attr({ name: 'customer_1', label: 'Carteira' }).append([
                    ... customers.map(item => TAG('option').attr({ value: item || '' }).html(item || '-'))
                ])
            )
            , DIV('col-2 px', { height: '2.75em' }).append(
                TAG('fmultiselect').attr({ name: 'department_name', label: 'Responsáveis' }).append([
                    ... departments.map(item => TAG('option').attr({ value: item || '' }).html(item || '-'))
                ])
            )
            , DIV('col-1 px content-left').append([
                DIV().append([
                    DIV('px2 pointer left', { 
                        borderRadius: '.25em'
                    }).append(SPAN('close', 'icon')).on('click', ev => ev.target.upFind('-filters').$('._multiselect').forEach(p => p.erase()))
                ])
                , DIV().append([
                    DIV('px2 pointer left', { 
                        borderRadius: '.25em'
                        , background: '{{span}}'
                        , color: '{{foreground}}'
                        , marginLeft: '.5em'
                    }).append(SPAN('refresh', 'icon ft')).on('click', build)
                ])
            ])
            , DIV('col-3 px').append(
                DIV('right ph flex').append([
                    TAG('label', 'col-6 content-right px', { opacity: .32 }).html('Volume<br>total')
                    , TAG('b', 'col-5 content-center px accumulated', { fontSize: '1.75em', opacity: .64 }).text('0')
                ])
            )
        ])
        , ROW('scrolls -content', { height: 'calc(100% - 3em)' }).append()
    ])
    ;;

    blend(fw.cache, { status_2, sizes, plants, aging_period, customers, departments })

    async function build() {
        
        loading.on()
        
        const
        target = stage.$('.-content')[0].empty()    
        , filters = stage.$('.-filters ._multiselect').reduce((p, ms) => { 
            const v = ms.form.json()[ms.attributes[`name`].value] ;;
            p[ms.attributes[`name`].value] = ![ undefined, null ].includes(v) ? [v].flat() : undefined
            return p 
        }, {})
        , cache_name = 'data-' + JSON.stringify(filters).hash()
        , data = fw.cache[cache_name] || (await post('/inventory_aging/rows', { data: { filters, limit: -1 } }))
        , all_volumes = data.reduce((p, q) => p + q.qty * 1, 0) || 1
        , container = ROW().append([
            TAG('div', 'row flex px2').append([
                TAG('aside', 'rel col-3 bar px2')
                , DIV('rel col-4 chart-stage no-scrolls bar px2')
                , DIV('rel col-5 pizza-stage no-scrolls bar px2')
            ])
            , TAG('div', 'row flex px2 no-scrolls mt4').append([
                DIV('rel col-2 bar plants px2')
                , DIV('rel col-2 bar sizes px2')
                , DIV('rel col-3 bar customers px2')
                , DIV('rel col-5 bar skus px2')
            ])
        ])
        ;;

        fw.cache.filters = filters
        fw.cache[cache_name] = data        
        fw.cache.data_name = cache_name

        target.append(container)

        { // PERIODOS
            const period_rows = {} ;;
            ;;(filters.period || aging_period).forEach(item => period_rows[item] = data.reduce((p, q) => q.period == item ? p + q.qty * 1000 : p, 0));;
            fw.exec('components/data_list', {
                target: container.$('aside.bar')[0]
                , rows: period_rows
                , label: 'Períodos'
                , anchor: 'period'
            })
        }

        { // DEPARTAMENTOS
            const department_rows = {} ;;
            ;;(filters.department_name || departments).forEach(item => department_rows[item] = data.reduce((p, q) => q.department_name == item ? p + q.qty * 1000 : p, 0));;
            setTimeout(_ => fw.exec('components/data_chart', {
                target: container.$('.chart-stage')[0]
                , rows: department_rows
                , label: 'Responsáveis'
                , anchor: 'department_name'
                , sort: true
                , useParentHeight: true
                , rotateLabel: -18 // degrees
            }), AL)
        }

        { // OBSOLESCENCIA
            const status_rows = {} ;;
            ;;(filters.status || status_2).forEach(item => status_rows[item] = data.reduce((p, q) => q.status == item ? p + q.qty * 1000 : p, 0));;
            setTimeout(_ => fw.exec('components/data_pizza', {
                target: container.$('.pizza-stage')[0]
                , rows: status_rows
                , label: 'Obsolescência'
                , useParentHeight: true
                , anchor: 'status'
                // , sort: true
            }), AL)
        }

        { // PLANTS
            const plants_rows = {} ;;
            (filters.plant || plants).forEach(plant => plants_rows[plant] = data.reduce((p, q) => q.plant == plant ? p + q.qty * 1 : p, 0))
            fw.exec('components/data_list', {
                target: container.$('.plants')[0]
                , rows: plants_rows
                , sort: true
                , label: 'Plantas'
                , rem_zero: true
                , anchor: 'plant'
            })
        }

        { // SKUS
            const skus = fw.cache.skus || (await get('inventory_aging/distinct/sku_code?add_field=sku_desc&sep=|')), skus_rows = {} ;;
            skus.forEach(sku => skus_rows[sku] = data.reduce((p, q) => q.sku_code == sku.split('|')[0].trim() ? p + q.qty * 1 : p, 0))
            fw.exec('components/data_list', {
                target: container.$('.skus')[0]
                , rows: skus_rows
                , sort: true
                , label: 'Materiais'
                , rem_zero: true
                , anchor: 'sku_code'
                , split: ' | '
            })
            fw.cache.skus = skus
        }

        { // SIZES
            const sizes = fw.cache.sizes || (await get('inventory_aging/distinct/sku_size')), sizes_rows = {} ;;
            (filters.sku_size || sizes).forEach(size => sizes_rows[size] = data.reduce((p, q) => q.sku_size == size ? p + q.qty * 1 : p, 0))
            fw.exec('components/data_list', {
                target: container.$('.sizes')[0]
                , rows: sizes_rows
                , sort: true
                , label: 'Formatos'
                , rem_zero: true
                , anchor: 'sku_size'
            })
            fw.cache.sizes = sizes
        }

        { // CUSTOMERS
            const customers_rows = {} ;;
            (filters.customer_1 || customers).forEach(customer => customers_rows[customer] = data.reduce((p, q) => q.customer_1 == customer ? p + q.qty * 1 : p, 0))
            fw.exec('components/data_list', {
                target: container.$('.customers')[0]
                , rows: customers_rows
                , sort: true
                , label: 'Carteiras'
                , rem_zero: true
                , anchor: 'customer_1'
            })
        }

        fw.increment($('b.accumulated')[0], all_volumes * 1000, { fixed: 1, nerd: true })

        loading.off()

    }

    build()
    
    multiselects()
    loading.off()
})