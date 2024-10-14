if (!fw.components.tablejs) fw.components.tablejs = async (config, stage) => {

    const
    classname = `__Table__${config?.endpoint.replace(/[^0-9a-zA-Z]/g, '')}`
    , special_fields = config?.special_fields || {}
    ;;

    let loaded_filters, load_more = true ;;
    try { loaded_filters = fw.storage(classname)?.json() || [] }
    catch (e) { loaded_filters = {} }

    const
    uri = config.endpoint || 'api'
    , cols = await get(uri + '/cols' ) || []
    , calculated_fields = cols && config.calculated_fields?.length ? cols.filter(col => config.calculated_fields.includes(col)).reverse() : []
    , show_rows = new throttle(e => {
        const list = $(`.${classname} .table-row.show`);;
        list.forEach(tr => tr.firstChild.style.display = tr.inPage(400) ? 'table-row' : 'none')
        if(e && (e.scrollTop + e.clientHeight) / e.scrollHeight > .8) search_ev(blend(config, { append: true }))
    }, 128)
    , order_rows = field => {
        const
        body = stage.$('.table-body')[0]
        , rows = body.$('.table-row.show')
        ;;
        fw.cache.direction = !Boolean(fw.cache.direction)
        rows.sort((p, q) => {
            let
                a = p.$(`.${field} select, .${field} input, .${field} textarea`).at()?.value || p.$('.' + field).at()?.textContent || 0
                , b = q.$(`.${field} select, .${field} input, .${field} textarea`).at()?.value || q.$('.' + field)?.at()?.textContent || 0
                ;;
            if (fw.cache.direction) {
                return isNaN(a) ? `${a}`.localeCompare(`${b}`) : a * 1 - b * 1
            } else {
                return isNaN(a) ? `${b}`.localeCompare(`${a}`) : b * 1 - a * 1
            }
        }).forEach(row => row.raise())
        show_rows.fire()
    }
    , filter_elements = config => {
        const col = DIV('px filter-element', { minWidth: '10em', height: '2.5em' });;
        if (config) {
            switch (config.type) {
                case ('multiselect'): {
                    const tag = TAG('fmultiselect').attr({ name: config.name, placeholder: translate(config.label || config.name).replace('<br>', ' ') });;
                    col.append(tag)
                } break
                case ('date'): {
                    const tag = TAG('input', 'row').attr({ name: config.name, type: 'date', placeHolder: config.label || config.name });;
                    col.append(TAG(`form`, `relative wrap filter-element -tooltip`).attr({ action: 'javascript:void(0)', tip: (config.label ? config.label : '') + ' ' + config.name }).append([
                        tag
                        , TAG('input').attr({ value: config.operator || '==', name: 'operator', type: 'hidden' })
                        , TAG('input').attr({ value: 'date', name: 'type', type: 'hidden' })
                    ]))
                } break
                default: {
                    const tag = TAG('input', 'row', { height: '2em' }).attr({ name: config.name, type: 'text', placeHolder: config.label || config.name }).on('keyup', ev => {
                        if (ev.key == 'Enter') search_ev(config)
                    });;
                    col.append(TAG(`form`, `wrap no-scrolls filter-element`).attr({ action: 'javascript:void(0)' }).append(tag))
                } break
            }
        }
        return col
    }
    ;;

    stage.tablejs_copy = config.tablejs_copy || function(el, sep = '\t') {
        let
        res = $(`.${classname} .table-header .cell`).map(e => e.textContent.trim()).join(sep)
            + '\n'
            + $(`.${classname} .table-row.show`).map(row => row.$(`.cell`).map(e => isNaN(e.textContent) ? e.textContent.trim() : (e.textContent * 1).toFixed(3).replace('.', ',')).join(sep)).join('\n')
        ;;
        fw.copy2clipboard(res)
        fw.success('Table successfully copied to clipboard!')
    }

    fw.contextEvents.table_header_menu_ev = (el, ev) => {   
        // const index = el.index() + 1 ;;
        $(`.${classname} .-table_header_menu_ev`).disappear(AL / 2, true)
        $('body')[0].append(
            DIV(`fixed px _menu _blured -table_header_menu_ev`, {
                background: fw.palette.FOREGROUND
                , color: fw.palette.FONT
                , borderRadius: '0 .5em 1em .5em'
                , boxShadow: '0 0 .5em ' + fw.palette.DARK4
                , border: '1px solid ' + fw.palette.FONT + '88'
                , minWidth: '10em'
                , maxWidth: '24em'
                , minHeight: '2em'
                , top: ev.clientY + 'px'
                , left: Math.min(window.innerWidth - fw.em2px(12), ev.clientX) + 'px'
                , zIndex: 100000
            }).append(
                DIV(`wrap relative`).append([
                    DIV('rel row px').append([
                        DIV('left pointer px mh', { borderRadius: '.25em', background: fw.palette.DARK2 }).text('<<').on(`click`, _ => {
                            el.anime({ width: (parseFloat(getComputedStyle(el).width) * .5) + 'px' })
                        })
                        , DIV(`centered avoid-pointer`, { opacity: .32 }).text('Size')
                        , DIV('right pointer px mh', { borderRadius: '.25em', background: fw.palette.DARK2 }).text('>>').on(`click`, _ => {
                            el.anime({ width: (parseFloat(getComputedStyle(el).width) * 2) + 'px' })
                        })
                    ])
                    , DIV(`row content-left ellipsis avoid-pointer px`, { opacity: .32 }).text('Ordering')
                    , DIV(`row content-left ellipsis pointer px`).text('A - Z').on(`click`, _ => {
                        fw.cache.direction = false
                        order_rows(el.getAttribute('field'))
                    })
                    , DIV(`row content-left ellipsis pointer px`).text('Z - A').on(`click`, _ => {
                        fw.cache.direction = true
                        order_rows(el.getAttribute('field'))
                    })
                ])
            )
                .on('mouseleave', e => e.target.closefn = setTimeout(_ => e.target.disappear(AL, true), AL / 2))
                .on('mouseenter', e => clearInterval(e.target.closefn))
        )
    }

    stage.append(
        TAG('main', "wrap no-scrolls tablejs px " + classname).append(
            WRAP(null, 'no-scrolls').css({ borderRadius: '.5em', border: `1px solid ${fw.palette.FONT}44` }).append([

                /**
                 * HEADER
                */
                DIV(`row`, { backgroundColor: fw.palette.FOREGROUND, zIndex: 100 }).append(
                    DIV('tablejs-header row px').append([
                        DIV(`row flex`, {
                            justifyContent: 'flex-start'
                        }).append([
                            ... (config.filters || []).map(filter_elements)
                            // , filter_elements({ name: 'search', type: 'search' })
                            , SPAN("close", "pointer icon px2 -tooltip").attr({
                                tip: "Erase filters"
                            }).on('click', ev => ev.target.upFind('tablejs-header').$('.filter-element').map(fe => {
                                const ms = fe.$('._multiselect')[0];;
                                if (ms) ms.erase()
                                else {
                                    const inp = fe.$('input')[0];;
                                    if (inp) inp.value = ''
                                }
                            }) && search_ev(config))
                            , DIV('px').append(
                                DIV('relative pointer searcher -tooltip', {
                                    height: '1.75em'
                                    , width: '3.25em'
                                    , borderRadius: '.25em'
                                    , background: fw.palette.SPAN
                                    , color: fw.palette.WHITE
                                    , boxShadow: '0 0 .5em ' + fw.palette.DARK3
                                }).append(
                                    SPAN('search', 'icon centered avoid-pointer')
                                ).on('click', _ => search_ev(blend(config, { append: false }))).attr({ tip: 'Filter results' })
                            )
                            , DIV('col-1')
                        ])
                    ])
                )

                /**
                 * BODY
                */
                , DIV(`rel row table-body`, {
                    height: `calc(100% - 5.25em)`
                    , overflowY: 'auto'
                    , overflowX: 'auto'
                }).on('scroll', e => show_rows.fire(e.target)).append(
                    TAG('table', 'row').append(
                        TAG('thead', 'row').append(
                            TAG('tr', `row table-header sticky`, {
                                top: 0
                                , background: fw.palette.SPAN
                                , color: fw.palette.WHITE
                                , boxShadow: '.5em 0 .5em black'
                                , zIndex: 100
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
                                ).attr({ contextevent: "table_header_menu_ev", field: h })//.on('click', e => order_rows(h))
                                )//.on('click', e => fw.contextEvents.table_header_menu_ev(e.target, e)))
                            ])
                        )
                    )
                )

                /**
                 * FOOTER
                */
                , DIV(`row`, { background: fw.palette.SPAN, color: fw.palette.WHITE }).append(
                    TAG(`footer`, `row -counter px`, { boxShadow: '-1em 0 1em black', background: '#00000032' }).append([
                        SPAN('0', 'right px mr -enumerator')
                        , SPAN('Núm. Resgistros:', 'right px', { opacity: .64 })
                        , ...calculated_fields.map(cf => DIV('right flex mr2').append([
                            SPAN(translate(cf).replace('<br>', ' ') + ' (Σ):', 'px', { opacity: .64 })
                            , SPAN('0', cf + ' calc px -tolltip')
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
            ...config.rows.map(item => {
                const tr = TAG('tr', 'row', { display: 'none' });;
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
                const r = TAG('tbody', 'row table-row show unprocessed', { height: '2em' }).append(tr).attr({ contextevent: 'row_menu' });;
                r.item = item
                return r
            }) || []
        ])

        if (config.post_process) config.post_process(stage)
    }
    
    function search_ev(config) {

        if(!load_more) return;

        load_more = false

        const
        tmp_filters = $(`.${classname} form.filter-element`).map(f => f.json()).concat($(`.${classname} ._multiselect`).map(m => m.form.json())).filter(i => Object.keys(i).length)
        , filters = {}
        ;;

        tmp_filters.forEach(f => filters[f.keys()[0]] = f.values()[0])

        fw.storage(classname, JSON.stringify(filters))

        return post(uri + '/rows', {
            data: { filters, offset: config.append ? $(`.${classname} .table-row`).length : 0, strict: true }
            , callback: res => {
                build_table(blend(config, { rows: res }))
                show_rows.fire()
                const
                list = $(`.${classname} .table-row.show`)
                , enumerator = $(`.${classname} .-enumerator`)[0]
                ;;
                fw.increment(enumerator, list.length)
                calculated_fields.forEach(cf => {
                    const
                    x = $(`.${classname} .table-row.show`)?.reduce((acc, row) => acc + (row.item[cf] && !isNaN(row.item[cf]) ? row.item[cf] * 1 : 0), 0)
                    , e = $(`.${classname} .${cf}.calc`)[0]?.addClass('-tooltip').attr({ tip: x?.toFixed(1) || '0' })
                    ;;
                    if (e !== undefined && x !== undefined) fw.increment(e, x * 1000, { nerd: true })
                })
                tooltips()
                show_rows.fire()
                load_more = true
            }
        })
    }

    const 
    mselects = $(`.${classname} fmultiselect`)
    , mloader = new Loader(mselects.map(ms => ms.uid()))
    ;;

    mloader.onFinishLoading.add(multiselects)

    $(`.${classname} fmultiselect`).forEach(ms => {
        const name = ms.getAttribute("name") ;;
        get(`${uri}/distinct/${name}`).then(res => {
            res.forEach(cell => {
                ms.append(TAG('option').html(cell || '').attr({ value: cell }))
            })
            mloader.ready(ms.uid())
        })
    })

    fw.contextEvents.row_menu = (el, ev) => {
        const item = ev.target.item || el.item || {} ;;
        $(`.-row-menu`).disappear(AL/2, true)
        $('body')[0].append(
            DIV(`fixed px _menu _blured -row-menu`, {
                background: fw.palette.FOREGROUND
                , borderRadius: '0 .5em 1em .5em'
                , boxShadow: '0 0 .5em ' + fw.palette.DARK4
                , border: '1px solid ' + fw.palette.FONT + '44'
                , minWidth: '10em' 
                , maxWidth: '24em'
                , top: ev.clientY + 'px'
                , left: ev.clientX + 'px'
                , zIndex: 9000
            }).append(
                DIV(`wrap relative`).append([
                    DIV(`row conetent-left ellipsis pointer px`).text('Copy table').on(`click`, e => stage.tablejs_copy())
                ])
            ).on('mouseleave', e => e.target.disappear(AL, true))
        )
    }

    fw.onPushstatePop.add(e => $('.erase-filters').at().dispatchEvent(new Event('click')))

    tooltips()
    tileEffect('.-filter')

    return new Promise(pass => {
        setTimeout(_ => {
            $(`.${classname} ._multiselect`).forEach(ms => ms.fill_label())
            setTimeout(_ => {
                config.append = false
                search_ev(config)
                pass()
            }, AL)
        }, AL)
    })

}