(async (fw, config) => {
    
    loading.on()
    
    const
    departments = await get('departments') 
    , actions = await get('actions')
    , w = fw.window(null, config.anchor + ': ' + config.item, { background: '{{FOREGROUND}}AA', width: '80vw', height: '80vh' })
    , data = await post('inventory_aging/history', {
        data: {
            filters: blend({}, fw.cache.filters, {
                [config.anchor]: config.item
                , ts: fdate.plus(-10).as('Y-m-d')
            })
            , limit: -1
        }
    })
    , stage = w.$('div.content')[0].append([
        ROW('flex ph', { height: '40%' }).append([
            // CHART
            DIV('rel col-9 ph bar').append([
                DIV('-chart-stage row bar', {
                    background: '{{foreground}}aa'
                    , borderRadius: '.5em'
                })
                , DIV('abs ztr ph flex').append([
                    TAG('label', 'col-6 content-right px', { opacity: .32 }).html('Volume<br>total')
                    , TAG('b', 'col-5 content-center px accumulated', { fontSize: '1.75em', opacity: .64 }).text('0')
                ])
            ])
            , DIV('col-3 ph bar').append(
                DIV('wrap scrolls px -comment').append([
                    ... Object.entries(data).map(([ date, item ]) => DIV('row px').append([
                        ... item.marks.map(mark => DIV('row px bubble').attr({ date: fdate.guess(mark.ts).as('Y-m-d') }).append(
                            DIV('row px mb', { background: '{{sun_flower}}44', borderRadius: '.5em', border: '1px solid {{font}}44' }).append([
                                SPAN(mark.mark, 'row px content-left')
                                , SPAN(mark.value, 'row px content-left')
                                , SPAN(mark.note, 'row px content-left', { background: '{{font}}22' })
                            ])
                        ))
                    ]))
                ])
            )
        ])
        , ROW('rel flex -filters', { height: '4em' }).append([
            DIV('col-3')
            , DIV('rel col-6 px flex').append(
                DIV('row flex centered').append([
                    TAG('input', 'col-1 pv2 ph3', {
                        color: '{{font}}'
                        , background: '{{font}}22'
                        , borderRadius: '1.5em 0 0 1.5em'
                        , border: 'none'
                    }).attr({
                        type: 'search'
                        , placeholder: 'Search'
                    }).on('keyup', ev => {
                        const value = ev.target.value.toLowerCase()
                        stage.$('tr.item-row').forEach(p => {
                            const txt = p.textContent ;;
                            if(txt.sanitized_compare(value)) {
                                p.css({ display: 'table-row' })
                                p.addClass('active')
                            } else {
                                p.css({ display: 'none' })
                                p.remClass('active')
                            }
                        })
                    })
                    , DIV().append([
                        DIV('pv2 ph3 pointer', { 
                            borderRadius: '0 1.5em 1.5em 0'
                            , background: '{{span}}'
                        }).append(SPAN('search', 'icon ft')).on('click', _ => build())
                    ])
                ])
            )
            , DIV('col-3')
        ])
        , ROW('scrolls', { height: 'calc(60% - 4em)' }).append(TAG('table', '-content'))
    ])
    , build = async _ => {
        const
        qtys = Object.values(data).map(i => i.qty * 1)
        , max = Math.max(...qtys)
        , min = Math.min(...qtys)
        , acc = qtys.reduce((p, q) => p + q, 0)
        , target = stage.$('.-chart-stage')[0].empty()
        , rect = target.getBoundingClientRect()
        , pace = rect.width / Object.keys(data).length
        , volumes = Object.entries(data).map(([ _, item ]) => item.qty * 1)
        , lines = volumes.map(qty => rect.height - (qty - min) / (max - min) * (rect.height - fw.em2px(6)) - fw.em2px(.25))
        ;;

        target.append([
            SVG({ class: 'plot-area', attr: { width: rect.width, height: rect.height } }).append(
                SVG({
                    tag: 'path'
                    , attr: { 
                        d: [
                            'M-' + fw.em2px()
                            , lines.first()
                            , ... lines.map((qty, i) => `L${pace * i + pace/2 + (fw.em2px() * (i ? 1 : -1))} ${qty}`)
                            , 'L' + (rect.width + fw.em2px())
                            , lines.last()
                            , 'L' + (rect.width + fw.em2px())
                            , rect.height + fw.em2px(4)
                            , 'L-' + fw.em2px()
                            , rect.height + fw.em2px(4)
                            , 'Z'
                        ].join(' ')
                    }
                    , css: {
                        stroke: '{{span}}'
                        , "stroke-width": fw.em2px(.25)
                        , fill: 'url(#areafill)'
                        , zoom: 1.125
                    }
                })
            )
            , DIV('abs zero no-scrolls wrap flex').append(
                Object.entries(data).map(([ date, item ]) => DIV('rel col-1 points bar pointer', {
                    backgroundImage: 'linear-gradient(to bottom right, transparent, {{font}}12)'
                    , opacity: 0
                }).append([
                    DIV('abs row content-center zbl px').html(date)
                    , DIV('abs centered', { top: 'calc(' + lines.splice(0, 1) + 'px - 2em)' }).html(item.qty.nerdify())
                ]).on('mouseenter', ev => {
                    ev.target.upFind('wrap').$('.points').not(ev.target).forEach(p => p.anime({ opacity: 0 }))
                    ev.target.stop().anime({ opacity: 1 })
                    stage.$('tr.item-row.active, .bubble').forEach(p => p.addClass(p.getAttribute('date') == date ? 'show' : 'hide').remClass(p.getAttribute('date') == date ? 'hide' : 'show')) // p.css({ display: p.getAttribute('date') == date ? 'table-row' : 'none' }))
                }))
            )// .on('mouseleave', ev => stage.$('tr.item-row.active').forEach(p => p.css({ display: 'table-row' })))
        ])

        target.$('svg defs')[0].append(
            SVG({
                tag: 'linearGradient',
                attr: { id: 'areafill', x1: '0%', y1: '0%', x2: '0%', y2: '100%' }
            }).append([
                SVG({ tag: 'stop', attr: { offset: '0%', style: 'stop-color:{{span}};stop-opacity:.32' } })
                , SVG({ tag: 'stop', attr: { offset: '100%', style: 'stop-color:{{span}};stop-opacity:0' } })
            ])
        )

        const 
        cols = [
            'period',
            // 'lifespan',
            'sku_code',
            'status',
            // 'sku_size',
            // 'sku_desc',
            // 'abc',
            'plant',
            // 'ag',
            // 'flag',
            // 'warehouse',
            'customer',
            // 'quality',
            // 'blocked',
            'available',
            'obsolete',
            'department_name',
            'actions',
            // 'charge_storage'
        ]
        , content_stage = stage.$('.-content')[0].empty()
        , special_fields = {
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
                        fw.cache.update_line({ obsolete: state ? 0 : 1, hash: row.item.hash })
                        ev.target.upFind('table').$('.checked').forEach(row => {
                            row.item.obsolete = state ? 0 : 1
                            fw.cache.update_line({ obsolete: state ? 0 : 1, hash: row.item.hash }, false)
                            if(!state) row.$('.circle.centered').css({ background: '{{alizarin}}' })
                            else row.$('.circle.centered').css({ background: '{{font}}22' })
                        }) 
                    })
                ])
            }
            , actions: (v, k, item) => ROW('content-center px').append(
                DIV('pointer px', { borderRadius: '.5em', border: '{{foreground}}', background: '{{green_sea}}' }).append(
                    SPAN('add', 'icon', { color: '{{foreground}}' })).on('click', _ => fw.exec('components/action_modal', item)
                )
            )
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
        ;;

        content_stage.append(
            TAG('tr', 'item-head sticky px fg', { resize: 'horizontal', top:0 }).append(
                cols.map(col => TAG('th', 'px content-center bold ' + col).html(translate(col)))
            )
        )
        
        Object.entries(data).forEach(([ _, item ]) => item.items.sort((p, q) => q.qty - p.qty).forEach(row => content_stage.append(
            (_ => {
                const tr = TAG('tr', 'item-row active hide').attr({ date: fdate.guess(row.ts).as('Y-m-d') }).append([
                    ... cols.map(col => TAG('td', 'px ' + col).append(special_fields[col] ? special_fields[col](row[col], col, row) : SPAN(row[col]||'-', 'row')))
                ]) ;;
                tr.item = row ;;
                return tr
            })()
        )))

                

        // Smooth the path
        const
        path = target.$('path')[0]
        , length = path.getTotalLength()
        ;;
        path.attr({ "stroke-dasharray": [length, length], "stroke-dashoffset": length })
        setTimeout(_ => path.anime({ "stroke-dashoffset": 0 }, AL * 4), AL * 2)

        stage.$('.points').last().dispatchEvent(new Event('mouseenter'))

        fw.increment(stage.$('b.accumulated')[0], acc * 1, { fixed: 1, nerd: true })

        w.on('maximize', ev => ev.target.$('svg.plot-area').forEach(p => console.log(p.parentElement.getBoundingClientRect().width, p.width, p.getAttribute('width')) || p.anime({ zoom: p.parentElement.getBoundingClientRect().width / (p.getAttribute('width') * 1) })))

        fw.execs = {}
        
    }
    ;;

    build()

    return loading.off()

    // const
    // target = config.target?.empty() || $('#app')[0].empty()
    // , colors = ['#FF0000', '#FF7F00', '#FFA500', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#8A2BE2']
    // , rows = config.rows || {}
    // , all_volumes = Object.entries(rows).map(([item, volume]) => volume * 1).reduce((p, q) => p + q, 0)
    // , rect = target.getBoundingClientRect()
    // , width = rect.width
    // , height = (config.useParentHeight ? target.parentElement.getBoundingClientRect().height : rect.height) - fw.em2px(3)
    // , pace = height / Object.keys(rows).length
    // , stage = SVG({ attr: { width, height } })
    // ;;

    // Object.entries(rows).forEach(([ name, qty ], i) => {
    //     const perc = qty / all_volumes ;;
    //     stage.append([
    //         // circle
    //         SVG({
    //             tag: 'circle'
    //             , class: 'item-circle'
    //             , attr: { cx: width / 4, cy: height / 2, r: height / 2 - fw.em2px(2), volume: qty, perc }
    //             , css: { stroke: colors[i % colors.length], 'stroke-width': fw.em2px(2), fill: 'none' }
    //         })
    //         // label
    //         , SVG({
    //             tag: 'circle'
    //             , attr: { cx: width / 2 + fw.em2px(2), cy: pace / 2 + pace * i , r: fw.em2px(.75) }
    //             , css: { fill: colors[i % colors.length] }
    //         })
    //         , SVG({
    //             tag: 'text'
    //             , attr: { x: width / 2 + fw.em2px(6.5), y: pace / 2 + pace * i }
    //             , css: { fill: '{{font}}88', textAnchor: 'end', alignmentBaseline: 'middle' }
    //         }).text((perc * 100).nerdify(1) + '%')
    //         , SVG({
    //             tag: 'text'
    //             , attr: { x: width / 2 + fw.em2px(11), y: pace / 2 + pace * i }
    //             , css: { fill: '{{font}}66', textAnchor: 'end', alignmentBaseline: 'middle' }
    //         }).text(qty.nerdify())
    //         , SVG({
    //             tag: 'text'
    //             , attr: { x: width / 2 + fw.em2px(12), y: pace / 2 + pace * i }
    //             , css: { fill: '{{font}}', textAnchor: 'start', alignmentBaseline: 'middle' }
    //         }).text(name)
    //     ])
    // })

    // target.append([ TAG('h2', 'row content-left').html(config.label || '=}'), stage ])

    // stage.$('.item-circle').forEach(p => {
    //     const len = p.getTotalLength() ;;
    //     p.css({ "stroke-dashoffset": len, "stroke-dasharray": len })
    // })

    // setTimeout(_ => {
    //     let acc = 0 ;;
    //     stage.$('.item-circle').forEach((p, i) => setTimeout(() => {
    //         p.css({
    //             transformOrigin: `${width / 4}px ${height / 2}px`
    //         }).anime({ 
    //             "stroke-dashoffset": p.getTotalLength() - p.getTotalLength() * p.getAttribute('perc') * 1
    //             , transform: 'rotate(' + (360 * acc) + 'deg)'
    //         })
    //         acc += p.getAttribute('perc') * 1
    //     }, AL / 8 * i))
    //     // stage.$('.volume').forEach((p, i) => setTimeout(() => {
    //     //     p.anime({ transform: 'translateY(0)' })
    //     //     setTimeout(() => fw.increment(p, p.getAttribute('volume') * 1, { fixed: 1, suffix: '%' }), AL / 2)
    //     // }, AL / 8 * i))
    //     tooltips()
    // }, AL)

})