/*---------------------------------------------------------------------------------------------
 * CONFIG
 *--------------------------------------------------------------------------------------------*/

/*
 *
 * GLOBALS
 *
*/
ANIMATION_LENGTH  = 400
AL 				  = ANIMATION_LENGTH
APP_DEFAULT_THEME = "ball-dark"
APP_NEEDS_LOGIN   = false
VERBOSE           = false

/*
 * ENUMS
*/

const
EPragmas = Object.freeze({
	HOME            : 0
})
, EUserLevels = Object.freeze({
    PUBLIC         : 0
    , DEV          : 9
})
, ELocales = Object.freeze({
    BR              : "pt_br"
    , EN            : "en_us"
    , ES            : "es_es"
})


/**
 * LET THERE BE MAGIC
 */
blend(fw, {
    components          : {}
    , cache             : {}
    , flags             : new Set()
    , locale            : fw.storage("locale") || fw.storage("locale", ELocales.BR)
    , theme             : fw.storage("theme")  || fw.storage("theme", APP_DEFAULT_THEME)
    , device            : fw.storage("device") || fw.storage("device", fw.nuid(32))
    , uat               : fw.storage("uat")
    , initial_pragma    : EPragmas.HOME
    , onPragmaChange    : new Pool()
    , onPushstatePop    : new Pool()
    , onSocketBroadcast : new Pool()
    , contextEvents     : {}
})

const
ws = io(location.host)
, socket_callbacks = { }
, sock = async (trigger, data) => {

    const
    callback = typeof data == "function" ? data : (data?.callback ? data.callback : (data?.cb ? data.cb : null))
    , listener = callback ? "fn" + callback.toString().hash() : null
    , payload = { payload: data?.data||{}, ts: fdate.time(), trigger, listener, device: fw.device, token: fw.token }
    ;;
    if(callback) socket_callbacks[listener] = callback
    let req ;;
    try { req = JSON.stringify(payload) } catch(e) { if(VERBOSE) console.trace(e) }
    ws.send(req)
}
;;

ws.on('message', res => {
    try { res = JSON.parse(res) } catch(e) { console.trace(e) }    
    if(res.listener && socket_callbacks[res.listener]) {
        const fn = socket_callbacks[res.listener] ;;
        delete socket_callbacks[res.listener]
        Promise.resolve(fn(res.res))
    }
    else fw.onSocketBroadcast.fire(res)
})

bootloader.dependencies = new Set([
    /*
     * Set the components to be loaded before
     * the system boot
     */
    "ready"
])

/*
 * These components are loaded at system boot times
 * the splash screen will let the system procede
 * after this execution queue and all bootloader`s
 * loaders are all done
 */


/*** SPLASH ***/
bootloader.dependencies.add("splash")
initpool.add(async _ => await fw.load("views/splash.htm"))


/*
 * a key pair value used for tooltips
 * tooltip() function must be fired to
 * make these hints work
 */
bootloader.dependencies.add("dict")
get(`dicts/${fw.locale}/translate.json`, res => {
    fw.components.translatedict = res
    bootloader.ready('dict')
})
function translate (w) { return fw.components.translatedict[w] || w }


/*** VERSION ***/
bootloader.dependencies.add("v")
sock(`version`, response => {

    fw.v = response.res
    if(fw.storage('version') != fw.v) {

        fw.warning('Atualizando versão de sistema...')
        fw.clearStorage()
        fw.storage('version', fw.v)
        fw.storage('uat'    , fw.uat || "")
        fw.storage('device' , fw.device)
        setTimeout(_ => location.reload(), AL * 4)

    } else {

        function load() {
            bootloader.dependencies.add("theme")
            sock(`themes`, {
                data: { theme: fw.theme }
                , cb: async res => {
                    blend(fw.palette, res)
                    document.getElementsByTagName('head')[0].appendChild(TAG('style').text("\
                        input,[type='text'],[type='search'],[type='number'],[type='button'],[type='submit'],select,textarea,button {\
                            background: {{foreground}};\
                            border: 1px solid {{font}}44;\
                            color: {{font}}\
                        }\
                        .background, .bg { background-color: {{background}} !important; }\
                        .foreground, .fg { background-color: {{foreground}} !important; }\
                        .font, .ft { color: {{font}} !important; }\
                    ".prepare()))
                    bootloader.ready('theme')
                    fw.initialize()
                }
            })
        }

        if(APP_NEEDS_LOGIN) post('auth/check', res => {
            if(res.status) {
                fw.components.user = res.user
                load()
            } else fw.exec('login')
        })
        else load()

        bootloader.ready("v")

    }

})


