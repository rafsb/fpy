if (!fw.components.table) fw.components.table = async (config, stage) => {

    fw.cache.tablejs_colided_field = {}

    if (!special_fields) special_fields = {}
    blend(special_fields, config.special_fields)

    config.nocache = true // FOR TESTING

    const
        classname = `__Table__${config?.endpoint.replace(/[^0-9a-zA-Z]/g, '')}`
        ;;

    let loaded_filters;;
    try { loaded_filters = fw.storage(classname)?.json() || [] }
    catch (e) { loaded_filters = [] }

    stage.addClass(classname)

    const
        uri = `${config?.endpoint}${config?.payload ? `?${config.payload}` : ''}`
        , data = !config.nocache && fw.cache[uri.hash()] ? fw.cache[uri.hash()] : (await get(uri))
        , cols = data.cols
        , calculated_fields = cols && config.calculated_fields?.length ? cols.filter(col => config.calculated_fields.includes(col)).reverse() : []
        , rows = data.items
        , show_rows = new throttle(_ => {
            const list = $(`.${classname} .table-row.show`);;
            list.forEach(tr => tr.firstChild.style.display = tr.inPage(400) ? 'table-row' : 'none')
        }, 128)
        , order_rows = field => {
            const
                // index = e.target.index()
                body = stage.$('.table-body')[0]
                , rows = body.$('.table-row.show')
                ;;
            fw.cache.direction = !Boolean(fw.cache.direction)
            rows.sort((p, q) => {
                let
                    a = p.$('.' + field)?.at()?.textContent || 0
                    , b = q.$('.' + field)?.at()?.textContent || 0
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
            const col = DIV('px filter-element', { maxWidth: '24em', minWidth: '8em', height: '2.25em' });;
            if (config) {
                const prev_state = [loaded_filters.map(e => e[config.name]).filter(i => i)].flat().filter(i => i);;
                switch (config.type) {
                    case ('multiselect'): {
                        const tag = TAG('fmultiselect').attr({ name: config.name, placeholder: translate(config.label || config.name), value: prev_state.join(',') });;
                        col.app(tag)
                    } break
                    case ('date'): {
                        const tag = TAG('input', 'row').attr({ name: config.name, type: 'date', placeHolder: config.label || config.name });;
                        col.app(TAG(`form`, `relative wrap filter-element -tooltip`).attr({ action: 'javascript:void(0)', tip: (config.label ? config.label : '') + ' ' + config.name }).app([
                            tag
                            , TAG('input').attr({ value: config.operator || '==', name: 'operator', type: 'hidden' })
                            , TAG('input').attr({ value: 'date', name: 'type', type: 'hidden' })
                        ]))
                        if (prev_state.length) {
                            tag.value = prev_state.at(fw.cache.tablejs_colided_field[config.name] || 0)
                            fw.cache.tablejs_colided_field[config.name] = (fw.cache.tablejs_colided_field[config.name] || 0) + 1
                        }
                    } break
                    default: {
                        const tag = TAG('input', 'row').attr({ name: config.name, type: 'text', placeHolder: config.label || config.name }).on('keyup', ev => {
                            if (ev.key == 'Enter') fw.components.tablejs_search_ev()
                        });;
                        col.app(TAG(`form`, `wrap no-scrolls filter-element`).attr({ action: 'javascript:void(0)' }).app(tag))
                        if (prev_state.length) {
                            tag.value = prev_state.at(fw.cache.tablejs_colided_field[config.name] || 0)
                            fw.cache.tablejs_colided_field[config.name] = (fw.cache.tablejs_colided_field[config.name] || 0) + 1
                        }
                    } break
                }
            }
            return col
        }
        ;;

    fw.cache[uri.hash()] = data
    fw.components.tablejs_search_ev = _ => {

        const
            filters = $(`.${classname} form.filter-element`).map(f => f.json()).concat($(`.${classname} ._multiselect`).map(m => m.form.json())).filter(i => Object.keys(i).length)
            , mass = $(`.${classname} tr`).slice(1).map(e => e.parentElement.remClass('hide').addClass('show'))
            ;;

        fw.storage(classname, filters.json())

        filters.forEach(filter => {
            const op = filter.operator || '==';;
            const tp = filter.type;;
            // delete filter.operator
            // delete filter.type
            Object.keys(filter).forEach(fkey => {

                if (["operator", "type"].includes(fkey)) return

                const
                    fval = filter[fkey]
                    , fidx = cols.indexOf(fkey)
                    , frx = [fval].flat().join(fkey == 'search' ? '|' : '\\b|') + (fkey == 'search' ? '' : '\\b')
                    ;;

                mass.forEach(line => {
                    let v2check;;
                    if (fidx >= 0) v2check = line.$('td')[fidx]?.textContent.trim()
                    else v2check = line.$('td').map(cell => cell.textContent).join(' ')
                    switch (tp) {
                        case ('date'):
                            if (fval && !eval(fdate.guess(v2check).getTime() + op + fdate.guess(fval).getTime())) line.addClass('hide').remClass('show')
                            break
                        default:
                            if (fval && !(
                                frx.sanitized_compare(v2check)
                                || ([fval].flat().filter(i => i === true).length && v2check == '')
                            )) line.addClass('hide').remClass('show')
                            break
                    }
                })
            })
        })
        show_rows.fire()
        const
            list = $(`.${classname} .table-row.show`)
            , enumerator = $(`.${classname} .-enumerator`)[0]
            ;;
        increment(enumerator, list.length)
        calculated_fields.forEach(cf => {
            const
                x = $(`.${classname} .table-row.show`)?.reduce((acc, row) => acc + (row.item[cf] && !isNaN(row.item[cf]) ? row.item[cf] : 0), 0)
                , e = $(`.${classname} .${cf}.calc`)[0]?.addClass('-tooltip').attr({ tip: x.toFixed(1) })
                ;;
            if (e !== undefined && x !== undefined) increment(e, x * 1000, { nerd: true })
        })
        tooltips()
    }

    fw.components.tablejs_copy = (el, sep = '\t') => {
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
        $('body')[0].app(
            DIV(`fixed _menu _blured -table_header_menu_ev`, {
                background: fw.palette.BACKGROUND
                , color: fw.palette.FONT
                , borderRadius: '0 .5em .5em'
                , boxShadow: '0 0 .5em ' + fw.palette.DARK4
                , padding: '.25em'
                , minWidth: '10em'
                , maxWidth: '24em'
                , minHeight: '2em'
                , top: ev.clientY + 'px'
                , left: Math.min(window.innerWidth - fw.em2px(12), ev.clientX) + 'px'
                , zIndex: 100000
            }).app(
                DIV(`wrap relative`).app([
                    DIV(`row conetent-left ellipsis avoid-pointer px`, { opacity: .32 }).text('Ordering')
                    // , DIV('row px flex').app([
                    //     DIV('pointer px ph2', { borderRadius: '.25em', background: fw.palette.DARK2 }).text('1').on(`click`, _ => {
                    //         $(`.${classname} table td:nth-child(${index})`).attr({ colspan: 1 })
                    //     })
                    //     , DIV('pointer px ph2', { borderRadius: '.25em', background: fw.palette.DARK2 }).text('2').on(`click`, _ => {
                    //         $(`.${classname} table td:nth-child(${index})`).attr({ colspan: 2 })
                    //     })
                    //     , DIV('pointer px ph2', { borderRadius: '.25em', background: fw.palette.DARK2 }).text('3').on(`click`, _ => {
                    //         $(`.${classname} table td:nth-child(${index})`).attr({ colspan: 3 })
                    //     })
                    //     , DIV('pointer px ph2', { borderRadius: '.25em', background: fw.palette.DARK2 }).text('4').on(`click`, _ => {
                    //         $(`.${classname} table td:nth-child(${index})`).attr({ colspan: 4 })
                    //     })
                    // ])
                    , DIV(`row conetent-left ellipsis pointer px`).text('A - Z').on(`click`, _ => {
                        fw.cache.direction = false
                        order_rows(el.getAttribute('field'))
                    })
                    , DIV(`row conetent-left ellipsis pointer px`).text('Z - A').on(`click`, _ => {
                        fw.cache.direction = true
                        order_rows(el.getAttribute('field'))
                    })
                    // , DIV(`row conetent-left ellipsis pointer px2`).text('SUM (Σ)').on(`click`, _ => {
                    //     fw.notify(el.textContent.trim().toUpperCase() + ' SUM (Σ): ' + $(`.${classname} .table-row.show .cell:nth-child(${index})`).reduce((p, q) => p += isNaN(q.textContent) ? 0 : parseFloat(q.textContent), 0).toFixed(1))
                    // })
                    // , DIV(`row conetent-left ellipsis pointer px2`).text('AVG (x̄)').on(`click`, _ => {
                    //     fw.notify(el.textContent.trim().toUpperCase() + ' AVG (x̄): ' + $(`.${classname} .table-row.show .cell:nth-child(${index})`).map(p => isNaN(p.textContent) ? 0 : parseFloat(p.textContent)).average().toFixed(1))
                    // })
                ])
            )
                .on('mouseleave', e => e.target.closefn = setTimeout(_ => e.target.disappear(AL, true), AL / 2))
                .on('mouseenter', e => clearInterval(e.target.closefn))
        )
    }

    stage.app(
        TAG('main', "wrap roboto-mono-light no-scrolls tablejs", { padding: '.5em' }).app(
            WRAP(null, 'no-scrolls').css({ borderRadius: '.5em', border: `1px solid ${fw.palette.FONT}44` }).app([

                /**
                 * HEADER
                */
                DIV(`row`, {
                    backgroundColor: fw.palette.BACKGROUND
                    , zIndex: 100
                }).app(
                    DIV('tablejs-header', {
                        width: '100%'
                    }).app([
                        DIV(`row flex px`, {
                            justifyContent: 'flex-start'
                            , height: 'calc(2.75em + 2px)'
                        }).app([
                            ... (config.filters || []).map(filter_elements)
                            , filter_elements({ name: 'search', type: 'search' })
                            , DIV('px').app(
                                DIV('relative pointer searcher -tooltip', {
                                    height: '1.75em'
                                    , width: '3.25em'
                                    , borderRadius: '.25em'
                                    , background: fw.palette.FONT
                                    , boxShadow: '0 0 .5em ' + fw.palette.DARK3
                                }).app(
                                    SPAN('search', 'icon centered avoid-pointer', { color: fw.palette.WHITE })
                                ).on('click', _ => fw.components.tablejs_search_ev()).attr({ tip: 'Filter results' })
                            )
                            , DIV('col-1')
                            , DIV("relative px pointer erase-filters -tooltip", { width: '2em' }).attr({ tip: "Erase filters" }).app(
                                SPAN("backspace", "centered icon px", { fontSize: '1.5em', opacity: .64 })
                            ).on('click', ev => ev.target.upFind('tablejs-header').$('.filter-element').map(fe => {
                                const ms = fe.$('._multiselect')[0];;
                                if (ms) ms.erase()
                                else {
                                    const inp = fe.$('input')[0];;
                                    if (inp) {
                                        inp.value = ''
                                    }
                                }
                            }) && fw.components.tablejs_search_ev())
                        ])
                    ])
                )

                /**
                 * BODY
                */
                , DIV(`rel row table-body`, {
                    height: `calc(100% - 4.5em)`
                    , overflowY: 'auto'
                    , overflowX: 'auto'
                }).on('scroll', e => show_rows.fire()).app(
                    TAG('table', 'row', { fontSize: '.75em' }).app([
                        TAG('thead', 'row').app(
                            TAG('tr', `row table-header sticky`, {
                                top: 0
                                , background: fw.palette.HEADER
                                , color: fw.palette.FOREGROUND
                                , boxShadow: '.5em 0 .5em black'
                                , zIndex: 100
                            }).app([
                                config.allow_handlers ? TAG('th', 'rel', { width: '2em' }).app(
                                    DIV('centered').app(
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
                                    , `ellipsis content-center bold ucase pointer ${h}_header`
                                ).attr({
                                    colspan: config?.field_sizes && config.field_sizes[h] ? config.field_sizes[h] : 1
                                }).text(
                                    translate(h)
                                ).attr({ contextevent: "table_header_menu_ev", field: h })//.on('click', e => order_rows(h))
                                )//.on('click', e => fw.contextEvents.table_header_menu_ev(e.target, e)))
                            ])
                        )

                        , ...rows.map(item => {

                            const tr = TAG('tr', 'row', { display: 'none' });;

                            if (config.allow_handlers) tr.app(
                                TAG('td', 'rel', { width: '2em' }).app(
                                    DIV('centered pointer').app(
                                        TAG('input', 'pointer', { transform: 'scale(1.25)' }).attr({ type: 'checkbox' }).on('change', ev => ev.target.upFind('table-row')[ev.target.checked ? 'addClass' : 'remClass']('checked'))
                                    )
                                )
                            )

                            cols.forEach((h, i) => {
                                let e;;
                                if (special_fields[h]) e = special_fields[h](item[h], h, item)
                                else e = TAG('td', `content-center ellipsis ${h}`, null, `${item[h] || ''}`)
                                try {
                                    tr.app(e)
                                } catch (e) {
                                    console.trace(e)
                                }
                            })

                            const r = TAG('tbody', 'row table-row show', { height: '2em' }).app(tr);;

                            r.item = item
                            return r
                        })
                    ])
                )

                /**
                 * FOOTER
                */
                , DIV(`row`, { background: fw.palette.BACKGROUND }).app(
                    TAG(`footer`, `row -counter px`, {
                        fontSize: '.75em'
                        , boxShadow: '-.5em 0 .5em black'
                    }).app([
                        DIV('relative pointer -tooltip', { height: '1.75em', width: '2em' }).app(
                            SPAN('view_week', 'icon centered avoid-pointer', { fontSize: `1.5em`, opacity: .64 })
                        ).attr({
                            tip: `Erase column size`
                        }).on(`click`, _ => $(`.${classname} td`).attr({ colspan: 1 }))
                        , SPAN('0', 'right px pr2 -enumerator', { color: fw.palette.FONT })
                        , SPAN('Núm. Resgistros:', 'right px', { color: `${fw.palette.FONT}88` })
                        , ...calculated_fields.map(cf => DIV('right flex mr2').app([
                            SPAN(translate(cf) + ' (Σ):', 'px', { opacity: .64 })
                            , SPAN('0', cf + ' calc px -tolltip')
                        ]))
                    ])
                )
            ])
        ).on('refresh', _ => show_rows.fire())
    )

    $(`.${classname} fmultiselect`).forEach(ms => {

        const
            name = ms.getAttribute("name")
            , prev_state = [loaded_filters.map(e => e[name]).filter(i => i)[0]].flat().filter(i => i)
            ;;

        ms.setAttribute('value', prev_state.join(','))
        Array.from(new Set($(`.${classname} table tr td:nth-child(${cols.indexOf(name) + (config.allow_handlers ? 2 : 1)})`).slice(1).map(cell => cell.textContent.trim()))).forEach(cell => {
            ms.app(TAG('option').html(cell).attr({ value: cell }))
        })

    })

    $(`.${classname} .table-row`).forEach(row => row.setAttribute('contextevent', 'minimal_table_row'))

    fw.onPushstatePop.add(e => $('.erase-filters').at().dispatchEvent(new Event('click')))

    tooltips()
    multiselects()
    tileEffect('.-filter')

    return new Promise(pass => {
        setTimeout(_ => {
            show_rows.fire()
            $(`.${classname} ._multiselect`).forEach(ms => ms.fill_label())
            setTimeout(_ => {
                fw.components.tablejs_search_ev()
                if (config.post_process) config.post_process(stage.$('.tablejs')?.at())
                pass()
            }, AL)
        }, AL)
    })

}