(async function (fw, args) {
    if(fw.notifications.length) {
        const stages =  $('.notifications-stage') ;;
        if(stages.length) stages.remove()
        const el = DIV('notifications-stage fixed ztr w3 blur', {
            height: '100%'
            , boxShadow: '0 0 1em {{font}}44'
            , background: '{{foreground}}cc'
        }).append([
            ROW('px2 flex').append([
                SPAN(translate('Notifications'), 'px', { opacity: .32 })
                , DIV('col')
                , SPAN('close', 'icon pointer px')
            ]).on('click', _ => $('.notifications-stage').remove())
            , DIV('row scrolls', { height: 'calc(100% - 2em)' }).append([
                , ... fw.notifications.map(n => {
                    n.off('click, mouseenter, mouseleave').css({ margin: 0 })
                    return DIV('flex pl3 pb').append([
                        n
                        , DIV('rel content-center pointer col', { minHeight: '4em' }).append(
                            SPAN('delete', 'icon centered avoid-pointer', { opacity: .64 })
                        ).on('click', ev => {
                            ev.target.upFind('flex').remove()
                            fw.notifications = fw.notifications.filter(x => x != n)
                            fw.app.emit('notify')
                            if (!fw.notifications.length) $('.notifications-stage').remove()
                        })
                    ])
                })
            ])
        ]) ;;
        fw.app.append(el)
    } else fw.notify(translate('No notifications available'))
})