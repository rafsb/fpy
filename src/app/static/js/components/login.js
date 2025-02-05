(function(fw, args){

    const exists = $('div.fixed.login')[0] ;;
    if(exists) exists.remove()

    const
    d = DIV('fixed zero wrap blur login').append(
        TAG('form', 'centered px2', { 
            borderRadius:`.5em`
            , boxShadow:`0 0 .5em {{dark3}}`
            , background: fw.palette.BACKGROUND
            , color: fw.palette.FONT
        }).attr({ action:'javascript:void(0)' }).append([
            TAG('header', 'row').append([
                DIV().append(IMG(`img/logo-${fw.palette.type}.png`, 'left', { height:'2em' }))
                , SPAN(translate('login'), 'right ph2', { color: '{{span}}', lineHeight: 2 })
            ])
            , DIV('row flex px mt2').append([
                DIV('col-4 px').append(SPAN(translate('user'), 'right px'))
                , TAG('input', 'col-8').attr({ name:'username', type:'user' })
            ])
            , DIV('row flex px mb2').append([
                DIV('col-4 px').append(SPAN(translate('password'), 'right px'))
                , TAG('input', 'row').attr({ name:'password', type:'password' }).on('keyup', ev => {
                    if(ev.key == 'Enter') ev.target.upFind('form').$('.ready')[0].emit('click')
                })
            ])
            , DIV('row flex px2').append([
                DIV('pointer pv2 ph4', {
                    background: '{{pomegranate}}'
                    , color: 'white'
                    , borderRadius:`.5em`
                }).text(translate('cancel')).on('click', ev => ev.target.upFind('login').remove())  
                , DIV('col-1')
                , DIV('pointer pv2 ph4 ready', {
                    background:'{{green_sea}}'
                    , color: 'white'
                    , borderRadius:`.5em`
                }).text(translate('ready')).on('click', ev => {
                    loading.on()
                    const data = ev.target.upFind('form').json() ;;
                    post('login', { 
                        data
                        , callback: res => {
                            loading.off()
                            if(res.status) {
                                fw.uat = fw.storage('uat', res.uat)
                                ev.target.upFind('login').remove()
                                d.dispatchEvent(new Event('success'))
                            } else {
                                fw.uat = fw.storage('uat', "")
                                d.dispatchEvent(new Event('failure'))
                            }
                        } 
                    })
                })
            ])
        ])
    )
    ;;

    $('#app')[0].append(d)

    return d

})