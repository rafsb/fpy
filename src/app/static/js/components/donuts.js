(async function(fw, config) {
    const
    target = config.target?.empty() || $('#app')[0].empty()
    , rows = config.rows || {}
    , all_volumes = Object.entries(rows).map(([item, volume]) => volume * 1).reduce((p, q) => p + q, 0)
    , rect = target.getBoundingClientRect()
    , width = rect.width
    , height = rect.width * 2
    , stage = (await get('img/charts/donuts.svg')).prepare().morph()[0]
    ;;

    target.append(
        DIV('rel bar no-scrolls').append(
            stage.css({ width: Math.min(200, width), height: Math.min(500, height) })
        )
    )

    stage.$('.item').forEach(p => {
        const len = p.getTotalLength() ;;
        p.css({ "stroke-dashoffset": len, "stroke-dasharray": len })
    })

    let first_entry = 0 ;;
    Object.entries(rows).forEach(([ name, qty ], i) => {
        target.$('.item-name')[i]?.html(name.replace(/#\d\s+/gi, ''))
        const p = target.$('.item-perc .p')[i] ;;
        if (p) setTimeout(_ => fw.increment(p, qty / (all_volumes - (i ? first_entry : 0)) * 100, { fixed: 0 }), AL * 3 + AL / 4 * i)
        const c = stage.$('circle.donut')[i] ;;
        if (c) setTimeout(_ => c.anime({ "stroke-dashoffset": c.getTotalLength() - c.getTotalLength() * qty / (all_volumes - (i ? first_entry : 0)) }), AL * 3 + AL / 4 * i)
        tooltips()
        if(!i) first_entry = qty
    })


})