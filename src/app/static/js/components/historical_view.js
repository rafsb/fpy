(async (fw, config) => {
    loading.on()
    const 
    w = fw.window(null, config.anchor + ': ' + config.item, { background: '{{background}}AA', width: '80vw', height: '80vh' })
    , data = await post('inventory_aging/history', {
        data: {
            filters: blend(fw.cache.filters, {
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
                DIV('wrap scrolls px -comment', {
                    background: '{{sun_flower}}44'
                    , borderRadius: '.5em'
                }).append()
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
        , lines = volumes.map(qty => rect.height - (qty - min) / (max - min) * (rect.height - fw.em2px(8)) - fw.em2px(4))
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
                    DIV('abs zbl px').html(date)
                    , DIV('abs centered', { top: lines.splice(0, 1) + 'px' }).html(item.qty.nerdify())
                ]).on('mouseenter', ev => {
                    ev.target.upFind('wrap').$('.points').not(ev.target).forEach(p => p.anime({ opacity: 0 }))
                    ev.target.stop().anime({ opacity: 1 })
                    stage.$('tr.item-row.active').forEach(p => p.addClass(p.getAttribute('date') == date ? 'show' : 'hide').remClass(p.getAttribute('date') == date ? 'hide' : 'show')) // p.css({ display: p.getAttribute('date') == date ? 'table-row' : 'none' }))
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
            "ts",
            "abc",
            "plant",
            // "ag",
            // "aging",
            // "available",
            // "blocked",
            "department_name",
            "customer_1",
            // "customer_2",
            // "department_id",
            // "fcst",
            // "flag",
            // "id",
            // "last_production",
            "lot",
            // "note_id",
            // "obsolete",
            // "pallet_size",
            "period",
            // "quality",
            "sku_code",
            "sku_desc",
            "sku_size",
            // "sku_label",
            // "user_id",
            "warehouse",
            "status",
            "username",
            "note",
            "qty",
            "actions"
        ]
        , content_stage = stage.$('.-content')[0].empty()
        , special_fields = {
            ts: item => SPAN(fdate.guess(item.ts).as('Y-m-d'), 'row')
            , sku_code : item => SPAN(item.sku_code, 'row pointer ellipsis').on('click', _ => fw.success(`<b>${item.sku_code}</b> copied to clipboard`) && fw.copy2clipboard(item.sku_code))
            , qty: item => ROW('content-right', null, item.qty.toFixed(3))
            , actions: item => ROW('content-center px').append(
                DIV('pointer px', { borderRadius: '.5em', border: '{{foreground}}', background: '{{green_sea}}' }).append(
                    SPAN('add', 'icon ft')).on('click', _ => fw.exec('components/action_modal', item)
                )
            )
        }
        ;;
        content_stage.append(
            TAG('tr', 'item-head sticky px fg', { resize: 'horizontal', top:0 }).append(
                cols.map(col => TAG('th', 'px content-center bold ' + col).html(translate(col)))
            )
        )
        
        Object.entries(data).forEach(([ _, item ]) => item.items.sort((p, q) => q.qty - p.qty).forEach(row => content_stage.append(
            TAG('tr', 'item-row active hide').attr({ date: fdate.guess(row.ts).as('Y-m-d') }).append([
                ... cols.map(col => TAG('td', 'px ' + col).append(special_fields[col] ? special_fields[col](row) : SPAN(row[col]||'-', 'row')))
            ])
        )))

                

        // Smooth the path
        const
        path = target.$('path')[0]
        , length = path.getTotalLength()
        ;;
        path.attr({ "stroke-dasharray": [length, length], "stroke-dashoffset": length })
        setTimeout(_ => path.anime({ "stroke-dashoffset": 0 }, AL * 4), AL * 2)

        stage.$('.points').last().dispatchEvent(new Event('mouseenter'))

        fw.increment(stage.$('b.accumulated')[0], acc * 1000, { fixed: 1, nerd: true })

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