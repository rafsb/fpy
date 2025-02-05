(async function(fw, config) {
    
    $('.theme-editor').forEach(e => e.close())

    if(!fw.user) {
        $('select.themes')[0].value = fw.storage('theme')
        return fw.warning(translate('You need to be logged in order to complete this operation.'))
    }
    
    const
    theme = {
        BACKGROUND  : fw.palette.BACKGROUND
        , FOREGROUND: fw.palette.FOREGROUND
        , FONT      : fw.palette.FONT
        , SPAN      : fw.palette.SPAN
        , C1        : fw.palette.C1
        , C2        : fw.palette.C2
        , C3        : fw.palette.C3
        , C4        : fw.palette.C4
        , type      : fw.palette.type
        , name      : "new_theme"
    }
    , w = fw.dialog(DIV('row px -bg', { background: theme.BACKGROUND }).append([
        ROW('flex px2', { height: '12em' }).append([
            DIV('rel col bar pointer -c', { background: theme.C1 }).append([
                TAG('input', 'abs avoid-pointer zero', { height:0, opacity: 0 }).attr({ type: 'color', value: theme.C1 })
                , DIV('abs px xr avoid-pointer centered', { background: '#00000044', color: 'white' }).html(theme.C1)
            ])
            , DIV('rel col bar pointer -c', { background: theme.C2 }).append([
                TAG('input', 'abs avoid-pointer zero', { height:0, opacity: 0 }).attr({ type: 'color', value: theme.C2 })
                , DIV('abs px xr avoid-pointer centered', { background: '#00000044', color: 'white' }).html(theme.C2)
            ])
            , DIV('rel col bar pointer -c', { background: theme.C3 }).append([
                TAG('input', 'abs avoid-pointer zero', { height:0, opacity: 0 }).attr({ type: 'color', value: theme.C3 })
                , DIV('abs px xr avoid-pointer centered', { background: '#00000044', color: 'white' }).html(theme.C3)
            ])
            , DIV('rel col bar pointer -c', { background: theme.C4 }).append([
                TAG('input', 'abs avoid-pointer zero', { height:0, opacity: 0 }).attr({ type: 'color', value: theme.C4 })
                , DIV('abs px xr avoid-pointer centered', { background: '#00000044', color: 'white' }).html(theme.C4)
            ])
        ])
        , ROW('px2 content-left', { color: theme.FONT }).append([
            ROW('flex').append([
                DIV('col content-left px -ft').text(translate('Theme name'))
                , TAG('input', 'mx content-left').val(theme.name).on('change', function() { theme.name = this.value })
            ])
            , DIV('row px tile -tp -bd -fg', { border: '1px solid ' + theme.FONT + '44', borderRadius: '.25em', background: theme.FOREGROUND }).append(
                ROW('flex').append([
                    DIV('col content-left px -ft').text(translate('Dark theme?'))
                    , TAG('input', 'px mh avoid-pointer', { transform: 'scale(1.25)' }).attr({ type: 'checkbox', checked: theme.type == 'dark' ? true : null })
                ])
            )
            , ROW('flex mt4').append([
                TAG('button', 'pointer pv2 ph3', {
                    background: '{{alizarin}}'
                    , color: 'white'
                }).text(translate('Close')).on('click', _ => w.close())
                , DIV('col')
                , TAG('button', 'pointer pv2 ph3', {
                    background: '{{green_sea}}'
                    , color: 'white'
                }).text(translate('Save')).on('click', _ => post('theme/save', { 
                    data: { theme }
                    , cb: res => {
                        console.log(res)
                        if(res.status) {
                            fw.success(translate('Theme saved successfully. System will restart in a few seconds.'))
                            fw.storage('theme', theme.name)
                            setTimeout(_ => location.reload(), AL * 4)
                        } else {
                            fw.error(res.messages?.join('<br>')||'')
                        }
                    }
                }))
            ])
        ])
    ]), 'Theme Editor', { width: '40vw' })
    ;;

    w.$('.-c').on('click', function() { this.$('input')[0].click() })
    w.$('.-c>input').forEach((e, i) => e.on('change', function() {
        const 
        c = 'C' + (i + 1)
        , p = this.parent()
        ;;
        theme[c] = this.value
        p.anime({ background: this.value }, AL * 4)
        p.$('.centered').text(this.value)
    }))
    w.$('.-tp').on('click', function() {
        const
        inp =  this.$('input').at()
        , state = !inp.checked
        ;;
        inp.checked = state
        theme.BACKGROUND = state ? '#000000' : '#eaeaea'
        theme.FOREGROUND = state ? '#242424' : '#FFFFFF'
        theme.FONT = state ? '#fefefe' :'#1a1a1a'
        theme.type = state ? 'dark' : 'light'
        w.$('.-bg').anime({ background: theme.BACKGROUND }, AL * 4)
        w.$('.-fg').anime({ background: theme.FOREGROUND }, AL * 4)
        w.$('.-ft').anime({ color: theme.FONT }, AL * 4)
        w.$('.-bd').anime({ borderColor: theme.FONT + '44' }, AL * 4)
    })

    w.addClass('theme-editor')

    w.on('close', _ => $('select.themes')[0].value = fw.storage('theme'))

    fw.execs = {}

})