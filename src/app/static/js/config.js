/*---------------------------------------------------------------------------------------------
 * CONFIG
 *--------------------------------------------------------------------------------------------*/

/*
 *
 * GLOBALS
 *
 */

/*
 * ENUMS
 */

;;

const
EPragmas = Object.freeze({
	HOME            : 0
})
, EUserLevels = Object.freeze({
    PUBLIC         : 0
    , DEV          : 9
})
;;

fw.initial_pragma = EPragmas.HOME

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