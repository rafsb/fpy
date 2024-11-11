(function(fw, config) {
    const
    target = config.target?.empty().css({ minHeight: '18em' }) || $('#app')[0].empty()
    , rows = config.rows || {}
    ;;
    
    let all_volumes = 0 ;;

    target.append([
        ROW('flex', { justifyContent: 'space-around' }).append(
            TAG('h2', 'ellipsis content-center').html(config.label || '\__')
        )
        , ROW('rel row scrolls', { height: 'calc(100% - 4em)' }).append([
            TAG('table').append([
                TAG('thead', 'sticky', { background: '{{span}}', color:'white', top: 0, zIndex: 1000000 }).append(
                    TAG('tr').append([
                        TAG('th', 'px2').html('Item')
                        , ... Object.keys(rows[Object.keys(rows)[0]]).map(status => TAG('th').html(status.replace(/^#\d+\s+/, '') || '-'))
                    ])
                )
                , ... Object.entries(rows).map(([size, obsoletes]) => {
                    const row = TAG('tr', 'table-row item-row').append(TAG('td').html(size)) ;;
                    row.volume = 0
                    Object.entries(obsoletes).forEach(([status, items]) => {
                        const local_volume = items.reduce((p, q) => p + q.qty * 1, 0) || 0 ;;
                        all_volumes += local_volume
                        row.volume += local_volume
                        row.append(TAG('td', 'volume px2 content-right', { opacity: .5 }).html('0.000').attr({ volume: local_volume }))
                    })
                    return row
                })
            ])
        ])
    ])
    
    const item_rows = target.$('.item-row') ;;
    if(config.sort) {
        item_rows.sort((p, q) => q.volume - p.volume).forEach(row => row.raise())
    }
    
    setTimeout(_ => {
        target.$('.item-row').forEach((row, i) => row.$('.volume').forEach((p, j) => {
            const volume = p.getAttribute('volume') * 1 ;;
            if(parseInt(volume*100)) {
                setTimeout(_ => fw.increment(p, volume, { fixed: 3, nerd: true }), AL/4 * (j + 1) * (i + 1))
                p.anime({ opacity:1, background: (!j ? '{{span}}' : '{{deep_pink}}') + fw.perc2hex(p.getAttribute('volume') * 1 / all_volumes) }, AL* (j + 1) * (i + 1))
            } else p.html('-').anime({ opacity: .32 })
        }))
    }, AL)

    // tooltips()

})