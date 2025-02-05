if (!fw.components.tablejs) fw.components.tablejs = async (config, stage) => {

    const
    classname = `__Table__${config?.endpoint.replace(/[^0-9a-zA-Z]/g, '')}`
    , special_fields = config?.special_fields || {}
    ;;

    let loaded_filters, load_more = true ;;
    try { loaded_filters = fw.storage(classname)?.json() || [] }
    catch (e) { loaded_filters = {} }

    if(!config.sorting) config.sorting = {} ;;

    const
    uri = config.endpoint || 'api'
    , cols = config.cols || (await get(uri + '/cols' )) || []
    , max_counter = config.max_counter || 0
    , calculated_fields = cols && config.calculated_fields?.length ? cols.filter(col => config.calculated_fields.includes(col)).reverse() : []
    , show_rows = new throttle(e => {
        const list = $(`.${classname} .table-row.show`) ;;
        list.forEach(tr => tr.firstChild.style.display = tr.inPage(400) ? 'table-row' : 'none')
        if(e && (e.scrollTop + e.clientHeight) / e.scrollHeight > .8) search_ev(blend(config, { append: true }))
        else loading.off()
    }, 128)
    , order_rows = field => {
        const
        body = stage.$('.table-body')[0]
        , rows = body.$('.table-row')
        , sorting_fn = config.sorting[field] || function(p, q) {
            const a = p.item[field] || 0, b = q.item[field] || 0 ;;
            if (fw.cache.direction) return isNaN(a) ? `${a}`.localeCompare(`${b}`) : a * 1 - b * 1
            else return isNaN(a) ? `${b}`.localeCompare(`${a}`) : b * 1 - a * 1
        }
        ;;
        rows.sort(sorting_fn).forEach(row => row.raise())
        fw.cache.direction = !Boolean(fw.cache.direction)
        setTimeout(_ => show_rows.fire(), 40)
    }
    , filter_elements = config => {
        const loaded_filters = JSON.parse(fw.storage(classname)) || {} ;;
        var tag ;;
        if (config) {
            switch (config.type) {
                case ('multiselect'): {
                    tag = TAG('fmultiselect').attr({
                        name: config.name
                        , placeholder: translate(config.label || config.name).replace('<br>', ' ')
                        , value: [loaded_filters[config.name]].flat().join(',')
                    });;
                } break
                case ('date'): {
                    const tmp = TAG('input', 'row').attr({ name: config.name, type: 'date', placeHolder: config.label || config.name }) ;;
                    tag = TAG(`form`, `wrap -tooltip`).attr({
                        action: 'javascript:void(0)'
                        , tip: (config.label ? config.label : '') + ' ' + config.name
                        , name: config.name || config.label
                    }).append([
                        tmp
                        , TAG('input').attr({ value: config.operator || '==', name: 'operator', type: 'hidden' })
                        , TAG('input').attr({ value: 'date', name: 'type', type: 'hidden' })
                    ])
                    if(loaded_filters[config.name]) tmp.value = loaded_filters[config.name][0]
                } break
                default: {
                    const tmp = TAG('input', 'row', { height: '2em' }).attr({
                        name: config.name
                        , type: 'text'
                        , placeHolder: config.label || config.name
                    }).on('keyup', ev => {
                        if (ev.key == 'Enter') {
                            load_more = true
                            search_ev(blend(config, { append: false }))
                        }
                    }) ;;
                    if(loaded_filters[config.name]) tmp.value = loaded_filters[config.name]
                    tag =TAG(`form`, `wrap -tooltip`).attr({ 
                        action: 'javascript:void(0)'
                        , tip: (config.label ? config.label : '') + ' ' + config.name
                        , name: config.name || config.label
                    }).append(tmp)
                } break
            }
        }
        return DIV(classname + ' px2 filter-element col', { height: '3.5em' }).append([
            TAG('label', 'left content-left ellipsis px2', { fontSize: '.75em', opacity: .64 }).html(
                config ? translate(config.label || config.name).replace('<br>', ' ') : ''
            )
            , ROW('rel').css({ height: '2.5em'}).append(tag)
        ])
    }
    ;;

    stage.append(
        TAG('main', "wrap no-scrolls tablejs px " + classname).append(
            WRAP(null, 'no-scrolls').css({ borderRadius: '.5em', border: `1px solid ${fw.palette.FONT}44` }).append([

                /**
                 * HEADER
                */
                DIV(`row`, { background: fw.palette.BACKGROUND, zIndex: 1000 }).append(
                    DIV('tablejs-header row px').append([
                        DIV(`row flex`).append([
                            DIV('col-1').append([
                                SPAN(translate('Active filters:'), 'px3 left', { opacity: .64 })
                                , DIV('active-filters px2 left ellipsis', { maxWidth: 'calc(100% - 10em)' }).append(
                                    filter_pill(loaded_filters)
                                )
                            ])
                            , SPAN("refresh", "pointer icon px2 -tooltip").attr({
                                tip: "Refresh"
                            }).on('click', ev => {
                                load_more = true
                                search_ev(blend(config, { append:false }))
                            })
                            , SPAN("filter_list", "pointer icon px2 -tooltip").attr({
                                tip: translate("Open filters")
                            }).on('click', load_filter_panel)
                            , SPAN("backspace", "pointer icon px2 erase-filters -tooltip").attr({
                                tip: "Erase filters"
                            }).on('click', ev => {
                                $(`.${classname} .pill`).map(fe => fe.remove())
                                fw.storage(classname, JSON.stringify({}))
                                load_more = true
                                search_ev(blend(config, { append:false }))
                            })
                        ])
                    ])
                )

                /**
                 * BODY
                */
                , DIV(`rel row table-body`, {
                    height: `calc(100% - 6em)`
                    , overflowY: 'auto'
                    , overflowX: 'auto'
                }).on('scroll', e => show_rows.fire(e.target)).append(
                    TAG('table', 'row').append(
                        TAG('thead', 'row ucase sticky', { top: 0, zIndex: 100 }).append(
                            TAG('tr', `table-header`, {
                                background: fw.palette.BACKGROUND
                                , color: fw.palette.FONT
                            }).append([
                                config.allow_handlers ? TAG('th', 'rel', { width: '2em' }).append(
                                    DIV('centered').append(
                                        TAG('input', 'pointer', {
                                            transform: 'scale(1.25)'
                                        }).attr({
                                            type: 'checkbox'
                                        }).on('click', ev => $(`.${classname} .table-row.show input[type=checkbox]`).forEach(i => {
                                            i.checked = ev.target.checked
                                            i.dispatchEvent(new Event('change'))
                                        }))
                                    )
                                ) : null
                                , ...cols.map(h => TAG(
                                    'th'
                                    , `ellipsis content-center bold ucase pointer pv2 ${h}_header`
                                ).attr({
                                    colspan: config?.field_sizes && config.field_sizes[h] ? config.field_sizes[h] : 1
                                }).html(
                                    translate(h)
                                // ).attr({ contextevent: "table_header_menu_ev", field: h })//
                                ).on('click', e => order_rows(h)))
                                // ).on('click', e => fw.contextEvents.table_header_menu_ev(e.target, e)))
                            ])
                        )
                    )
                )

                /**
                 * FOOTER
                */
                , DIV(`row bold px`, { background: fw.palette.BACKGROUND }).append(
                    TAG(`footer`, `row -counter`).append([
                        SPAN('/' + max_counter, 'right px mr', { opacity: .64 })
                        , SPAN('0', 'right px mr -enumerator')
                        , SPAN('Núm. Resgistros:', 'right px', { opacity: .64 })
                        , ...calculated_fields.map(cf => DIV('right flex mr2').append([
                            SPAN(translate(cf).replace('<br>', ' ') + ' (Σ):', 'px', { opacity: .64 })
                            , SPAN('-', cf + ' calc px -tolltip')
                        ]))
                    ])
                )
            ])
        ).on('refresh', _ => show_rows.fire())
    )

    function build_table(config) {
        const container = stage.$('.table-body table')[0] ;;
        if(!config.append) container.$('tbody')?.remove();
        container.append([
            ... config.rows?.map(item => {
                const tr = TAG('tr', 'table-row-tr', { display: 'none' });;
                if (config.allow_handlers) tr.append(
                    TAG('td', 'rel', { width: '2em' }).append(
                        DIV('centered pointer').append(
                            TAG('input', 'pointer', { transform: 'scale(1.25)' }).attr({ type: 'checkbox' }).on('change', ev => ev.target.upFind('table-row')[ev.target.checked ? 'addClass' : 'remClass']('checked'))
                        )
                    )
                )
                cols.forEach((h, i) => {
                    let e = TAG('td', `content-center px ${h}`).data({ field: h }).append(special_fields[h] ? special_fields[h](item[h], h, item) : SPAN(`${item[h] || ''}`)) ;;
                    try {
                        tr.append(e)
                    } catch (e) {
                        console.trace(e)
                    }
                })
                const r = TAG('tbody', 'row table-row show unprocessed', { height: '2em' }).append(tr);;
                r.item = item
                return r
            }) || []
        ])

        if (config.post_process) config.post_process(stage.$('.tablejs')[0])

    }

    function filter_pill(filter) {
        return Object.entries(filter||{}).map(([key, value]) => DIV('pill px mr -tooltip', { borderRadius: '.5em', background: fw.palette.FONT + '22' }).append([
            SPAN(key + ':', 'px left', { opacity: .64})
            , SPAN(Array.isArray(value) && value.length > 3 ? `${value.length} items` : `${[value].flat()}`, 'left px bold ellipsis', { maxWidth: '10em' })
            , DIV('left pointer').append(
                SPAN('close', 'icon pointer', { color: fw.palette.ALIZARIN })
            ).on('click', function() {
                loading.on()
                this.parent().remove()
                load_more = true
                const filters = {} ;;
                $(`.${classname} .pill`).forEach(e => filters[e.getAttribute('filter')] = e.getAttribute('tip').split(','))
                fw.storage(classname, JSON.stringify(filters))
                search_ev(blend(config, { append: false }))
            })
        ]).attr({ filter: key, tip: value }))
    }

    function load_filter_panel() {

        if(!config.filters?.length) return fw.warning('No filters available')

        loading.on()
        
        const w = fw.window(
            TAG('form', classname + ' row -filters').attr({ action: 'javascript:void(0)' }).append([
                DIV('row px2').append([
                    ... fw.iterate(0, Math.max(4, config.filters.length), i => {
                        return ROW('flex px2').append([
                            ... config.filters.slice(i, i + 4).map(filter_elements)
                        ])
                    }, 4)
                ])
                , ROW('px2 mt2').append([
                    DIV('right relative circle pointer searcher px2 mx2 -tooltip mx4', {
                        height: '4em'
                        , width: '4em'
                        , background: fw.palette.SPAN
                        , color: fw.palette.WHITE
                        , boxShadow: '0 0 1em ' + fw.palette.DARK3
                    }).append(
                        DIV('wrap rel').append(
                            SPAN('search', 'icon centered avoid-pointer', { fontSize: '1.5em' })
                        )
                    ).on('click', ev => {
                        loading.on()
                        load_more = true
                        const
                        filters = {} 
                        , tmp_filters = ev.target.upFind('-filters').json()
                        ;;
                        Object.entries(tmp_filters).forEach(([k, v]) => {
                            if (!Array.isArray(v) && typeof v == 'object' && v.type == 'date') {
                                if (v[k]) {
                                    const operator = v.operator || '=' ;; 
                                    filters[k] = [ v[k], null, operator ]
                                }
                            }
                            else filters[k] = v
                        })
                        fw.storage(classname, JSON.stringify(filters))
                        $(`.${classname} .active-filters`).at().empty().append(filter_pill(filters))
                        search_ev(blend(config, { append: false }))
                        w.close()
                    }).attr({ tip: 'Filter results' })
                    , DIV('left pointer pv4').append(
                        SPAN(translate('clear filters'), 'ucase px4', { opacity: .64 })
                    ).on('click', ev => {
                        const stage = ev.target.upFind('-filters') ;;
                        stage.$('._multiselect').forEach(i => i.erase())
                        stage.$('input, select').forEach(i => i.getAttribute('type') != 'hidden' ? i.value = '' : null)
                    })
                ])
            ])
            , 'Filters'
        ) ;;

        const 
        mselects = $(`.${classname} fmultiselect`)
        , mloader = new Loader(mselects.map(ms => ms.uid()))
        ;;
    
        mloader.onFinishLoading.add(_ => {
            multiselects()
            tooltips()
            tileEffect('.-filter')
            $(`.${classname} ._multiselect`).forEach(ms => ms.fill_label())
            loading.off()
        })
    
        $(`.${classname} fmultiselect`).forEach(async ms => {
            const 
            name = ms.getAttribute("name") 
            , cache_name = `/distinct/${name}`
            , res = fw.cache[cache_name] || await get(`${uri}${cache_name}`)
            ;;
            res.forEach(cell => {
                ms.append(TAG('option').html(cell || '').attr({ value: cell }))
            })
            mloader.ready(ms.uid())
        })

    }
    
    function search_ev(config) {

        if(!load_more) return
        load_more = false

        const filters = {} ;;
        $(`.${classname} .active-filters .pill`).forEach(e => {
            filters[e.getAttribute('filter')] = e.getAttribute('tip').split(',')
        })

        if(!config.append) {
            loading.on()
            post(`${uri}/count`, { data: { filters, strict: true } }).then(res => {
                if(res) stage.$('.-counter > span.right')[0].text('/ ' + res)
            })
        }

        return post(uri + '/rows', {
            data: { filters, offset: config.append ? $(`.${classname} .table-row`).length : 0, strict: true, limit: 200 }
            , callback: res => {
                build_table(blend(config, { rows: res.rows }))
                show_rows.fire()
                const
                list = $(`.${classname} .table-row.show`)
                , enumerator = $(`.${classname} .-enumerator`)[0]
                ;;
                fw.increment(enumerator, enumerator.innerText.replace(/[,.]+/gi, '') * 1 || 0, list.length, 1)
                calculated_fields.forEach(cf => {
                    const
                    x = $(`.${classname} .table-row.show`)?.reduce((acc, row) => acc + (row.item[cf] && !isNaN(row.item[cf]) ? row.item[cf] * 1 : 0), 0)
                    , e = $(`.${classname} .${cf}.calc`)[0]?.addClass('-tooltip').attr({ tip: x?.toFixed(1) || '0' })
                    ;;
                    if (e !== undefined && x !== undefined) fw.increment(e, 0, x, 1, { nerd: true })
                })
                show_rows.fire()
                load_more = Boolean(res.rows.length >= 200)
                tooltips()
                loading.off()
            }
        })
    }

    fw.onPushstatePop.add(e => $('.erase-filters').at().dispatchEvent(new Event('click')))
    fw.onSocketBroadcast.add(e => {
        if(e.tablejs) {
            const rows = $(`.table-row.hash-${e.tablejs.ref.hash()}`) ;;
            if (rows.length && fw.components.validateRow) rows.forEach(row => {
                Object.entries(e.tablejs.attrs).forEach(([k, v]) => row.item[k] = v)
                fw.components.validateRow(row)
            })
        }
    })

    loading.on()
    load_more = true
    search_ev(blend(config, { append: false }))

    const tjs = stage.$('.tablejs')[0] ;;
    tjs.order_rows = order_rows
    tjs.search_ev = search_ev
    tjs.build_table = build_table
    tjs.show_rows = show_rows

    if(config.onFinishLoading) config.onFinishLoading(tjs)
    
    return tjs

}