/*** PRAGMAS ***/
fw.spy('pragma', value => {
    if(value == fw.last_pragma) return
    fw.last_pragma = fw.current_pragma
    fw.current_pragma = value
    fw.onPragmaChange.fire(value)
})

/*
 * These components are loaded at system boot times
 * the splash screen will let the system procede
 * after this execution queue and all bootloader`s
 * loaders are all done
 */
initpool.add(async _ => {
    /**
     *
     */
    bootloader.dependencies.add('home')
    fw.load(`views/home.htm`, { bind: { theme_name: fw.theme } })

})


/*
 * This Pool will fire after all loaders are true
 */
bootloader.onFinishLoading.add(function() {

    /**
     * commonly used helpers, uncommnt to fire
    */
    fw.pragma = fw.initial_pragma

})

fw.onPushstatePop.add(_ => {
    $('._menu').hide()
    $('main.view, .-window')?.last()?.remove()
    history.pushState({}, "stay", "/")
})
history.pushState({}, "stay", "/");
window.onpopstate = e => fw.onPushstatePop.fire(e)

window.onclick = _ => $('._blured').hide()

window.onkeydown = e => {	
    if(e.key == "Escape") {
        $('._menu').hide()
        $('._blured').hide()
    }
    
    if(e.ctrlKey){
        if(e.key == "Home") $('.table-body').forEach(tbody => tbody.scrolls(tbody.$('.table-row').first()))
        if(e.key == "End") $('.table-body').forEach(tbody => tbody.scrolls(tbody.$('.table-row').last()))
    }
}


;;(async () => {
    if(!fw.cache.o_departments) fw.cache.o_departments = await get('departments')
    if(!fw.cache.actions) fw.cache.actions = await get('actions')
})();;


fw.cache.update_line = async (data, msg=true) => {
    await post('/inventory_aging/update', { 
        data
        , cb: () => msg && fw.success('Record updated!')
    })
}

