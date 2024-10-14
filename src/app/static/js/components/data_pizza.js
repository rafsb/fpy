(function(fw, config) {

    const
    target = config.target?.empty() || $('#app')[0].empty()
    , colors = ['#FF0000', '#FF7F00', '#FFA500', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#8A2BE2']
    , rows = config.rows || {}
    , all_volumes = Object.entries(rows).map(([item, volume]) => volume * 1).reduce((p, q) => p + q, 0)
    , rect = target.getBoundingClientRect()
    , width = rect.width
    , height = (config.useParentHeight ? target.parentElement.getBoundingClientRect().height : rect.height) - fw.em2px(3)
    , pace = height / Object.keys(rows).length
    , stage = SVG({ attr: { width, height } })
    ;;

    Object.entries(rows).forEach(([ name, qty ], i) => {
        const perc = qty / all_volumes ;;
        stage.append([
            // circle
            SVG({
                tag: 'circle'
                , class: 'item-circle'
                , attr: { cx: width / 4, cy: height / 2, r: height / 6 * 2 - fw.em2px(2), volume: qty, perc }
                , css: { stroke: colors[i % colors.length], 'stroke-width': fw.em2px(2), fill: 'none' }
            })
            // label
            , SVG({
                tag: 'circle'
                , attr: { cx: width / 2 + fw.em2px(2), cy: pace / 2 + pace * i , r: fw.em2px(.75) }
                , css: { fill: colors[i % colors.length] }
            })
            , SVG({
                tag: 'text'
                , attr: { x: width / 2 + fw.em2px(6.5), y: pace / 2 + pace * i }
                , css: { fill: '{{font}}88', textAnchor: 'end', alignmentBaseline: 'middle' }
            }).text((perc * 100).nerdify(1) + '%')
            , SVG({
                tag: 'text'
                , attr: { x: width / 2 + fw.em2px(11), y: pace / 2 + pace * i }
                , css: { fill: '{{font}}66', textAnchor: 'end', alignmentBaseline: 'middle' }
            }).text(qty.nerdify())
            , SVG({
                tag: 'text'
                , attr: { x: width / 2 + fw.em2px(12), y: pace / 2 + pace * i }
                , css: { fill: '{{font}}', textAnchor: 'start', alignmentBaseline: 'middle' }
                , class: 'pointer'
            }).text(name).on('click', _ => fw.exec('components/historical_view', { item: name, anchor: config.anchor }))
        ])
    })

    target.append([ TAG('h2', 'row content-left').html(config.label || '=}'), stage ])

    stage.$('.item-circle').forEach(p => {
        const len = p.getTotalLength() ;;
        p.css({ "stroke-dashoffset": len, "stroke-dasharray": len })
    })

    setTimeout(_ => {
        let acc = 0 ;;
        stage.$('.item-circle').forEach((p, i) => setTimeout(() => {
            p.css({
                transformOrigin: `${width / 4}px ${height / 2}px`
            }).anime({ 
                "stroke-dashoffset": p.getTotalLength() - p.getTotalLength() * p.getAttribute('perc') * 1
                , transform: 'rotate(' + (360 * acc) + 'deg)'
            })
            acc += p.getAttribute('perc') * 1
        }, AL / 8 * i))
        // stage.$('.volume').forEach((p, i) => setTimeout(() => {
        //     p.anime({ transform: 'translateY(0)' })
        //     setTimeout(() => fw.increment(p, p.getAttribute('volume') * 1, { fixed: 1, suffix: '%' }), AL / 2)
        // }, AL / 8 * i))
        tooltips()
    }, AL)


})