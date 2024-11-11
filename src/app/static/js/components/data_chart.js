(function(fw, config) {
    const
    target = config.target?.empty() || $('#app')[0].empty()
    , colors = ['#FF0000', '#FF7F00', '#FFA500', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#8A2BE2']
    , rows = config.rows || {}
    , all_volumes = Object.entries(rows).map(([item, volume]) => volume * 1).reduce((p, q) => p + q, 0)
    , rect = target.getBoundingClientRect()
    , width = rect.width
    , height = (config.useParentHeight ? target.parentElement.getBoundingClientRect().height : rect.height) - fw.em2px(3)
    , length = Object.keys(rows).length
    , pace = width / length
    , stage = SVG({ attr: { width, height } })
    ;;

    Object.entries(rows).forEach(([ name, qty ], i) => {
        const 
        perc = qty / all_volumes 
        , y_anchor = height - fw.em2px(3) - (height - fw.em2px(6)) * perc
        ;;
        stage.append([
            // bar
            SVG({
                tag: 'line'
                , class: 'item-bar'
                , attr: { 
                    x1: parseInt(pace / 2 + pace * i)
                    , x2: parseInt(pace / 2 + pace * i)
                    , y1: height - fw.em2px(3)
                    , y2: y_anchor
                }
                , css: { 
                    stroke: colors[i % colors.length]
                    , 'stroke-width': config.strokeWidth || Math.min(pace / 2, fw.em2px(2))
                    , 'stroke-linecap': 'butt'
                    // , transform: 'skew(0deg, 45deg)'
                }
            })
            // bottom background
            , SVG({
                tag: 'rect'
                , attr: { x: pace * i, y: height - fw.em2px(3), width: pace, height: fw.em2px(3) }
                , css: { fill: '{{foreground}}' }
            })
            // bottom line
            , SVG({
                tag: 'line'
                , attr: { x1: pace * i, y1: parseInt(height - fw.em2px(3)), x2: pace * i + pace, y2: parseInt(height - fw.em2px(3)) }
                , css: { stroke: '{{font}}32', 'stroke-width': 2 }
            })
            // label
            , SVG({
                tag: 'text'
                , class: 'pointer'
                , attr: { x: parseInt(pace / 2 + pace * i), y: height - fw.em2px(1.5) }
                , css: { 
                    width: pace
                    , fill: '{{font}}'
                    , textAnchor: 'middle'
                    , alignmentBaseline: 'middle'
                    , transformOrigin: parseInt(pace / 2 + pace * i) + 'px ' + parseInt(height - fw.em2px(1.5)) + 'px'
                    , transform: `rotate(${config.rotateLabel || 0}deg)` 
                }
            }).text(name || '-').on('click', _ => fw.exec('components/historical_view', { item: name, anchor: config.anchor }))
            // volume
            , SVG({
                tag: 'text'
                , class: 'volume'
                , attr: { 
                    x: parseInt(pace / 2 + pace * i)
                    , y: y_anchor - fw.em2px(2)
                    , volume: (perc * 100).toFixed(1)
                }
                , css: { 
                    width: pace
                    , fill: '{{font}}88'
                    , textAnchor: 'middle'
                    , alignmentBaseline: 'middle'
                    , transform: 'translateY(' + (height - fw.em2px(5)) + 'px)'
                }
            }).text('0.0%')
        ])
    })

    target.append([
        TAG('h2', 'row content-left').html(config.label || '=}')
        , stage
    ])

    stage.$('.item-bar').forEach(p => {
        const len = p.getTotalLength() ;;
        p.css({ "stroke-dashoffset": len, "stroke-dasharray": len })
    })
    setTimeout(_ => {
        stage.$('.item-bar').forEach((p, i) => setTimeout(() => p.anime({ "stroke-dashoffset": 0 }), AL / 8 * i))
        stage.$('.volume').forEach((p, i) => setTimeout(() => {
            p.anime({ transform: 'translateY(0)' })
            setTimeout(() => fw.increment(p, p.getAttribute('volume') * 1, { fixed: 1, suffix: '%' }), AL / 2)
        }, AL / 8 * i))
        tooltips()
    }, AL)


})