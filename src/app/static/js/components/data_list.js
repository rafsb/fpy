(function(fw, config) {
    const
    target = config.target?.empty() || $('#app')[0].empty()
    , rows = config.rows || {}
    ;;
    
    let all_volumes = 0 ;;

    target.append([
        ROW('flex').append([
            TAG('h2', 'ellipsis content-left pr2').html(config.label || '\__')
            , TAG('div', 'col-1 pt2 pr').append(
                TAG('input', 'row px2 content.left', { 
                    borderRadius: '1.5em'
                    , border: '1px solid {{font}}12'
                    , background: '{{font}}12'
                    , color: '{{font}}'
                }).attr({ placeholder: 'Search', type: 'search' }).on(['keyup', 'blur'], ev => {
                    const query = ev.target.value.toLowerCase()
                    target.$('.item-row').forEach(p => p.style.display = p.textContent.toLowerCase().sanitized_compare(query) ? '' : 'none')
                    target.$('.rows')[0].scrollTo({ top: 0 })
                })
            )
        ])
        , ROW('rel row no-scrolls', { height: 'calc(100% - 6em)' }).append([
            ROW('wrap scrolls rows', { maxHeight: config.scrollHeight || '24em' }).append([
                ... Object.entries(rows).map(([item, volume]) => {
                    if(config.rem_zero && volume * 100 < 1) return null
                    all_volumes += volume * 1
                    return ROW('rel px item-row mv no-scrolls -tooltip', { borderRadius: '1.5em' }).append(
                        ROW('flex').append([
                            SPAN(item, 'px col-10 ellipsis content-left ml item pointer', { zIndex: 10 }).on('click', _ => fw.exec('components/historical_view', { item: item.split('|')[0], anchor: config.anchor }))
                            , SPAN('0', 'volume px mr col-2 content-right', { zIndex: 11 }).attr({ volume })
                            , DIV('abs row bar zbl', { background: '{{font}}08', borderRadius: '1.5em' })
                            , DIV('abs zbl bar progress', { width: 0, background: '{{span}}', borderRadius: '1.5em' }).attr({ volume })
                        ])
                    )
                })
            ])
        ])
        , config.label_suffix ? TAG('i', 'row pv2', { opacity: .32, textTransform: 'uppercase' }).append(
            SPAN(config.label_suffix, 'row content-right', { fontSize: '.75em' })
        ) : null
    ])
    
    const 
    item_rows = target.$('.item-row')
    , rows_stage = target.$('.rows')[0] 
    ;;
    
    if(config.sort) {
        item_rows.sort((p, q) => q.$('.volume')[0].getAttribute('volume') * 1 - p.$('.volume')[0].getAttribute('volume') * 1).forEach(row => rows_stage.append(row))
    }
    
    setTimeout(_ => {
        target.$('.progress').forEach((p, i) => {
            const css = { width: `${p.getAttribute('volume') * 1 / all_volumes * 100}%` } ;;
            if(p.inPage()) setTimeout(_ => p.anime(css), AL / 12 * i)
            else setTimeout(_ => p.css(css), AL * 2)
        })
        target.$('.volume').forEach((p, i) => {
            if(p.inPage()) setTimeout(_ => fw.increment(p, p.getAttribute('volume')*1, { fixed: 1, nerd: true }), AL / 12 * i)
            else setTimeout(_ => p.text((p.getAttribute('volume')*1).nerdify({ fixed: 1 })), AL * 4)
        })
    }, AL)
    
    item_rows.forEach(row => rows_stage.append(row.attr({ tip: (row.$('.volume')[0].getAttribute('volume') * 1 / all_volumes * 100).toFixed(1) + '%' })))

    tooltips()

})