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