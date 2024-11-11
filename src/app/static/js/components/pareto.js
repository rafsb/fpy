(function(fw, config) {
    const
    target = config.target?.empty().addClass('rel mt4') || $('#app')[0].empty()
    , rows = (config.rows || []).sort((a, b) => b.qty - a.qty)
    , max = Math.max(... rows.map(d => d.qty))
    , data = rows.filter(p => p.qty / max > .01 ? p : null)
    , all = data.reduce((p, q) => p + q.qty, 0)
    , rect = target.getBoundingClientRect()
    , width = rect.width
    , height = fw.em2px(16)
    , length = data.length
    , pace = width / length
    , stage = SVG({ attr: { width, height } })
    ;;


    fw.pareto = { 
        change: (p=.2) => {
            const 
            bars = stage.$('.item-bar') 
            , line = stage.$('.acc-line')[0]
            , lines = []
            , d = []
            ;;
            let acc = 0 ;;
            data.forEach((r, i) => {
                const 
                bar = bars[i].attr({ tip: (r.qty).nerdify(3) })
                , len = bar.getTotalLength()
                ;;
                acc += r.qty
                bar.anime({ "stroke-dashoffset": len + len  * r.qty / max, opacity: acc / all < p ? 1 : .32 }, AL * 2)
                d.push([ parseInt(pace * i + pace / 2), parseInt(height - height * acc / all) ])
                if(acc / all < p) lines.push(r)
            })
            stage.append(line.attr({ d: `M${d[0]} L${d.slice(1).join(' ')}` }))
            const len = line.getTotalLength() ;;
            line.css({ 'stroke-dasharray': len, 'stroke-dashoffset': len })
            setTimeout(_ => line.anime({ 'stroke-dashoffset': 0 }, AL * 8), AL * 2)

            target.$('.pareto-lines table tbody')[0].empty().append([
                ... lines.map(p => {
                    const err_status = Boolean(p.lifespan > 180 && p.department_name == 'saleable') ;;
                    if(err_status) console.log(p)
                    const tr = TAG('tr', 'table-row pareto-row hash-' + p.ref + (err_status ? ' -tooltip' : ''), {
                        border: err_status ? '2px dashed {{alizarin}}' : null
                        , background: err_status ? '{{alizarin}}22' : null
                    }).attr({
                        tip: err_status ? 'This item has been in stock for more than 180 days and is in the sealable department' : null
                    }).append([
                        TAG('td').append(fw.special_fields.obsolete(p.obsolete, 'obsolete', p))
                        , TAG('td').append(fw.special_fields.sku_code(p.sku_code, 'sku_code', p))
                        , TAG('td').append(fw.special_fields.demmand(p.demmand, 'demmand', p))
                        , TAG('td').append(fw.special_fields.period(p.period, 'period', p))
                        , TAG('td').append(fw.special_fields.fcst(p.fcst, 'fcst', p))
                        , TAG('td').append(fw.special_fields.available(p.available, 'available', p))
                        , TAG('td').append(fw.special_fields.customer(p.customer, 'customer', p))
                        , TAG('td').append(fw.special_fields.actions(p.actions, 'actions', p))
                    ]) ;;
                    tr.item = p
                    return tr
                })
            ])
        }
    }

    stage.append([
        ... fw.iterate(0, length, i => {
            const 
            x = pace * i + pace / 2
            , y = height
            ;;

            return SVG({ tag: 'g' }).append([
                SVG({
                    tag: 'line'
                    , class: 'item-bar -tooltip'
                    , attr: { 
                        x1: x
                        , y1: 0
                        , x2: x
                        , y2: y
                        , tip: '=}'
                    }
                    , css: { 
                        stroke: '{{span}}'
                        , 'stroke-width': Math.min(pace, fw.em2px(2))
                    }
                })
            ])
        })
        , SVG({
            tag: 'path'
            , class: 'acc-line'
            , attr: {
                d: `M0,${height/2} L${width},${height/2}`
                , fill: 'none'
            }
            , css: { 
                stroke: '{{ice_pink}}'
                , 'stroke-width': 2
            }
        })
    ])

    target.append([
        stage
        , DIV('row px2').append([
            TAG('select', 'left perc bold content-center', {
                border: 'none'
                , background: '{{font}}12'
                , color: '{{font}}'
                , width: '12em'
            }).append([
                ... fw.iterate(20, 100, value => {
                    return TAG('option').css({ backgroundColor: '{{foreground}}' }).attr({ value }).html(value + '%')
                }, 20)
            ]).on('change', ev => fw.pareto.change(ev.target.value / 100))
            , TAG('label', 'px2 left', { opacity: .64 }, 'Choose the Pareto`s percetual of impact')
        ])
        , DIV('row scrolls pareto-lines', { height: 'calc(100vh - 32em)' }).append(
            TAG('table', 'row', { background: '{{foreground}}44' }).append([
                TAG('thead', 'sticky', { top: 0, zIndex: 10, background: '{{peter_river}}', color: 'white' }).append(
                    TAG('tr', 'content-center').append([
                        TAG('td', 'px2').html(translate('obsolete'))
                        , TAG('td', 'px2').html(translate('sku_code'))
                        , TAG('td', 'px2').html(translate('demmand'))
                        , TAG('td', 'px2').html(translate('period'))
                        , TAG('td', 'px2').html(translate('fcst'))
                        , TAG('td', 'px2').html(translate('available'))
                        , TAG('td', 'px2').html(translate('customer'))
                        , TAG('td', 'px2').html(translate('actions'))
                    ])
                )
                , TAG('tbody')
            ])
        )
    ])

    stage.$('.item-bar').forEach((p, i) => {
        const len = p.getTotalLength() ;;
        p.css({ "stroke-dashoffset": len, "stroke-dasharray": len })
    })

    fw.pareto.change()

    tooltips()
    
})