fw.cache.ask_for_changes = async item => {
    $('.ask-for-changes').disappear(AL, true)
    if(!fw.cache.actions) fw.cache.actions = await get('actions')
    if(!fw.cache.o_departments) fw.cache.o_departments = await get('departments')
    const
    rows = $('.table-row.checked').map(r => r.item.ref)
    , w = fw.dialog(DIV('wrap rel').append([
        TAG('form', 'row px', { minHeight: '30vh' }).append([
            DIV('row flex').append([
                // DEPARTMENNT
                DIV('col-8 px').append([
                    DIV('row bold ellipsis content-left', { fontSize: '.75em', opacity: .64 }).text('Department'),
                    , TAG('select', 'row').attr({ name: 'department_name' }).append([
                        TAG('option').attr({ value: '' }).html('...')
                        , ... fw.cache.o_departments.map(d => TAG('option').attr({ value: d.name }).html(d.name))
                    ]).val(item.department_name || '')
                ])
                // USER
                , DIV('col-4 px').append([
                    DIV('row bold ellipsis content-left', { fontSize: '.75em', opacity: .64 }).text('User Assigned')
                    , TAG('input', 'row').attr({ name: 'user_assigned' }).attr({ type:'text', value: item.user_assigned || ''  })
                ])
            ])
            , DIV('row flex').append([
                // ACTION
                DIV('col-8 px').append([
                    DIV('row bold ellipsis content-left', { fontSize: '.75em', opacity: .64 }).text('Action')
                    , TAG('select', 'row').attr({ name: 'action' }).append([
                        item?.action ? TAG('option').attr({ value: item.action }).html(item.action) : TAG('option').attr({ value: '' }).html('...')
                        , ... fw.cache.actions.map(a => TAG('option').attr({ value: a.name }).html(a.name))
                    ]).val(item.action || '').on('change', ev => {
                        const e = ev.target.upFind('form').$('textarea')[0] ;;
                        if(!e.value) e.value = fw.cache.actions.filter(a => a.name == ev.target.value)[0].description
                    })
                ])
                // DATE LIMIT
                , DIV('col-4 px').append([ 
                    DIV('row bold ellipsis content-left', { fontSize: '.75em', opacity: .64 }).text('Date Limit')
                    , TAG('input', 'row px').attr({ type: 'date', name: 'limit_date', value: item.limit_date || '' })
                ])
            ])
            , DIV('row px').append([
                DIV('row bold ellipsis content-left', { fontSize: '.75em', opacity: .64 }).text('Observations')
                , TAG('textarea', 'row px', { height: 'calc(30vh - 8em)' }).attr({ name: 'note' }).val(item.note || '')
            ])
        ]).attr({ action: 'javascript:void(0)' })
        , DIV('row px2 flex').append([
            DIV('pointer pv2 ph4', {
                background: fw.palette.ALIZARIN
                , color: 'white'
                , borderRadius: '.5em'
                , border: `1px solid ${fw.palette.FONT}44`
            }).text('Cancel').on('click', () => w.disappear(AL, true))
            , DIV('col-1')
            , DIV('pointer pv2 ph4', {
                background: fw.palette.EMERALD
                , color: 'white'
                , borderRadius: '.5em'
                , border: `1px solid ${fw.palette.FONT}44`
            }).text('Confirm').on('click', () => {
                const
                form = w.$('form')[0]
                , json = form.json()
                ;;
                let pass = true ;;
                Object.entries(json).forEach(([k, v]) => {
                    if(!v && !['note', 'limit_date'].includes(k)) {
                        form.$(`[name=${k}]`).addClass('debug')
                        pass = false
                    } else form.$(`[name=${k}]`).remClass('debug')
                })
                if(pass) {
                    if(rows.length) {
                        rows.forEach(ref => fw.cache.update_line({ ...json, has:ref }))
                        $('.table-row.checked').forEach(row => {
                            Object.entries(json).forEach(([k, v]) => {
                                row.$(`.${k}-value`).text(v || '-').css({ opacity: v ? 1 : .32 })
                                row[k] = v
                            })
                        })
                    } else {
                        if(item) fw.cache.update_line({ ...json, hash: item.ref })
                        const row = $('.pareto-row.hash-' + item.ref)[0] ;;
                        if (row) Object.entries(json).forEach(([k, v]) => {
                            row.$(`.${k}-value`).text(v || '-').css({ opacity: v ? 1 : .32 })
                            row[k] = v
                        })
                    }
                    w.disappear(AL, true)
                }
            })
        ])
    ]), 'Editing: ' + rows.length + ' records').addClass('ask-for-changes')
    ;;

}

