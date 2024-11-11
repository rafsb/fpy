(async (fw, args) => {
    
    loading.on()
    
    const
    sizes = fw.cache.sizes || (await get('inventory_aging/distinct/sku_size')).sort()
    , plants = fw.cache.plants || (await get('inventory_aging/distinct/plant')).sort()
    , aging_period = fw.cache.aging_period || (await get('inventory_aging/distinct/period')).sort()
    , customers = fw.cache.customers || (await get('inventory_aging/distinct/customer')).sort()
    , departments = fw.cache.departments || (await get('inventory_aging/distinct/department_name')).sort()
    , stage = $(`main.-stage`)[0].empty().append([
        ROW('flex -filters').append([
            // HEADER
            DIV('col-1 px', { height: '2.75em', opacity: .64 }).append(
                TAG('fmultiselect').attr({ name: 'period', label: 'Período' }).append([
                    ... aging_period.map(item => TAG('option').attr({ value: item || '' }).html(item || '-'))
                ])
            )
            , DIV('col-1 px', { height: '2.75em' }).append(
                TAG('fmultiselect').attr({ name: 'plant', label: 'Planta' }).append([
                    ... plants.map(item => TAG('option').attr({ value: item || '' }).html(item || '-'))
                ])
            )
            , DIV('col-1 px', { height: '2.75em' }).append(
                TAG('fmultiselect').attr({ name: 'sku_size', label: 'Formato' }).append([
                    ... sizes.map(item => TAG('option').attr({ value: item || '' }).html(item || '-'))
                ])
            )
            , DIV('col-2 px', { height: '2.75em' }).append(
                TAG('fmultiselect').attr({ name: 'customer', label: 'Carteira' }).append([
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
                        , background: '{{peter_river}}'
                        , color: 'white'
                        , marginLeft: '.5em'
                    }).append(SPAN('refresh', 'icon')).on('click', build)
                ])
            ])
            , DIV('col-4')
        ])
        , ROW('scrolls -content', { height: 'calc(100% - 3em)' })
    ])
    ;;

    blend(fw.cache, { sizes, plants, aging_period, customers, departments })

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
        , all_volumes = data.reduce((p, q) => p + q.qty, 0) || 1
        , healthy = data.reduce((p, q) => q.lifespan <= (30 * 6) ? p + q.qty : p + 0, 0) || 1
        // , old_volumes = data.reduce((p, q) => p + (q.period.trim()[0] == '2' ? q.qty * 1 : 0), 0) || 1
        , container = ROW().append([
            ROW().append([
                ROW('flex').append([
                    DIV('px col-2').append(
                        DIV('flex row no-scrolls', {
                            borderRadius: '.25em'
                            , background: '{{peter_river}}'
                            , color: 'white'
                        }).append([
                            DIV('col-3 px2').append(
                                SPAN('monitoring', 'icon px', { fontSize: '3em', opacity: .64 })
                            )
                            , DIV('col-9').append([
                                TAG('label', 'row content-right px2', { opacity: .32 }).html('Volume total')
                                , TAG('b', 'row content-right px accumulated', { fontSize: '1.75em' }).text('0')
                            ])
                        ])
                    )
                    , DIV('px col-2').append( 
                        DIV('flex row no-scrolls', {
                            borderRadius: '.25em'
                            , background: '{{royal_blue}}'
                            , color: 'white'
                        }).append([
                            DIV('col-3 px2').append(
                                SPAN('query_stats', 'icon px', { fontSize: '3em', opacity: .64 })
                            )
                            , DIV('col-9').append([
                                TAG('label', 'row content-right px2', { opacity: .32 }).html('Stock Obsoleto')
                                , TAG('b', 'row content-right px goodstock', { fontSize: '1.75em' }).text('0')
                            ])
                        ])
                    )
                    , DIV('px col-2').append( 
                        DIV('flex row no-scrolls', {
                            borderRadius: '.25em'
                            , background: '{{electric_purple}}'
                            , color: 'white'
                        }).append([
                            DIV('col-3 px2').append(
                                SPAN('query_stats', 'icon px', { fontSize: '3em', opacity: .64 })
                            )
                            , DIV('col-9').append([
                                TAG('label', 'row content-right px2', { opacity: .32 }).html('Stock Obsoleto')
                                , TAG('b', 'row content-right px badstock', { fontSize: '1.75em' }).text('0')
                            ])
                        ])
                    )
                    , DIV('px col-2').append(
                        DIV('flex row no-scrolls', {
                            borderRadius: '.25em'
                            , background: '{{deep_pink}}'
                            , color: '{{white}}'
                        }).append([
                            DIV('col-3 px2').append(
                                SPAN('target', 'icon px', { fontSize: '3em', opacity: .64 })
                            )
                            , DIV('col-9').append([
                                TAG('label', 'row content-right px2', { opacity: .64 }).html('Índice de Obs.')
                                , TAG('b', 'row content-right px healthy', { fontSize: '1.75em' }).text('0')
                            ])
                        ])
                    )
                    // , DIV('px col-4 flex').append(
                    //     DIV('row index-history bar', {
                    //         borderRadius: '.25em'
                    //         , backgroundImage: 'linear-gradient(to top right, {{foreground}}, transparent)'
                    //     })
                    // )
                ])
            ])
            , ROW('row flex px2').append([
                DIV('col-10 px2').append([
                    ROW('flex', { height: 'calc(100vh - 16em)' }).append([
                        DIV('col-6 px2 bar no-scrolls').append([
                            DIV('rel row px2 -departments', { height: '50%' })
                            , DIV('rel row px2 -sizes', { height: '50%' })
                        ])
                        , DIV('rel col-6 bar pv2 pl3 -customers', { borderLeft: '1px solid {{peter_river}}32' })
                    ])
                    , DIV('row px2 -pareto')
                ])
                , DIV('sticky col-2 bar', { top: 0 }).append(DIV('rel row bar px2 no-scrolls -periods'))
            ])
        ])
        ;;

        document.body.append(
            DIV('scrollers fixed zbr mv4 pv4 wd-2 roboto-thin content-center pointer',{ 
                fontSize: '1.5em'
                , transform: 'translateX(-.5em)'
                , textTransform: 'uppercase'
            }).append([
                SPAN('Tabelas', 'pointer row', { color: '{{font}}64' })
                , DIV('row pointer').append(
                    SPAN('swap_vert', 'icon', { fontSize: '2em', color: '{{sun_flower}}' })
                )
                , SPAN('Pareto', 'pointer row', { color: '{{font}}64', opacity: .32 })
            ]).on('click', ev => {
                const level = target.scrollTop / (target.scrollHeight - target.clientHeight) ;;
                $('.scrollers span')[1].anime({ transform: `rotate(${level > .5 ? 0 : 360}deg)` }, AL * 2)
                target.scroll({ top: level > .5 ? 0 : target.scrollHeight, behavior: 'smooth' })
            })
        )

        fw.cache.filters = filters
        fw.cache[cache_name] = data        
        fw.cache.data_name = cache_name

        target.append(container)

        // { // History
        //     const rows = await post('/inventory_aging/worms', { data: { filters } }) ;;
        //     await fw.exec('components/worms', { target: container.$('.index-history')[0], rows })
        // }

        { // Deparamentos
            // const period_rows = {} ;;
            // ;;(filters.period || aging_period).forEach(item => period_rows[item] = data.reduce((p, q) => q.period == item ? p + q.qty * 100 : p, 0));;
            const department_rows = {} ;;
            ;;(filters.department_name || departments).forEach(item => department_rows[item] = data.reduce((p, q) => q.department_name == item ? p + q.qty : p, 0));;
            await fw.exec('components/data_list', {
                target: container.$('.-departments')[0]
                // , rows: period_rows
                , rows: department_rows
                , label: 'Responsáveis'
                , anchor: 'department_name'
                , search: false
                , sort: true
            })
        }

        { // SIZES
            const sizes = fw.cache.sizes || (await get('inventory_aging/distinct/sku_size')), sizes_rows = {} ;;
            sizes.forEach(size => sizes_rows[size] = {})
            ;(filters.sku_size || sizes).forEach(size => aging_period.forEach(period => sizes_rows[size][period] = []));
            data.forEach(item => sizes_rows[item.sku_size][item.period].push(item))
            fw.exec('components/data_grid', {
                target: container.$('.-sizes')[0]
                , rows: sizes_rows
                , label: 'Formatos'
                , sort: true
            })
            fw.cache.sizes = sizes
        }

        { // CUSTOMERS
            const customers = fw.cache.customers || (await get('inventory_aging/distinct/customer')), customers_rows = {} ;;
            customers.forEach(cstmr => customers_rows[cstmr] = {})
            ;(filters.sku_size || customers).forEach(size => aging_period.forEach(period => customers_rows[size][period] = []));
            data.forEach(item => customers_rows[item.customer][item.period].push(item))
            fw.exec('components/data_grid', {
                target: container.$('.-customers')[0]
                , rows: customers_rows
                , label: 'Carteiras'
                , sort: true
            })
            fw.cache.sizes = sizes
        }

        { // Periodos
            const period_rows = {} ;;
            aging_period.forEach(item => period_rows[item] = data.reduce((p, q) => q.period == item ? p + q.qty : p, 0));;
            await fw.exec('components/donuts', {
                target: container.$('.-periods')[0]
                , rows: period_rows
            })
        }

        { // Pareto
            await fw.exec('components/pareto', {
                target: container.$('.-pareto')[0]
                , rows: data
            })
        }
            

        // { // DEPARTAMENTOS
        //     const department_rows = {} ;;
        //     ;;(filters.department_name || departments).forEach(item => department_rows[item] = data.reduce((p, q) => q.department_name == item ? p + q.qty * 1 : p, 0));;
        //     setTimeout(_ => fw.exec('components/data_chart', {
        //         target: container.$('.chart-stage')[0]
        //         , rows: department_rows
        //         , label: 'Responsáveis'
        //         , anchor: 'department_name'
        //         , sort: true
        //         , useParentHeight: true
        //         , rotateLabel: -18 // degrees
        //     }), AL)
        // }

        // { // PLANTS
        //     const plants_rows = {} ;;
        //     (filters.plant || plants).forEach(plant => plants_rows[plant] = data.reduce((p, q) => q.plant == plant ? p + q.qty * 1 : p, 0))
        //     fw.exec('components/data_list', {
        //         target: container.$('.plants')[0]
        //         , rows: plants_rows
        //         , sort: true
        //         , label: 'Plantas'
        //         , rem_zero: true
        //         , anchor: 'plant'
        //     })
        // }

        // { // SKUS
        //     const skus = fw.cache.skus || (await get('inventory_aging/distinct/sku_code?add_field=sku_desc&sep=|')), skus_rows = {} ;;
        //     skus.forEach(sku => skus_rows[sku] = data.reduce((p, q) => q.sku_code == sku.split('|')[0].trim() ? p + q.qty * 1 : p, 0))
        //     fw.exec('components/data_list', {
        //         target: container.$('.skus')[0]
        //         , rows: skus_rows
        //         , sort: true
        //         , label: 'Materiais'
        //         , rem_zero: true
        //         , anchor: 'sku_code'
        //         , split: ' | '
        //     })
        //     fw.cache.skus = skus
        // }

        // { // CUSTOMERS
        //     const customers_rows = {} ;;
        //     (filters.customer || customers).forEach(customer => customers_rows[customer] = data.reduce((p, q) => q.customer == customer ? p + q.qty * 1 : p, 0))
        //     fw.exec('components/data_list', {
        //         target: container.$('.customers')[0]
        //         , rows: customers_rows
        //         , sort: true
        //         , label: 'Carteiras'
        //         , rem_zero: true
        //         , anchor: 'customer'
        //     })
        // }

        target.on('scroll', ev => {
            const 
            opacity = ev.target.scrollTop / (ev.target.scrollHeight - ev.target.clientHeight) 
            , spans = $('.scrollers span')
            ;;
            spans[0].style.opacity = Math.min(1, 1 - opacity + .16)
            spans[2].style.opacity = Math.min(1, opacity +.16)
        })

        loading.off()

        fw.increment($('b.accumulated')[0], all_volumes, { nerd: true, fixed: 3 })
        fw.increment($('b.goodstock')[0], all_volumes - (all_volumes - healthy), { nerd: true, fixed: 3 })
        fw.increment($('b.badstock')[0], all_volumes - healthy, { nerd: true, fixed: 3 })
        fw.increment($('b.healthy')[0], (all_volumes - healthy) / all_volumes * 100, { fixed: 1, suffix: '%' })

    }

    multiselects()
    build()
})