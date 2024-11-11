(function(fw, config) {
    const
    target = config.target?.empty().css({ minHeight: '18em' }) || $('#app')[0].empty()
    , rows = config.rows || {}
    ;;
    
    let all_volumes = 0 ;;

    target.append([
        ROW('flex', { justifyContent: 'space-around' }).append([
            TAG('h2', 'ellipsis content-center').html(config.label || '\__')
            , config.search ? TAG('div', 'col-1 pt2 pr').append(
                TAG('input', 'row px2 content.left', { 
                    border: '1px solid {{font}}12'
                    , background: '{{font}}12'
                    , color: '{{font}}'
                }).attr({ placeholder: 'Search', type: 'search' }).on(['keyup', 'blur'], ev => {
                    const query = ev.target.value.toLowerCase()
                    target.$('.item-row').forEach(p => p.style.display = p.textContent.toLowerCase().sanitized_compare(query) ? '' : 'none')
                    target.$('.rows')[0].scrollTo({ top: 0 })
                })
            ) : null
        ])
        , ROW('rel row no-scrolls', { height: 'calc(100% - 4em)' }).append([
            ROW('wrap scrolls -rows').append([
                ... Object.entries(rows).map(([item, volume]) => {
                    if(config.rem_zero && volume * 100 < 1) return null
                    all_volumes += volume * 1
                    return ROW('rel px item-row no-scrolls mv').append(
                        ROW('flex').append([
                            SPAN(item.replace(/#\d\s+/gi, ''), 'col-3 pv ph2 ellipsis content-left item pointer') //.on('click', _ => fw.exec('components/historical_view', { item: item.split('|')[0], anchor: config.anchor }))
                            , DIV('col-6', { background: '{{font}}16', borderRadius: '.25em' }).append(
                                DIV('wrap rel no-scrolls').append(
                                    DIV('abs zero progress', { 
                                        width: 0
                                        , height: '2em'
                                        , background: '{{peter_river}}'
                                    }).attr({ volume })
                                )
                            )
                            , DIV('col-3 content-right ellipsis').append([
                                SPAN('0', 'volume px mr').attr({ volume })
                                , SPAN('0%', 'perc bold px ml').css({ opacity: .32, width: '36%' }).attr({ volume })
                            ])
                        ])
                    )
                })
            ])
        ])
    ])
    
    const 
    item_rows = target.$('.item-row')
    , rows_stage = target.$('.-rows')[0] 
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
            if(p.inPage()) setTimeout(_ => fw.increment(p, p.getAttribute('volume')*1, { fixed: 1, nerd: true }), AL / 8 * i)
            else setTimeout(_ => p.text((p.getAttribute('volume')*1).nerdify({ fixed: 1 })), AL * 4)
        })
        target.$('.perc').forEach((p, i) => {
            if(p.inPage()) setTimeout(_ => fw.increment(p, p.getAttribute('volume')*1 / all_volumes * 100, { fixed: 1, suffix: '%' }), AL / 4 * i)
            else setTimeout(_ => p.text((p.getAttribute('volume') * 1 / all_volumes * 100).nerdify({ fixed: 1, suffix: '%' })), AL * 6)
        })
    }, AL)
    
    // item_rows.forEach(row => rows_stage.append(row.attr({ tip: (row.$('.volume')[0].getAttribute('volume') * 1 / all_volumes * 100).toFixed(1) + '%' })))

    // tooltips()

})