(function(fw, config) {
    const
    target = config.target?.empty() || $('#app')[0].empty()
    , w = getComputedStyle(target).width.replace('px', '') * 1
    , h = getComputedStyle(target).height.replace('px', '') * 1
    , colors = ['{{peter_river}}', '{{ice_pink}}', '{{wisteria}}']
    , rows = config.rows || {}
    , len = rows[0].length
    , series = [[], [], []]
    ;;

    rows.forEach((row, i) => {
        for (let j=1; j<row.length -1; j++) {
            if(!row[j] && row[j-1] && row[j+1]) row[j] = (row[j-1] + row[j+1]) / 2
        }
        series[i] = row.map(i => i ? i : row.trend(i)).reverse().progress()
    })

    const
    max = Math.max(... series.map(s => Math.max(... s)))
    , min = Math.min(... series.map(s => Math.min(... s)))
    , y = h
    , x = w / (series[0].length - 1)
    , svg = SVG({
        attr: {
            width: w
            , height: h
        }
    }).append([
        ... series.reverse().map((s, i) => {
            const
            g = SVG({ tag: 'g' })
            , path = SVG({ tag: 'path', attr : { fill: `none`, stroke: `url(#gradient-${i})`, 'stroke-width': 3, 'stroke-linecap': 'round' }})
            , d = [`0,${y/2}`].concat(s.map((v, j) => `${j * x + x / 2},${y - (v - min) / (max - min) * y * .5}`))
            , smooth = d.reduce((acc, point, index, array) => {
                if (index === 0) return `M${point}`
                
                const
                [ x1, y1 ] = point.split(',')
                , [ x0, y0 ] = array[index - 1].split(',')
                , cx = (parseFloat(x0) + parseFloat(x1)) / 2
                , cy = (parseFloat(y0) + parseFloat(y1)) / 2
                ;;
                return `${acc} Q${x0},${y0} ${cx},${cy}`
            }, '')
            ;;
            
            path.attr({ d: smooth })
            g.append(path)

            return g;
        })
    ])
    , gradient = [...colors].reverse().map((c, i) => SVG({ 
        tag: 'linearGradient'
        , attr: { id: `gradient-${i}`, x1: '0%', y1: '50%', x2: '100%', y2: '50%' }
    }).append([
        SVG({ tag:'stop', attr: { offset: '0%', 'stop-color': c, 'stop-opacity': 0 }})
        , SVG({ tag:'stop', attr: { offset: '100%', 'stop-color': c, 'stop-opacity': 1 }})
    ]))
    ;;

    target.addClass('relative').append([
        SPAN('Performance dos <b>10</b> últimos dias', 'abs top left px2', { opacity: .32 })
        , svg.append(gradient)
        , DIV('abs wrap zerp flex').append([
            ... fw.iterate(0, len - 1).map(i => {
                return DIV('col-1 bar -tooltip').attr({
                    tip: rows.map((s, j) => `<div class='left row flex px'>
                        <div class='col-1 px'><span class='icon' style='color:${colors[j]}'>timeline</span></div>
                        <div class='col-2 px'>${j == 2 ? (s[i+1] * 1).toFixed(1) + '%': (s[i+1]/10).nerdify(3)}</div>
                    </div>`).join('<br>')
                })
            })
        ])
    ])

    svg.$('path').forEach((path, i) => {
        const length = path.getTotalLength() ;;
        path.css({
            'stroke-dasharray': `${length},${length}`
            , 'stroke-dashoffset': length
        })
        setTimeout(_ => path.anime({ 'stroke-dashoffset': 0 }, AL * 8), (i + 1) * 2000)
    })

    tooltips()

})