fw.special_fields = {
    period: (v, k, item)=> DIV('row px').append([
        SPAN(v.replace(/#\d+\s+/g, ''), 'row content-left px ellipsis')
        , SPAN('<b>' + item.lifespan + '</b> dias', 'row content-left px')
    ])
    , customer: (v, k , item) => ROW().append([
        SPAN(item.customer_global_group, 'row bold content-left px')
        , SPAN(item.customer_group, 'row content-left px', { opacity: item.customer_group == item.customer_global_group ? .32 : 1 })
        , SPAN(v, 'row content-left px', { opacity: v == item.customer_group ? .32 : 1 })
    ])
    , plant: (v, k , item) => ROW().append([
        SPAN('<b>' + v + '</b>', 'row content-left px')
        , SPAN(item.warehouse ? item.warehouse.replace(/_/gi, '') : '-', 'row content-left px', { opacity: item.warehouse ? 1 : .32 })
        , SPAN(item.ag ? item.ag : '-', 'row content-left px', { opacity: item.ag ? 1 : .32 })
    ])
    , available: (v, k, item) => ROW('px -tooltip').attr({ tip: (item.qty).toFixed(3) + ' Total' }).append([
        ROW('flex').css({ opacity: item.quality * 1 ? 1 : 0.32 }).append([
            SPAN('QUA', 'content-left px')
            , SPAN((item.quality * 1 ).toFixed(3), 'content-right px')
        ])
        , ROW('flex').css({ opacity: item.blocked * 1 ? 1 : 0.32 }).append([
            SPAN('BLK', 'content-left px')
            , SPAN((item.blocked * 1 ).toFixed(3), 'content-right px')
        ])
        , ROW('flex').css({ opacity: item.available * 1 ? 1 : 0.32 }).append([
            SPAN('AVA', 'content-left px')
            , SPAN((item.available * 1 ).toFixed(3), 'content-right px')
        ])
    ])
    , obsolete: (v, k) => {
        return DIV('rel wrap', { height: '2em', minWidth: '2em' }).append([
            DIV(k + ' abs centered circle px2', { background: v * 1 ? fw.palette.ALIZARIN : fw.palette.FONT + '22' })
            , DIV('wrap abs pointer ' + k).on('click', ev => {
                const 
                row = ev.target.upFind('table-row')
                , state = Boolean(row.item.obsolete * 1)
                ;;
                row.item.obsolete = state ? 0 : 1
                if(!state) row.$(`.${k}.circle.centered`).css({ background: fw.palette.ALIZARIN })
                else row.$(`.${k}.circle.centered`).css({ background: fw.palette.FONT + '22' })
                // ev.target.upFind('table').$('.' + k).not(ev.target).forEach(e => e.dispatchEvent(new Event('click')))
                console.log({ obsolete: state ? 0 : 1, hash: row.item.ref })
                fw.cache.update_line({ obsolete: state ? 0 : 1, hash: row.item.ref })
                ev.target.upFind('table').$('.checked').forEach(row => {
                    row.item.obsolete = state ? 0 : 1
                    fw.cache.update_line({ obsolete: state ? 0 : 1, hash: row.item.ref }, false)
                    if(!state) row.$(`.${k}.circle.centered`).css({ background: fw.palette.ALIZARIN })
                    else row.$(`.${k}.circle.centered`).css({ background: fw.palette.FONT + '22' })
                }) 
            })
        ])
    }
    , actions: (v, k, item) => {
        return DIV('row flex').append([
            DIV('col-10').append([
                ROW('flex content-left').append([
                    // DEPT
                    DIV('col-2 px').append([
                        DIV('row bold ellipsis', { fontSize: '.75em', opacity: .64 }).text('Department'),
                        ROW('department_name-value').html(item.department_name || '-')
                    ])

                    // USER
                    , DIV('col-2 px').append([
                        DIV('row bold ellipsis', { fontSize: '.75em', opacity: .64 }).text('User Assigned'),
                        ROW('user_assigned-value').text(item.user_assigned || '-')
                    ])
                    
                    // ACTION
                    , DIV('col-6 px').append([
                        DIV('row bold ellipsis', { fontSize: '.75em', opacity: .64 }).text('Action'),
                        ROW('action-value').text(item.action || '-')
                    ])
                    
                    // DATE LIMIT
                    , DIV('col-2 px').append([
                        DIV('row bold ellipsis', { fontSize: '.75em', opacity: .64 }).text('Date Limit'),
                        ROW('limit_date-value ellipsis').text(item.limit_date || '-')
                    ])
                ])
                , ROW().append(
                    // NOTE
                    DIV('row px content-left').append([
                        DIV('row content-left bold', { fontSize: '.75em', opacity: .64 }).text('Observations'),
                        ROW('note-value').text(item.note || '-')
                    ])
                )
            ])
            , DIV('col-2 content-center px').append([
                DIV('row bold ellipsis', { fontSize: '.75em', opacity: .64 }).text('Edit'),
                , DIV('pointer px handler mx', {
                    opacity: 1
                    , background: fw.palette.ORANGE
                    , borderRadius: '.5em'
                    , border: `1px solid ${fw.palette.FONT}44`
                }).attr({ hash: item.hash }).append(
                    SPAN('code', 'icon avoid-pointer')
                ).on('click', ev => {
                    const row = ev.target.upFind('table-row') ;;
                    if (!row.has('checked')) row.$('[type=checkbox]')[0].click()
                    fw.cache.ask_for_changes(item)
                })
            ])
        ])
    }
    , sku_code: (v, k, item) => {
        return DIV('row px pointer').append([
            DIV('row content-left px').html(`<b>${v}</b> (${item.sku_size})`)
            , DIV('row content-left px').text(item.sku_desc)
        ]).on('click', ev => fw.copy2clipboard(v, true))
    }
    , status: (v, k , item) => {
        return ROW('row flex px').append([
            SPAN(v || '-', 'col-4 content-center px ' + (v ? 'bold' : ''), { opacity: v ? 1 : .32 })
            // , SPAN(item.abc || '-', 'col-4 content-center px')
            // , SPAN(item.flag || '-', 'col-4 content-center px')
        ])
    }
    , charge_storage: (v, k, item) => {
        return ROW('row flex px').append([
            DIV(k + ' col-4 content-center px2 pointer').append(
                DIV(k + ' circle px2 avoid-pointer', { background: v * 1 ? fw.palette.EMERALD : fw.palette.FONT + '22' })
            ).on('click', ev => {
                const 
                row = ev.target.upFind('table-row')
                , state = row.item.charge_storage * 1
                , input = row.$(`.${k} input`)[0]
                ;;
                if(state) {
                    row.$(`.${k}.circle`).css({ background: fw.palette.FONT + '22' })
                    input.css({ opacity: .32 }).old_value = input.value
                    input.setAttribute('disabled', true)
                    input.value = '0.000'
                    row.item.charge_storage = 0
                    fw.cache.update_line({ charge_storage: 0, hash: item.ref })
                } else {
                    row.$(`.${k}.circle`).css({ background: fw.palette.EMERALD })
                    input.css({ opacity: 1 })
                    input.removeAttribute('disabled')
                    input.value = (input.old_value * 1 || row.item.qty).toFixed(3) || '0.000'
                    row.item.charge_storage = row.item.qty * 1 || 1
                    input.focus()
                }
            })
            , DIV('col-8').append(
                (() => {
                    const tag = TAG('input', 'px content-right', {
                        opacity: v * 1 ? 1 : .32
                        , border: 'none'
                        , width: '10em'
                    }).on('change', ev => {
                        fw.cache.update_line({ charge_storage: ev.target.value * 1, hash: item.ref })
                        ev.target.value = (ev.target.value * 1).toFixed(3)
                    }).on('keyup', ev => ev.target.value = ev.target.value.replace(/[^0-9,.-]/gi, '')).val((v * 1).toFixed(3))
                    if(!(v * 1)) tag.setAttribute('disabled', true)
                    return tag
                })()
            )
        ])
    }
    , fcst: (v, k, item) => ROW('px -tooltip').attr({ tip: (parseFloat(item.fcst*1 || 0) + parseFloat(item.actual * 1 || 0) + parseFloat(item.balance*1 || 0)).toFixed(3) + ' Total' }).append([
        ROW('flex').css({ opacity: item.fcst * 1 ? 1 : 0.32 }).append([
            SPAN('FCT', 'content-left px')
            , SPAN((item.fcst * 1).toFixed(3), 'content-right px')
        ])
        , ROW('flex').css({ opacity: item.actual * 1 ? 1 : 0.32 }).append([
            SPAN('ACT', 'content-left px')
            , SPAN((item.actual * 1).toFixed(3), 'content-right px')
        ])
        , ROW('flex').css({ opacity: item.balance * 1 ? 1 : 0.32 }).append([
            SPAN('BAL', 'content-left px')
            , SPAN((item.balance * 1).toFixed(3), 'content-right px')
        ])
    ])
    , demmand: (v, _, item) => DIV('px flex -tooltip', { flexDirection: 'column' }).attr({ tip: 'Demmand: ' + v }).append([
        DIV('px').append(DIV('circle').css({ height: '1em', width: '1em', background: (item.demmand * 1 <= 0 && item.fcst * 1 <= 0) && item.available - Math.max(item.fcst, item.balance) >= 0 ? fw.palette.ALIZARIN : fw.palette.FONT + '16' }))
        , DIV('px').append(DIV('circle').css({ height: '1em', width: '1em', background: (item.demmand * 1 > 0 || item.fcst * 1 > 0) && item.available - Math.max(item.fcst, item.balance) > 0 ? fw.palette.ORANGE : fw.palette.FONT + '16' }))
        , DIV('px').append(DIV('circle').css({ height: '1em', width: '1em', background: (item.demmand * 1 > 0 || item.fcst * 1 > 0) && item.available - Math.max(item.fcst, item.balance) <= 0 ? fw.palette.EMERALD : fw.palette.FONT + '16' }))
    ])
}