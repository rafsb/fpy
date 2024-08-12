// /**************************************************************************
//      ___                                             _
//     /  _|_ __ __ _ _ __ ___   _____      _____  _ __| | __
//     | |_| '__/ _` | '_ ` _ \ / _ \ \ /\ / / _ \| '__| |/ /
//     |  _| | | (_| | | | | | |  __/\ V  V / (_) | |  |   <
//     |_| |_|  \__,_|_| |_| |_|\___| \_/\_/ \___/|_|  |_|\_\
//
// ****************************************************************************/
const
DEBUG = false
, SUM = 0
, AVERAGE = 1
, HARMONIC = 2
, TREND = 3
, PROGRESS = 4
, INTERPOLATE = 5
, MAX = 6
, MIN = 7
, RELATIFY = 8
, SMOOTH = 9
, SIMILARITY = 10
, PASSWD_AUTO_HASH = 1
, LOCALE_OFFSET = 1 // pt-br-full=0 pt-br=1 en-us-full=2 en-us=3
, MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro", "jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez", "january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december", "jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
, DAYS = [ "Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "dom", "seg", "ter", "qua", "qui", "sex", "sáb", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "sun", "mon", "tue", "wed", "thu", "fri", "sat" ]
, PTBR_FULL = 0
, PTBR = 12
, ENUS_FULL = 24
, ENUS = 36
, TS_MASK = "Y-m-dTh:i:s.000Z"
// , NUMBER            = 0
// , STRING            = 1
, TAG = (n = "div", c, s, t) => {
    let name = n, id = false ;;
    if (name.includes("#")) {
        id = name.split("#")[1];
        name = name.split("#")[0] || "div";
    }
    node = document.createElement(name).addClass(c).css(s)
    if(t) node.html(t)
    if (id) node.id = id
    return node
}
, DIV = (c, s, t) => TAG("div", c, s, t)
, WRAP = (h, c, s) => DIV((c || "") + " wrap", s)[h instanceof Object || h instanceof Array ? 'app' : 'html'](h || "")
, IMG = (path = "img/spin.svg", cls=null, css = {}) => TAG("img", cls, css).attr({ src: path, role: "img" })
, SVG = (t="svg", c=null, a={ focusable: "false" }, s={}) => {
    const
    node = document.createElementNS("http://www.w3.org/2000/svg", t)
        .addClass(c)
        .attr(a || {})
        .css(s || {})
        .html(t == "svg" ? "<defs></defs>" : "")
    ;;
    node.attr = function(o, ns) {
        if(o) {
            if(typeof o === "object") Object.keys(o).map(k => this.setAttributeNS(ns, k, o[k]));
            else if(typeof o === "string") return this.getAttribute(o)
        }
        return this
    }
    return node
}
, SPATH = (d, c, a, s) => SVG("path", c, blend({ d: d }, a), s)
, TEXT  = (t,c,s,n="p") => TAG(n,c,s,t)
, SPAN = (t, c, s, n = "span") => TAG(n, c, s, t)
, BOLD = (t,c,s) => TAG("b",c,s,t)
, ITALIC = (t,c,s) => TAG("i",c,s,t)
, ROW = (c, s, e) => { const x = DIV("row " + (c || ''), s); if (e) { typeof e == "string" ? x.html(e) : x.app(e); } return x }
, WSPAN = (t,c,s,n="span") => TAG(n,c,blend({ paddingLeft:"1em" }, s||{}),t)
, blend = (target = {}, ...sources) => {
    for (const source of sources) {
        if (source && typeof source === 'object') {
            Object.assign(target, source);
        }
    }
    return target;
}
, EEvents = Object.freeze({
    CLICK: "click"
    , MOUSEENTER: "mouseenter"
    , MOUSELEAVE: "mouseleave"
    , MOUSEMOVE: "mousemove"
    , SUBMIT: "submit"
    , KEYUP: "keyup"
    , CHANGE: "change"
    , SEARCH: "search"

    , TCLICK: new Event("click")
    , TMOUSEENTER: new Event("mouseenter")
    , TMOUSELEAVE: new Event("mouseleave")
    , TMOUSEMOVE: new Event("mousemove")
    , TSUBMIT: new Event("submit")
    , TKEYUP: new Event("keyup")
    , TCHANGE: new Event("change")
    , TSEARCH: new Event("search")
})
;;

blend(Number.prototype, {
    fill: function (c, l, d) { return (this + "").fill(c, l, d) }
    , ceil: function(){ return Math.ceil(this) }
    , floor: function(){ return Math.floor(this) }
    , nerdify: function (fixed=1) {
        const pointer = this < 0 ;;
        let n = Math.abs(this) ;;
        return (pointer ? '-' : '') + (n >= 1000000000000 ? ((n / 1000000000000).toFixed(fixed)) + "tri" : (
            n >= 1000000000 ? ((n / 1000000000).toFixed(fixed)) + "bi" : (
                n >= 1000000 ? ((n / 1000000).toFixed(fixed)) + "mi" : (
                    n >= 1000 ? ((n / 1000).toFixed(fixed)) + "k" : n.toFixed(fixed)
                )
            )
        ))
    }
});

blend(NodeList.prototype, {
    array: function () {
        return [].slice.call(this);
    }
    , each: function (f) {
        return this.array().forEach(f)
    }
    , extract: function (f) {
        return this.array().extract(f)
    }
});

blend(HTMLCollection.prototype, {
    array: function () {
        return [].slice.call(this);
    }
    , each: function (f) {
        return this.array().forEach(f)
    }
    , extract: function (f) {
        return this.array().extract(f)
    }
    , evalute: function () {
        this.array().forEach(el => el.evalute())
    }
})

blend(HTMLFormElement.prototype, {
    json: function () {
        const me = this, tmp = {} ;;
        me.$("input, textarea, select, .-value, .-field").forEach(o => {
            if(o.has(`-skip`)) return
            if (o.upFind("form") == me && (o.getAttribute('name') || o.dataset.name)) {
                if(o.getAttribute(`type`) == `checkbox` && !o.checked) return
                let
                name = o.getAttribute('name') || o.dataset.name
                , value =  o.value || o.attributes['value']?.value || o.dataset?.value || o.textContent?.trim() || o.checked || null
                ;;
                if (o.has("-list")) value = value.split(/\n+/gi).filter(i=> i=='' || i==null || i==undefined || isNaN(i) ? i : i*1)
                if (o.has("-hash")) value = Array.isArray(value) ? value.map(x => { return (x||``).hash() }) : (value||``).hash()
                value = (value=='' || value==null || value==undefined || typeof value == `boolean` || isNaN(value)) ? value : value * 1
                if(undefined !== tmp[name]) {
                    if(!Array.isArray(tmp[name])) {
                        const t = tmp[name] ;;
                        tmp[name] = [t]
                    }
                    tmp[name].push(value)
                } else tmp[name] = value
            }
        })
        me.$("form").forEach(f => {
            const
            group = f.getAttribute('group') || f.dataset.group
            , json = f.json()
            ;;
            if(group) {
                if(tmp[group]) {
                    if(!Array.isArray(tmp[group])) tmp[group] = [ tmp[group] ]
                    tmp[group].push(json)
                } else tmp[group] = json
            }
            else Object.keys(json).forEach(k => {
                if(tmp[k]) {
                    if(!Array.isArray(tmp[k])) tmp[k] = [ tmp[k] ]
                    tmp[k].push(json[k])
                } else tmp[k] = json[k]
            })
        })
        me.$('._multiselect').forEach(f => {
            const json = f.form.json() ;;
            Object.keys(json).forEach(k => tmp[k] = json[k])
        })
        const final = {} ;;
        Object.keys(tmp).forEach(k => fobject.compose(final, k, tmp[k]))
        return final
    }
    , stringify: function () {
        return JSON.stringify(this.json())
    }
    , up: function(url, cb){
        const
        data = new FormData(this)
        , xhr = new XMLHttpRequest()
        ;;
        if(url) {
            xhr.open("POST", url)
            xhr.send(data)
            if(cb) {
                xhr.onreadystatechange = function() {
                    if(xhr.readyState == 4 && xhr.status == 200) {
                        let res ;;
                        try { res = JSON.parse(xhr.itemsponseText) } catch(e) { res = xhr.itemsponseText}
                        cb(res)
                    }
                }
            }
        } else fw.error(`Endpoint not specified...`)
    }
});

blend(Element.prototype, {
    at: function () { return this }
    , anime: function (obj, len = ANIMATION_LENGTH, delay = 0, trans = null) {
        const el = this;;
        return new Promise(function (ok) {
            len /= 1000;
            trans = trans ? trans : "ease";
            el.style.transition = "all " + len.toFixed(2) + "s " + trans;
            el.style.transitionDelay = (delay ? delay / 1000 : 0).toFixed(2) + "s";
            for (let i in obj) el.style[i] = obj[i];
            setTimeout(_ => ok(el), len * 1000 + delay)
        })
    }
    , mime: function () {
        return this.cloneNode(true)
    }
    , stop: function () {
        if (this.dataset.animationFunction) clearInterval(this.dataset.animationFunction);
        this.dataset.animationFunction = "";
        return this
    }
    , empty: function () {
        this.html("");
        return this
    }
    , css: function (o = null, fn = null) {
        if (o === null) return this;
        this.style.transition = "none";
        this.style.transitionDuration = 0;
        for (let i in o) this.style[i] = o[i];
        if (fn !== null && typeof fn == "function") setTimeout(fn.bind(this), 16, this);
        return this
    }
    , text: function (t = null, fn = null) {
        if (t == null || t == undefined) return this.textContent;
        this.textContent = t;
        if (fn) return fn.bind(this)(this);
        return this;
    }
    , html: function (tx = null) {
        if (tx !== null && tx !== false) {
            if(typeof tx == 'string') this.innerHTML = tx;
            else try {
                const p = this ;;
                Array.from(tx).forEach(e => p.app(e))
            } catch(e) {}
            this.evalute()
        } else return this.innerHTML;
        return this
    }
    , data: function (o = null, fn = null) {
        if (o === null) return this.dataset;
        blend(this.dataset, o);
        if (fn !== null && typeof fn == "function") fn.bind(this)(this);
        return this;
    }
    , attr: function (o = null, fn = null) {
        if (o === null) return this;
        const el = this ;;
        Object.keys(o).forEach(x => o[x] !== null && o[x] !== undefined ? el.setAttribute(x, o[x]) : null)
        if (fn !== null && typeof fn == "function") return fn(this)
        return this
    }
    , _put_where_: function (obj = null, w = "beforeend") {
        let el = this;
        if (Array.isArray(obj) || HTMLCollection.prototype.isPrototypeOf(obj) || NodeList.prototype.isPrototypeOf(obj)) {
            Array.from(obj).forEach(o => el._put_where_(o, w));
        } else if (obj) el.insertAdjacentElement(w, obj);
        return this
    }
    , aft: function (obj = null) { return this._put_where_(obj, "afterend") }
    , bef: function (obj = null) { return this._put_where_(obj, "beforebegin") }
    , app: function (obj = null) { return this._put_where_(obj, "beforeend") }
    , pre: function (obj = null) { return this._put_where_(obj, "afterbegin") }
    , append: function (obj = null) { return this._put_where_(obj, "beforeend") }
    , prepend: function (obj = null) { return this._put_where_(obj, "afterbegin") }
    , has: function (cls = null) {
        if (cls) return this.classList.contains(cls);
        return false
    }
    , dataSort: function (data = null, dir = "desc", noheader=true, str=false) {
        data = data || 'sort'
        let all = [].slice.call(this.children) ;;
        if(!noheader) all = all.slice(1)
        if (all.length) all.sort(function (a, b) {
            if (str) return dir == "asc" ? (a.dataset[data]||'').localeCompare(b.dataset[data]||'') : (b.dataset[data]||'').localeCompare(a.dataset[data]||'')
            else return dir == "asc" ? (a.dataset[data]||0) - (b.dataset[data]||0) : (b.dataset[data]||0) - (a.dataset[data]||0)
        })
        all.forEach(el => el.raise())
        return this
    }
    , index: function () {
        return [].slice.call(this.parent().children).indexOf(this)
    }
    , evalute: function () {
        if (this.tagName == 'SCRIPT') {
            eval(this.textContent);
            this.remove()
        } else {
            fw.get("script", this).forEach(x => {
                eval(x.textContent);
                x.remove()
            })
        }
        return this
    }
    , on: function (action, fn, passive = { passive: true }) {
        const _self = this;
        if (Array.isArray(action)) action.map(act => _self.addEventListener(act, fn, passive))
        else _self.addEventListener(action, fn, passive);
        return this
    }
    , emit: function(eventname='emit'){
        this.dispatchEvent(new Event(eventname))
    }
    , parent: function (pace = 1) {
        let tmp = this ;;
        while (pace-- && tmp) tmp = tmp.parentElement
        return tmp
    }
    , upFind(tx = null) {
        if (tx) {
            let x = this ;;
            while (x.parentElement.tagName.toLowerCase() != "body" && !(x.parentElement.tagName.toLowerCase() == tx || x.parentElement.has(tx))) x = x.parentElement;
            return x.parentElement
        }
        return this.parentElement
    }
    , inPage: function(padd=0) {
        const me = this.getBoundingClientRect() ;;
        return (
            me.y < (0-padd) || me.y > (window.innerHeight + padd)
        ) ? false : {
            offset: me.y,
            where: me.y / window.innerHeight
        }
    }
    , scrolls: function(el, fn=null) {
        switch(el){
            case 'start':
                this.scroll({top:0, behavior:"smooth"})
                break

            case 'end':
                this.scroll({top:this.scrollHeight, behavior:"smooth"})
                break

            default:
                if (!el) return -1;
                let
                length = 0;
                do {
                    length += el.offsetTop;
                    el = el.parentElement;
                } while (el.uid() != this.uid());
                this.scroll({top:length,behavior:"smooth"})
        }
        fn && fn(el, this)
    }
    , stopScroll: function() {
        this.scroll({top:this.scrollTop+1});
    }
    , get: function (el) {
        if (el) return [].slice.call(this.querySelectorAll(el));
        else return this;
    }
    , $: function (el) {
        if (el) return [].slice.call(this.querySelectorAll(el));
        else return this;
    }
    , remClass: function (classlist) {
        classlist.split(/\s+/g).forEach(classname => {
            if (this.classList.contains(classname)) this.classList.remove(classname)
        })
        return this;
    }
    , emptyClasses: function() {
        this.className = ''
        return this
    }
    , removeClass: function (c) {
        return this.remClass(c);
    }
    , addClass: function (c) {
        if (c) {
            let
                tmp = c.trim().split(/\s+/g)
                , i = tmp.length;
            if (c.length) while (i--) this.classList.add(tmp[i]);
        }
        return this;
    }
    , toggleClass: function(c) {
        let
        tmp = c.split(/\s+/g), i=tmp.length;
        while(i--) {
            if (tmp[i]) {
            if(!this.classList.contains(tmp[i]))
                this.classList.add(tmp[i]); else this.classList.remove(tmp[i]);
            }
            } return this;
    }
    , uid: function (name = null, hash = false) {
        if (name) this.id = name.replace(/[^0-9a-zA-Z]/g, "");
        if (!this.id) this.id = fw.nuid();
        return (hash ? "#" : "") + this.id;
    }
    , move: function(obj,len=ANIMATION_LENGTH, anim="linear") {
        len /= 1000;
        this.style.transition = "all "+len+"s "+anim;
        if(obj.top!==undefined)this.style.transform = "translateY("+(this.offsetTop-obj.top)+")";
        if(obj.left!==undefined)this.style.transform = "translateX("+(this.offsetLeft-obj.left)+")";
    }
    , raise: function () {
        this.parentElement.appendChild(this)
        return this
    }
    , show: function (display) {
        this.style.display = display ? display : (this.display_state && this.display_state.toLowerCase() != 'none' ? this.display_state : 'inline-block')
        return this
    }
    , hide: function () {
        this.display_state = this.display_state || getComputedStyle(this).display
        this.style.display = 'none'
        return this
    }
    , appear: function (len = ANIMATION_LENGTH / 2, fn = null) {
        return this.stop().css({ display: this.display_state || 'block' }, x => x.anime({ opacity: 1 }, len).then(fn))
    }
    , disappear: function (len = ANIMATION_LENGTH / 2, remove = false, fn = null) {
        this.display_state = this.display_state || getComputedStyle(this).display
        if(this.display_state == "none") this.display_state = "inline-block"
        return this.stop().anime({ opacity: 0 }, len).then(x => {
            if (remove) x.remove()
            else x.css({ display: "none" })
            if (fn) fn(remove ? null : this)
        })
    }
    , remove: function () { if ( this.parentElement) this.parentElement.removeChild(this) }
    , val: function(v){
        if(v !== undefined || v !== null) {
            if([ "INPUT", "SELECT" ].includes(this.tagName)){
                const timer = setInterval((uid, v) => {
                    const e = $(`#${uid}`)[0] ;;
                    if(e){
                        e.value = v
                        clearInterval(timer)
                    }
                }, 100, this.uid(), (v+``).trim())
            }
            return this
        }
        return this.value
    }
});

blend(String.prototype, {
    hash: function () {
        let
            h = 0, c = "", i = 0, j = this.length;
        if (!j) return h;
        while (i++ < j) {
            c = this.charCodeAt(i - 1);
            h = ((h << 5) - h) + c;
            h |= 0;
        }
        return Math.abs(h).toString();
    }
    , sanitized_compare: function (word) {
        const w = this ;;
        if(!w || !word) return false
        try {
            return Boolean((new RegExp(
                w
                .replace(/\s+/giu, ' ')
                .replace(/(a|á|à|ã)/giu, "(a|á|à|ã)")
                .replace(/(e|é|ê)/giu,   "(e|é|ê)")
                .replace(/(i|í)/giu,     "(i|í)")
                .replace(/(o|ó|ô|õ)/giu, "(o|ó|ô|õ)")
                .replace(/(u|ú)/giu,     "(u|ú)")
                .replace(/(c|ç)/giu,     "(c|ç)")
            , 'giu')).test(word.trim().replace(/\s+/gi, ' ')))
        } catch(e) {
            return false
        }
    }
    , btoa: function () {
        return btoa(this);
    }
    , atob: function () {
        return atob(this);
    }
    , list: function () {
        return this.split(/\s+/gi) || []
    }
    , fill: function (c = " ", l = 8, d = -1) {
        let
            s = this;
        c = !c ? " " : c;
        d = d == 0 || d == null || d == undefined ? -1 : d;
        while (s.length < l) s = (d < 0 ? c : "") + s + (d > 0 ? c : "");
        return s
    }
    , nerdify: function () {
        return (this * 1).nerdify()
    }
    , desnerdify: function () {
        let
        n = Number(this.replace(/[^0-9\.]/g, '').replace(',', '.'))
        , s = this.replace(/[^a-zA-Z]/g, '')
        ;;
        switch (s) {
            case "tri": n *= 1000000000000; break;
            case "bi": n *= 1000000000; break;
            case "mi": n *= 1000000; break;
            case "k": n *= 1000; break;
            default: n *= 1; break;
        }
        return n
    }
    , json: function () {
        let
            result = null;
        try {
            result = JSON.parse(this);
        } catch (e) {
            console.trace(e)
        }
        return result;
    }
    , morph: function () {
        const x = document.createElement("div") ;;
        x.innerHTML = this
        return x.firstChild.tagName.toLowerCase() == "template" ? x.firstChild.content.children : x.children;;
    }
    , prepare: function (obj = null) {
        let str = this.trim()+'' ;;
        obj = blend({ uuid: fw.uuid() }, fw.palette, fw.components?.translate, obj)
        const founds = str.match(/{{([^{}]+)}}/gi)?.map(i => i.replace(/{|}/g, '')) || [] ;;
        founds.forEach(x => {
            let rgx = new RegExp("{{" + x.trim() + "}}", "gi") ;;
            str = str.replace(rgx, (obj[x]||obj[x.toLowerCase()]||obj[x.toUpperCase()]||""))
        })
        return str.replace(/[ ]+/g, ' ')
    }
    , first : function(n=1){
        return this.split(``).first(n).join(``)
    }
    , last : function(n=1){
        return this.split(``).last(n).join(``)
    }
});

blend(Array.prototype, {
    json: function (pretty = true) { return JSON.stringify(this, null, pretty ? 4 : null); }
    , clone: function () { return this.slice(0) }
    , each: function (fn) { if (fn && typeof fn == 'function') { for (let i = 0; i++ < this.length;) fn(this[i - 1], i - 1); } return this }
    , extract: function (fn = null) {
        if (!fn || !this.length) return this;
        return  this.map((o, i) => fn(o, i)).filter(i=>i)
    }
    , merge: function () {
        return [].concat.apply([], this)
    }
    , mutate: function (fn) {
        if (!fn) return this;
        return this.map((x, i) => fn(x, i))
    }
    , cast: function (filter = STRING) {
        return this.map(x => filter == STRING ? x + "" : (filter == NUMBER ? x * 1 : x))
    }
    , fit: function (n = 10) {
        let
            narr = [this.first()]
            , x = this.length / (n - 1)
            , i = x
            ;
        while (i < this.length) {
            narr.push(this.calc(TREND, i));
            i += x;
        }
        narr.push(this.last())
        return narr
    }
    , tiny(n=10){
        let
        narr=[ this.first() ]
        , x = this.length / (n-1)
        , i = x
        ;
        while(i<this.length){
            narr.push(this.interpolate(i))
            i+=x
        }
        narr.push(this.last())
        return narr
    }
    , sum() {
        return this.reduce((p, q) => parseFloat(p) + q*1, 0)
    }
    , average() {
        return this.sum() / this.length
    }
    , harmony() {
        return this.length/this.reduce((p, q) => p+=1/q, 0)
    }
    , trend(target) {
        let m, b, x, y, x2, xy, z, np = this.length ;;
        m = b = x = y = x2 = xy = z = 0
        target = target || np
        this.forEach((n, i) => {
            x = x + i
            y = y + n
            xy = xy + i * n
            x2 = x2 + i * i
        })
        z = np*x2 - x*x
        if(z){
            m = (np*xy - x*y)/z;
            b = (y*x2 - x*xy)/z;
        }
        return m * target + b
    }
    , progress() {
        const me = this ;;
        return this.map((x, i) => i ? x/me[i-1] : 1)
    }
    , max() {
        return Math.max(... this)
    }
    , min() {
        return Math.min(... this)
    }
    , relatify() {
        const max = this.max() ;;
        return this.map(i => i/max)
    }
    , linear_interpolation(z) {
        if(!z) return this[0] || null
        // if(this[z]) return this[z]
        let x0=0, x1=Number.MAX_SAFE_INTEGER ;;
        for (let i = 0; i < this.length; i++) {
            if (this[i] !== null && this[i] !== undefined) {
                if(i<z) x0 = Math.max(x0, i)
                if(i>z) x1 = Math.min(x1, i)
            }
        }
        let y0 = this[x0]||0, y1 = this[x1]||0 ;;
        return y0 + (y1 - y0) * ((z - x0) / (x1 - x0))
    }
    , lagrange_interpolation(z) {
        // if(this[z]) return this[z]
        const x=[], y=[] ;;
        for (let i = 0; i < this.length; i++) {
            if (this[i] !== null && this[i] !== undefined) {
                x.push(i)
                y.push(this[i])
            }
        }
        let n = x.length, sum = 0 ;;
        for (let i = 0; i < n; i++) {
            let term = y[i] ;;
            for (var j = 0; j < n; j++) if(j!==i) term = term * (z - x[j]) / (x[i] - x[j])
            sum += term
        }
        return sum
    }
    , fillNulls(interpolation=`linear`) {
        const nulls = this.map((x, i) => x === null ? i : null).filter(i=>i) ;;
        for(let i=0;i<nulls.length;i++) this[nulls[i]] = this[`${interpolation}Interpolation`](nulls[i])
        return this
    }
    , last(n=null) {
        if (!this.length) return null
        if (n === null) return this[this.length - 1]
        return this.slice(Math.max(this.length - n, 0))
    }
    , first(n=null) {
        if (!this.length) return null;
        if (n === null) return this[0];
        return this.slice(0, n)
    }
    , at(n=0) {
        if(n >= 0) return this[n]
        return this.length > n*-1 ? this[this.length+n] : null
    }
    , rand(){
        return this[Math.floor(Math.random()*this.length)]
    }
    , not(el) {
        while(this.indexOf(el)+1) this.splice(this.indexOf(el), 1)
        return this;
    }
    , empty(){
        return [].fill(this.length)
    }
    , pearsonSimilarity(y) {
        const
        x = this
        , n = x.length
        ;;
        if (n !== y.length) return undefined

        const
        sumx    = x.reduce((a, b) => a + b, 0)
        , sumy  = y.reduce((a, b) => a + b, 0)
        , xab2  = x.reduce((a, b) => a + b * b, 0)
        , yab2  = y.reduce((a, b) => a + b * b, 0)
        , sumxy = x.reduce((a, b, i) => a + b * y[i], 0)
        , num   = n * sumxy - sumx * sumy
        , diff  = Math.sqrt((n * xab2 - sumx * sumx) * (n * yab2 - sumy * sumy))
        ;;

        if (diff === 0) return 0
        return num / diff
    }
    , linearInterpolation2(z) {
        if(!z) return this[0] || 0
        let x0=0, x1=Number.MAX_SAFE_INTEGER ;;
        for (let i = 0; i < this.length; i++) {
            if (this[i] !== null && this[i] !== undefined) {
                if(i<z) x0 = Math.max(x0, i)
                if(i>z) x1 = Math.min(x1, i)
            }
        }
        let y0 = this[x0]||0, y1 = this[x1]||0 ;;
        return y0 + (y1 - y0) * ((z - x0) / (x1 - x0))
    }
    , lagrangeInterpolation2(z) {
        const x=[], y=[] ;;
        for (let i = 0; i < this.length; i++) {
            if (this[i] !== null && this[i] !== undefined) {
                x.push(i)
                y.push(this[i])
            }
        }
        let n = x.length, sum = 0 ;;
        for (let i = 0; i < n; i++) {
            let term = y[i] ;;
            for (var j = 0; j < n; j++) if(j!==i) term = term * (z - x[j]) / (x[i] - x[j])
            sum += term
        }
        return sum
    }
    , anime: function (obj, len = ANIMATION_LENGTH, delay = 0, trans = null) {
        this.forEach(x => x.anime(obj, len, delay, trans));
        return this
    }
    , stop: function () {
        this.forEach(x => x.stop())
        return this
    }
    , raise: function () {
        this.forEach(x => x.raise());
        return this
    }
    , css: function (obj, fn = null) {
        this.forEach(x => x.css(obj, fn));
        return this
    }
    , data: function (obj, fn = null) {
        this.forEach(x => x.data(obj, fn));
        return this
    }
    , attr: function (obj, fn = null) {
        this.forEach(x => x.attr(obj, fn));
        return this
    }
    , text: function (txt, fn = null) {
        this.forEach(x => x.text(txt, fn));
        return this
    }
    , emptyClasses: function() {
        this.forEach(e => e.className = '')
        return this
    }
    , addClass: function (cl = null) {
        if (cl) this.forEach(x => x.addClass(cl));
        return this
    }
    , remClass: function (cl = null) {
        if (cl) this.forEach(x => x.remClass(cl));
        return this
    }
    , removeClass: function (cl = null) {
        return this.remClass(cl)
    }
    , toggleClass: function(cl=null) {
        if(cl) this.forEach(x => x.toggleClass(cl));
        return this
    }
    , remove: function () {
        this.forEach(x => x.remove());
        return this
    }
    , on: function (act = null, fn = null) {
        if (act && fn) this.forEach(x => x.on(act, fn));
        return this
    }
    , clear: function () {
        return this.extract(n => {
            return n != null && n != undefined && n != NaN && n != window ? (n instanceof String ? n + "" : (n instanceof Number ? n * 1 : n)) : null
        })
    }
    , evalute: function () {
        this.forEach(el => el.evalute())
    }
    , html: function (v) {
        this.forEach(el => el.html(v));
        return this
    }
    , show: function (display) {
        return this.map(x => x.show(display))
    }
    , appear: function (len, fn) {
        return this.forEach(x => x.appear(len, fn))
    }
    , hide: function () {
        return this.map(x => x.hide())
    }
    , disappear: function (len, remove=false, fn=null) {
        return this.forEach(x => x.disappear(len, remove, fn))
    }
    , val: function(v=null){
        if(![ null, undefined ].includes(v)) this.forEach(x => x.val(v))
        return this
    }
    , app: function (el = null) {
        if (el) this.forEach(x => x.app(el))
        return this
    }
});

blend(Object.prototype, {
    keys: function() { return Object.keys(this) }
    , values: function() { return Object.values(this) }
    , walk: function(path, value) {
        const keys = path.split('.') ;;
        if (keys.length === 1) this[keys[0]] = value
        else {
            const key = keys.shift() ;;
            this[key] = this[key] || {}
            this[key].walk(keys.join('.'), value)
        }
        return this
    }
});

Object.defineProperty(Object.prototype, "spy", {
    value: function (p, fn) {
        let o = this[p], set = function (v) {
            this['_' + p] = v
            return fn(v, p, this)
        } ;;
        if (delete this[p]) { // can't watch constants
            Object.defineProperty(this, p, { set: set })
        }
    }
})

//       _
//   ___| | __ _ ___ ___  ___  ___
//  / __| |/ _` / __/ __|/ _ \/ __|
// | (__| | (_| \__ \__ \  __/\__ \
//  \___|_|\__,_|___/___/\___||___/

class fdate extends Date {

    plus(n) {
        let
        date = new Date(this.valueOf());
        date.setDate(date.getDate() + n);
        return new fdate(date)
    }

    export(format = TS_MASK){
        let
        d = this || fdate.now()
        , arr = format.split("")
        ;;
        arr.forEach(n => {
            switch(n){
                case "Y": format = format.replace(n, d.getFullYear());                             break;
                case "y": format = format.replace(n, ((d.getYear()-100)   + "").fill("0", 2, -1)); break;
                case "m": format = format.replace(n, ((d.getMonth()+1)    + "").fill("0", 2, -1)); break;
                case "d": format = format.replace(n, (d.getDate()         + "").fill("0", 2, -1)); break;
                case "h": format = format.replace(n, (d.getHours()        + "").fill("0", 2, -1)); break;
                case "i": format = format.replace(n, (d.getMinutes()      + "").fill("0", 2, -1)); break;
                case "s": format = format.replace(n, (d.getSeconds()      + "").fill("0", 2, -1)); break;
                case "k": format = format.replace(n, (d.getMilliseconds() + "").fill("0", 3, -1)); break;
                case "t": format = format.replace(n, d.getTime());                                 break;
                case "M": format = format.replace(n, MONTHS[d.getMonth()+(12*LOCALE_OFFSET)]);          break;
                case "D": format = format.replace(n, DAYS[d.getDay()+(7*LOCALE_OFFSET)]);              break;
            }
        })
        return format
    }

    as(format){
        return this.export(format)
    }

    format(format){
        return this.export(format)
    }

    isValid(date){
        if(date) return (new fdate(date)).isValid();
        else if(this.getTime()) return this
        return null
    }

    now(){
        return new fdate()
    }

    time(){
        return this.getTime()
    }

    static guess(datestr, gmt=3){
        /**
         * possibilities:
         *     - Tue Jun 08 19:34:03 +0000 2021
         */
        if(!datestr) return false;

        var dat ;;

        if(!isNaN(datestr)) {
            dat = new fdate();
            dat.setTime(datestr);
        } else {
            if(datestr.match(/\b\d{2}([-/. ])\d{2}\1\d{4}(T|\b)/)?.length)
                datestr = datestr.split(`T`)[0].split(/[-/. ]/g).reverse().join(`-`) + (datestr.split(`T`)[1]||``)
            dat = new Date(datestr)
        }

        if(dat&&dat.getTime()) return new fdate(dat.getTime() + (1000 * 60 * 60 * gmt))

        let
        datefound = null
        , hourfound = null
        , fmatch
        ;;

        fmatch = datestr.match(/\b\d{2,4}([-/. ])\d{2}\1\d{2,4}(T|\b)/)
        if(fmatch?.length) {
            const tmp = fmatch[0].replace("T", "") ;;
            if(tmp.match(/^\d{2}([-/. ])\d{2}\1\d{2,4}$/)) datefound = tmp
                .split(/[-/. ]/g)
                .reverse()
                .map((x, i) => !i && x.length==2 ? `20${x}` : x)
                .map(x => x*1 > (new Date).getFullYear() ? (x*1 - 100)+'' : x)
                .join('-')
            ; else datefound = tmp
        }

        fmatch = datestr.match(/(T|\b)\d{1,2}:\d{2}/)
        if(fmatch?.length) hourfound = fmatch[0].replace("T", "")+":00.000Z"

        return new fdate((new fdate(datefound + (hourfound ? `T${hourfound}` : ''))).getTime() + (1000 * 60 * 60 * gmt))
    }

    static now(){
        return new fdate()
    }

    static plus(n=1){
        return fdate.now().plus(n)
    }

    static time(){
        return Date.now()
    }

    static at(n){
        return fdate.now().plus(n)
    }

    static as(format=TS_MASK){
        return fdate.now().export(format)
    }

    static format(format){
        return fdate.now().export(format)
    }

    static cast(date, gmt=3){
        return new fdate(date ? fdate.guess(date, gmt): new Date())
    }

    static yday(){
        return parseInt(fdate.plus(-1).getTime()/1000)*1000
    }

    static tday(){
        return parseInt(fdate.time()/1000)*1000
    }
};

class Pool {
    add(x = null) {
        if (x) {
            const p = this ;;
            if (Array.isArray(x)) x.forEach(y => p.add(y))
            if (typeof x === 'function') this.execution.push(x)
            else this.conf(x)
        }
        return this;
    }
    conf(o = null) {
        if(o) {
            if (typeof o == 'object') blend(this.setup, o)
            else this.setup.args.push(o)
        }
        return this
    }

    async fire(x = null) {
        const { setup } = this ;;
        for(const f of this.execution) {
            if(!this.stop_flag) await f(x, setup)
        }
        return this
    }
    stop() {
        this.stop_flag = true
        return this
    }
    clear() {
        this.stop()
        this.execution = []
        this.setup = {}
        return this
    }
    constructor(x) {
        this.execution = [];
        this.setup = { args: [] };
        this.stop_flag = false
        this.add(x)
    }
};

class Swipe {
    constructor(el,len=40) {
        this.len = len;
        this.x = null;
        this.y = null;
        this.e = typeof(el) === 'string' ? $(el).at() : el;
        if(!this.e) return;
        this.e.on('touchstart', function(v) {
            this.x = v.touches[0].clientX;
            this.y = v.touches[0].clientY;
        }.bind(this));
    }

    static cast(e, l) {
        return new Swipe(e, l)
    }

    left(fn) { this.__LEFT__ = new throttle(fn,this.len); return this }

    right(fn) { this.__RIGHT__ = new throttle(fn,this.len); return this }

    up(fn) { this.__UP__ = new throttle(fn,this.len); return this }

    down(fn) { this.__DOWN__ = new throttle(fn,this.len); return this }

    move(v) {
        if(!this.x || !this.y) return;
        let
        diff = (x,i)=>{ return x-i },
        X = v.touches[0].clientX,
        Y = v.touches[0].clientY;

        this.xdir = diff(this.x,X);
        this.ydir = diff(this.y,Y);

        if(Math.abs(this.xdir)>Math.abs(this.ydir)) { // Most significant.
            if(this.__LEFT__&&this.xdir>0) this.__LEFT__.fire();
            else if(this.__RIGHT__) this.__RIGHT__.fire();
        }else{
            if(this.__UP__&&this.ydir>0) this.__UP__.fire();
            else if(this.__DOWN__) this.__DOWN__.fire()
        }
        this.x = this.y = null
    }

    fire() { this.e&&this.e.on('touchmove', function(v) { this.move(v) }.bind(this)) }
};

/*
 * @class
 *
 * handle the minimum amount of time to wait until executions of a given function
 * good to prevent events like scroll and typing to fire some actions multiple
 * times decreasing performance affecting user's experience
 *
 */
class throttle {
    /*
     * @constructor
     *
     * f = javascript function to be applied
     * t = time betwin executions of 'f' (250ms is the default)
     * ex.: new __self.throttle(minha_funcao,400);
     *
     */
    constructor(f, t = ANIMATION_LENGTH/2) {
        this.assign(f,t);
    }

    /*
     * @member function
     *
     * assign values to inner class attributes
     * f = javascript function to be applied
     * t = time betwin executions of 'f' (250ms is the default)
     * ex.: (new __self.throttle).assign(minha_funcao) // assuming default delay time
     *
     */
    assign(f, t) {
        this.func = f;
        this.delay = t;
        this.timer = (new Date()).getTime();
    }

    /*
     * @member function
     *
     * execute given function assigned on constructor or assign() mmber function
     * ex.: (new __self.throttle).apply()
     * obs.: the fire() member function will only execute the inner function if the
     * given ammount of time is passed, otherway if won't do anything
     *
     */
    fire() {
        if(!this.func) return;
        let
        now = (new Date()).getTime();
        if (now - this.delay > this.timer) {
            eval(this.func)( ... arguments);
            this.timer = now;
        }
    }
};

class Loader {

    loadLength() {
        return Object.values(this.Loaders).filter(i => i).length / Object.keys(this.Loaders).length
    }

    check(scr) {
        return scr ? this.Loaders[scr] : this.alreadyLoaded
    }

    ready(scr) {
        const tmp = this ;;
        this.dependencies.forEach(x => tmp.Loaders[x] = tmp.Loaders[x]*1 ? 1 : 0)
        if (scr!=null&&scr!=undefined) this.Loaders[scr] = 1;

        let perc = this.loadLength();

        if (!this.alreadyLoaded && perc >= 1) {
            this.alreadyLoaded = true;
            this.onFinishLoading.fire()
        } else if (!this.alreadyLoaded) this.onReadyStateChange.fire(perc)

        return this.alreadyLoaded || false;
    }

    pass() {
        this.dependencies = new Set(["pass"]);
        return this.ready("pass");
    }

    constructor(dependencies) {
        this.alreadyLoaded = false;
        this.onReadyStateChange = new Pool();
        this.onFinishLoading = new Pool();
        this.dependencies = new Set(dependencies || ["pass"]);
        this.Loaders = {};
    }

};

class fobject extends Object {

    static cast(o){
        return new fobject(o)
    }

    isNull(){
        return Object.values(this).length && true
    }
    static isNull(o){
        return fobject.cast(o).isNull()
    }

    map(fn){
        const me = {...this}, res = [] ;;
        Object.keys(me).map(k => res.push(fn(me[k], k)))
        return res
    }
    static map(o, fn){
        return fobject.cast(o).map(fn)
    }

    json(){
        return JSON.stringify({...this})
    }
    static json(o){
        var res;
        try {
            if(typeof o == 'string') res = JSON.parse(o)
            else res = JSON.stringify(o)
        } catch(e) {}
        return res
    }

    spread(){
        return this.isNull() ? null : {...this}
    }
    static spread(o){
        return fobject.cast(o).spread()
    }

    static compose(obj, is, value) {
        if (typeof is == 'string') return fobject.compose(obj, is.split('.'), value)
        else if (is.length==1 && value!==undefined) return obj[is[0]] = value
        else if (is.length==0) return obj
        else {
            if(!obj[is[0]]) obj[is[0]] = {}
            return fobject.compose(obj[is[0]], is.slice(1), value);
        }
    }

    compose(is, value) {
        return fobject.compose(this, is, value)
    }

    constructor(o){
        super()
        const me = this ;;
        Object.keys(o||{}).forEach(k => me[k] = o[k])
        const attrs = Object.keys(me) ;;
        attrs.forEach(attr => {
            const l = attr.length ;;
            if(attr == 'id_') return;
            if(attr[l-1] == '_' && me[attr.slice(0, l-1)] === undefined) me[attr.slice(0, l-1)] = function(x) {
                if(undefined!==x && null!==x) me[attr]=x;
                return typeof me[attr] == "string" && !isNaN(me[attr]) ? me[attr]*1 : me[attr]
            }
        })
    }

};

class fw {

    static palette = {
        ALIZARIN: "#E84C3D"
        , AMETHYST: "#9C56B8"
        , ASBESTOS: "#7E8C8D"
        , BELIZE_HOLE: "#2A80B9"
        , BURRO_QNDO_FOJE: "#8C887B"
        , CARROT: "#E67D21"
        , CLOUDS: "#ECF0F1"
        , CONCRETE: "#95A5A5"
        , EMERALD: "#53D78B"
        , GREEN_SEA: "#169F85"
        , ICE_PINK: "#CA179E"
        , LIME: "#BAF702"
        , MIDNIGHT_BLUE: "#27283D"
        , NEPHRITIS: "#30AD63"
        , ORANGE: "#F39C19"
        , PASTEL: "#FEC200"
        , PETER_RIVER: "#2C97DD"
        , POMEGRANATE: "#C0382B"
        , PUMPKIN: "#D35313"
        , PURPLE_PINK: "#8628B8"
        , SILVER: "#BDC3C8"
        , SUN_FLOWER: "#F2C60F"
        , TEAL: "#008080"
        , TIFFANY: "#0abab5"
        , TURQUOISE: "#00BE9C"
        , WET_ASPHALT: "#383C59"
        , WISTERIA: "#8F44AD"
        /*** SYSTEM***/
        , BACKGROUND: "#FFFFFF"
        , FOREGROUND: "#ECF1F2"
        , FONT: "#2C3D4F"
        , FONTINVERTED: "#F2F2F2"
        , FONTBLURED: "#7E8C8D"
        , SPAN: "#2980B9"
        , DISABLED: "#BDC3C8"
        , DARK1: "rgba(0,0,0,.08)"
        , DARK2: "rgba(0,0,0,.16)"
        , DARK3: "rgba(0,0,0,.32)"
        , DARK4: "rgba(0,0,0,.64)"
        , LIGHT1: "rgba(255,255,255,.08)"
        , LIGHT2: "rgba(255,255,255,.16)"
        , LIGHT3: "rgba(255,255,255,.32)"
        , LIGHT4: "rgba(255,255,255,.64)"
        /*** candy */

        , CANDY_RED: "#FABFB7"
        , CANDY_YELLOW: "#FDF9D4"
        , CANDY_ORANGE: "#FFDA9E"
        , CANDY_GRAY: "#C4C6C8"
        , CANDY_BLUE: "#B2E2F2"
        /*** palette ***/
        , WHITE: "#FFFFFF"
        , BLACK: "#000000"
        , CYAN:"#01F2F2"
        , MAGENTA:"#E10085"
        , YELLOW:"#F2DE00"
        , RED:"#FF0000"
        , GREEN:"#00FF00"
        , BLUE:"#0000FF"
    }

    static rx(w, wrule=2, b="\\b", asrx=true, flags='guim'){
        const
        midrule = "([^-'0-9a-zÀ-ÿ]{0,2}[-'0-9a-zÀ-ÿ]+[^-'0-9a-zÀ-ÿ]{0,2}){0," + wrule + "}"
        , replaced = `(${b}` + (w||'').trim()
        .replace(/(a|á|à|ã)/giu, "(a|á|à|ã)")
        .replace(/(e|é|ê)/giu,   "(e|é|ê)")
        .replace(/(i|í)/giu,     "(i|í)")
        .replace(/(o|ó|ô|õ)/giu, "(o|ó|ô|õ)")
        .replace(/(u|ú)/giu,     "(u|ú)")
        .replace(/(c|ç)/giu,     "(c|ç)")
        .replace(/\s+/giu, `.{0,2}${b})${midrule}(`) + `.{0,2}${b})`
        ;;
        return asrx ? new RegExp(replaced, flags) : replaced
    }

    static color(c){
        var res;
        if(c) res = this.palette[c] || this.palette[c.toUpperCase()]
        return res
    }

    static async client_ip(){
        if(!this.client_ip_) this.client_ip_ = await (await fetch("https://ipinfo.io/ip")).text();
        return this.client_ip_
    }

    static initialize() { initpool.fire() }

    static async call(url, args = null, method = null, head = null) {
        try {
            method = method ? method : (args ? "POST" : "GET")

            head  = Object.assign(
                method == "POST" ? { 'Accept': 'application/json', 'Content-Type': 'application/json;charset=UTF-8' } : {}
                , head
                , { "fw-device": fw.device, "fw-uat": fw.uat }
            )

            const
            req = await fetch(url, args ? {
                method
                , headers : new Headers(head)
                , body    : fobject.json(blend(args || {}, { _ts: fdate.time() }))
            } : { method, headers: new Headers(head) })
            , res = await req.text()
            ;;
            return { url, args, method, req, res };
    } catch(e) {
            console.log({ err: e, url, args, head })
        }
    }

    static async post(url, args, head = null) {
        return fw.call(url, args, "POST", head)//blend({ 'Accept': 'application/json', 'Content-Type': 'application/json; charset=UTF-8' }, head || {}))
    }

    static async load(url, config = {}) {
        let { args, target, bind } = (config || {}) ;;
        return fw.call(url, args).then(r => {
            if (!r?.res) return fw.error("error loading " + url);
            r = r.res.prepare(bind).morph()
            if (!target) target = fw.$('body').at()
            function insert(h) {
                if(h instanceof HTMLCollection) Array.from(h).forEach(insert)
                else {
                    target.app(h)
                    h.evalute()
                }
            }
            insert(r)
            return r
        })
    }

    static async exec(url, args = null, prepare = null) {
        const hash = `f${url.hash()}` ;;
        if(!fw.execs) fw.execs = {}
        if(!fw.execs[hash]) {
            const res = (await this.call(`js/${url.indexOf('.js')+1 ? url : url+'.js'}`)).res ;;
            if(!res) return this.error("error loading " + url)
            fw.execs[hash] = res
        }
        let res;
        try { res = await eval(fw.execs[hash].prepare(prepare))(fw, args) } catch(e) { console.trace(e) }
        return { res, hash }

    }

    static uuid(pre='f') {
        return ((pre||'x')+'xxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx').replace(/[xy]/g, function(c) {
          var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
          return v.toString(16);
        })
    }

    static nuid(n = 36, prefix = "f") {
        let a = prefix + "";
        n -= a.length;
        const keyspace = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split('')
        while (n-- >= 0) a += String(keyspace[Math.floor((Math.random() * keyspace.length))])
        return a
    }

    static epoch(format=10) {
        return fdate.time().toString(format).toUpperCase()
    }

    static sanitized_compare(w1, w2) {
        return w1.sanitized_compare(w2)
    }

    /*
     * @Override
     */
    static loading(show = true, target, txt = '<img class="ph2" src="assets/img/ellipsis.svg"/>') {
        $('tooltip').hide();

        const loading_list = (target || $("#app")[0]).$(".-loading") ;;

        if (show && loading_list.length) {
            $(".-pulse", loading_list[0])[0].html(txt);
            return
        }

        if (!show) {
            loading_list.forEach(e => e.anime({ filter: 'opacity(0)' }).then(e => e.remove()))
            return loading_list
        } else {
            const
            load = WRAP(DIV('abs zbr blur ph2', { transform: 'scale(.5)' }).app(SPAN(txt, "-pulse", {
                fontSize: "4em"
                , color: "#0004"
            }, "i")), "absolute zero -loading", {
                background: fw.palette.BACKGROUND
                , opacity: .8
                , zIndex: 10000
            })
            ;;
            (target || $("#app")).app(load);
            load.anime({ filter: 'opacity(1)' })
            return load
        }

    }

    static notify(n, c = null) {
        const
        toast = document.createElement("toast")
        , clr = fw.palette
        ;;
        toast.addClass("fixed tile content-left _notification").css({
            background: c && c[0] ? c[0] : clr.FOREGROUND
            , color: c && c[1] ? c[1] : clr.FONT
            , boxShadow: "0 0 .25em " + clr.FONT + '44'
            , borderRadius: ".25em"
            , padding: "1em"
            , display: 'block'
            , opacity: 0
            , fontWeight: "bolder"
            , top: 0
            , right: 0
            , margin: "1em"
            , zIndex: 10001
        }).innerHTML = n ? n : "Hello <b>World</b>!!!";
        if (!fw.is_mobile()) toast.css({ width: "20vw" });
        else toast.css({ width: "(100vw - 2em)" })
        toast.onclick = function () { clearTimeout(this.dataset.delay); this.disappear(ANIMATION_LENGTH / 2, true); };
        toast.onmouseenter = function () { clearTimeout(this.dataset.delay); };
        toast.onmouseleave = function () {
            this.dataset.delay = setTimeout(t => { t.disappear(ANIMATION_LENGTH / 2, true); }, ANIMATION_LENGTH, this);
        };
        document.getElementsByTagName('body')[0].appendChild(toast);
        tileEffect(".tile");

        toast.raise()

        let
        notfys = $("toast._notification")
        , ht = 0
        ;
        notfys.forEach(x => {
            x.anime({ transform: "translateY(" + ht + "px)", opacity: 1 }, ANIMATION_LENGTH / 4)
            ht += x.getBoundingClientRect().height + 8;
        });
        toast.dataset.delay = setTimeout(function () { toast.disappear(ANIMATION_LENGTH / 2, true); }, ANIMATION_LENGTH * 5);
        return toast
    }

    static error(message = null) {
        return fw.notify(message || "Ops! Something went wrong...", [fw.palette.POMEGRANATE, fw.palette.CLOUDS])
    }
    static success(message = null) {
        return fw.notify(message || "Hooray! Success!", [fw.palette.GREEN_SEA, fw.palette.WHITE])
    }
    static warning(message = null) {
        return fw.notify(message || "Ops! take attention...", [fw.palette.SUN_FLOWER, fw.palette.WET_ASPHALT])
    }
    static working(message = null) {
        return fw.notify(message || "We`re still working on this awesome feature!", [fw.palette.PETER_RIVER, fw.palette.WHITE])
    }

    static window(html, title, css = {}) {
        const
        mob = fw.is_mobile()
        , head = TAG("header", "relative row zero -window-header no-scrolls ph").app([
            DIV("left content-left ellipsis no-scrolls -drag-trigger", { cursor: 'all-scroll', height: "2em", width: "calc(100% - 6em)" }).app(
                typeof title == "string" ? ("<span class='row px2 no-scrolls' style='opacity:.64'>" + title + "</span>").morph()[0] : title
            ).on("click", function () { this.upFind("-window").raise() })
            // CLOSE
            , DIV("relative right pointer -close tile", { height: `2em`, width: `2em` }).app(
                SPAN(`close`, `icon centered`)
            ).on("click", function () {
                const w = this.upFind("-window") ;;
                w.dispatchEvent(new Event('close'))
                w.disappear(AL, true)
                $(".-minimized").forEach((el, i) => { el.anime({ left: (i * 13.3) + 'vw' }) })
            })
            // // MAXIMIZE
            // , mob ? DIV() : DIV("relative right pointer -maximize tile", { height:`2em`, width: `2em` }).app(
            //     SPAN(`north_east`, `icon centered`)
            // ).on("click", function () {
            //     const win = this.upFind("-window") ;;
            //     if (win.has("-maximized")) {
            //         const pos = win.position ;;
            //         win.$(".wrap")[0].style.display = "block";
            //         win.anime({ height: pos.h + "px", width: pos.w + "px", top: pos.y + "px", left: pos.x + "px" });
            //         win.remClass("-maximized");
            //     } else {
            //         win.position = {
            //             w: win.offsetWidth
            //             , h: win.offsetHeight
            //             , x: win.offsetLeft
            //             , y: win.offsetTop
            //         }
            //         win.anime({ height: "100vh", width: "100vw", top: 0, left: 0 });
            //         win.addClass("-maximized");
            //     }
            // })
            // MINIMIZE
            , mob ? DIV() : DIV("relative right pointer -minimize tile", { height:`2em`, width: `2em` }).app(
                SPAN(`south_west`, `icon centered`)
            ).on("click", function () {
                const win = this.upFind("-window") ;;
                if (win.has("-minimized")) {
                    const pos = win.position ;;
                    this.anime({ transform: "rotate(0deg)" });
                    win.$(".wrap")[0].style.display = "block";
                    win.anime({ height: pos.h + "px", width: pos.w + "px", top: pos.y + "px", left: pos.x + "px" });
                    win.remClass("-minimized");
                } else {
                    win.position = {
                        w: win.offsetWidth
                        , h: win.offsetHeight
                        , x: win.offsetLeft
                        , y: win.offsetTop
                    }
                    this.anime({ transform: "rotate(180deg)" });
                    win.$(".wrap")[0].hide();
                    win.anime({ height: "2em", width: "13.3vw", top: "calc(100vh - 2.25em)", left: '.5em' });
                    win.addClass("-minimized");
                }
                $(".-minimized").forEach((el, i) => { el.anime({ left: `${i * 13.5}vw` }) })
            })
        ])
        , wrapper = DIV("wrap relative m0 p0 px", { height: "calc(100% - 2em)" })
        , _W = TAG("div", "fixed p0 m0 blur -drag-target -window", blend({
            height          : mob ? "100vh" : "auto"
            , height        : "auto"
            , minHeight     : mob ? "100vh": "10vh"
            , maxHeight     : "100vh"
            , width         : mob ? "100vw" : "64vw"
            , maxWidth      : "100vw"
            , top           : mob ? 0 : (css?.height ? `calc(50% - (${css.height} / 2))` : '16vh')
            , left          : mob ? 0 : (css?.width ? `calc(50% - (${css.width} / 2))` : '16vw')
            , background    : fw.palette.FOREGROUND + "AA"
            , border        : "1px solid " + fw.palette.FONT + "22"
            , borderRadius  : ".5em"
            , boxShadow     : "0 0 1em " + fw.palette.FONT + "88"
            , color         : fw.palette.FONT
            , resize        : "both"
            , overflow      : "auto"
            , zIndex        : 8000
        }, css)).data({ state: "default" })
        , uuid = fw.uuid()
        ;;
        _W.id = uuid
        if (html) wrapper.app(typeof html == "string" ? html.prepare({uuid}).morph() : html)
        $("#app").app(_W.app(head).app(wrapper).css({ opacity:0 }))
        _W.raise()
        _W.evalute()
        _W.appear(AL, true)
        _W.close = _ => _W.$('.-close')[0].dispatchEvent(new Event('click'))
        tileEffect(".tile");
        enableDragging();
        return _W
    }

    static dialog(html = null, title = null, css = {}) {
        const
        mob = fw.is_mobile()
        , w = fw.window(html, title, blend({
            minHeight: mob ? "90vh" : "8em"
            , width: mob ? "90vw" : "24vw"
            , top: mob ? "5vh" : "35vh"
            , left: mob ? "5vw" : "38vw"
            , color: fw.palette.FONT
        }, css))
        ;;
        w.$('.-minimize').remove()
        return w
    }

    static confirm(message='Confirm?', title='') {
        const
        dialog = fw.dialog(
            DIV('wrap no-scrolls').app([
                TAG('p', 'row px2 content-left').text(message)
                , DIV('row flex px2').app([
                    DIV('col-4 p0').app(
                        DIV('row').app(
                            TAG('button', 'wrap content-center pointer px2', {
                                border:'none'
                                , borderRadius:'.5em'
                                , padding:'.5em'
                                , color: fw.palette.ALIZARIN
                                , background: fw.palette.MASK1
                            }, 'Cancel')
                        )
                    ).on('click', e => {
                        const w = e.target.upFind('-window') ;;
                        w.dispatchEvent(new Event('cancel'))
                        w.disappear(AL, true)
                    })
                    , DIV('col-4')
                    , DIV('col-4 p0').app(
                        DIV('row').app(
                            TAG('button', 'wrap content-center pointer px2', {
                                borderRadius:'.5em'
                                , border:'none'
                                , padding:'.5em'
                                , color:`white`
                                , background: fw.palette.GREEN_SEA
                            }, 'Confirm')
                        )
                    ).on('click', e => {
                        const w = e.target.upFind('-window') ;;
                        w.dispatchEvent(new Event('ok'))
                        w.disappear(AL, true)
                    })
                ])
            ])
            , title
        )
        ;;
        return dialog
    }

    static get(w = null, c = null) { return $(w, c || document) }

    static args(field = null) {
        const args = {};;
        window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, (NULL, k, v) => args[k] = decodeURI(v))
        return field === null ? args : (args[field] ? args[field] : null);
    }

    static storage(field = null, value = null) {
        if (field == null || field == undefined) return false;
        if (value === null) return window.localStorage.getItem(field);
        window.localStorage.setItem(field, value === false ? "" : value);
        return window.localStorage.getItem(field);
    }

    static clearStorage() {
        Object.keys(window.localStorage).map(x => window.localStorage.removeItem(x))
    }

    static cook(field=null, value=null, days=356){
        if(field){
            let
            date = new Date();
            if(value!==null){
                date.setTime(date.getTime()+(days>0?days*24*60*60*1000:days));
                document.cookie = field+"="+value+"; expires="+date.toGMTString()+"; path=/";
            }else{
                field += "=";
                document.cookie.split(';').forEach(c => {
                    while (c.charAt(0)==' ') c = c.substring(1,c.length);
                    if(c.indexOf(field)==0) value = c.substring(field.length,c.length);
                });
                return value
            }
        }
    }

    static ucook(field=null){
        if(field) fw.cook(field,"",-1);
    }

    static is_mobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    }

    static colors(color = "light") {
        const clrs = fw.palette ;;
        return color && clrs[color] ? clrs[color] : clrs
    }

    static sanitize(str) {
        return encodeURIComponent(str).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\*/g, '%2A').replace(/%20/g, '+')
    }

    static async sleep(time = ANIMATION_LENGTH) {
        return new Promise(function (ok) {
            setTimeout(function () { return ok() }, time)
        })
    }

    static iterate(s, e, fn, step = 1) {
        const x = [];
        if (!fn) fn = i => i;
        s = s || 0;
        e = e || s + 1;
        for (let i = s; i != e; i += step) x.push(fn(i));
        return x;
    }

    static clean(w) {
        return w.replace(/[^-0-9a-zÀ-ÿ]/gui, ' ').replace(/\s+/gui, ' ').trim()
    }

    static makeBase64ImgFromUrl(url, fn){
        const
        img = new Image()
        ;
        img.onload = function(){
            let
            canvas = document.createElement('canvas')
            , ctx = canvas.getContext('2d')
            , data
            ;;
            canvas.height = img.height;
            canvas.width = img.width;
            ctx.drawImage(img, 0, 0);
            data = canvas.toDataURL();
            canvas = null;
            fn(data)
        };
        img.crossOrigin = 'Anonymous';
        img.src = url;
    }

    static rgb2hex(color) {
        let
        hex = "#";
        if(!Array.isArray(color)) color = color.split(/[\s+,.-]/g).filter(i => i);
        color.slice(0,3).forEach(clr => {
            let
            tmp = (clr*1).toString(16);
            hex += tmp.length == 1 ? "0" + tmp : tmp
        });
        if(color[3]) hex += Math.ceil(255*(parseInt(color[3]) > 1 ? parseInt(color[3]) / 100 : parseInt(color[3]))).toString(16)
        return hex.substring(0,9)
    }

    static hex2rgb(color) {
        let
        rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})|([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
        return  rgb ? [ parseInt(rgb[1] || 255, 16), parseInt(rgb[2] || 255, 16), parseInt(rgb[3] || 255, 16), parseInt(rgb[3] || 255, 16) ] : null;
    }

    static perc2hex(p=0) {
        if(p>1) p/=100
        return parseInt(255 * p).toString(16).fill('0', 2, -1).toUpperCase().slice(0, 2)
    }

    static em2px(n=1) {
        return parseFloat(getComputedStyle(document.body).fontSize)*n;
    }

    static download(data, filename, filetype="text"){
        if(!data) return;
        if(!filename) filename = 'fw.txt';
        if(typeof data === "object") data = JSON.stringify(data);
        var
        blob = new Blob([data], {type: filetype})
        , e = document.createEvent('MouseEvents')
        , a = document.createElement('a')
        ;;
        a.download = filename;
        a.href = window.URL.createObjectURL(blob);
        a.dataset.downloadurl =  [ filetype, a.download, a.href].join(':');
        e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        a.dispatchEvent(e);
    }

    static copy2clipboard = (str, msg=false) => {
        const el = document.createElement('textarea');
        el.value = str;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        if(msg) fw.notify(`${str} copied to clipboard!`)
    }

    static async delay(ms=1000) {
        return new Promise(res => setTimeout(res, ms));
    }

    static $(wrapper = null, context = document) {
        const t = [].slice.call(context.querySelectorAll(wrapper));
        // if(t[0] && t[0].id && t[0].id == wrapper.split(`#`)[1]) return t[0]
        return t
    }

    static nfmt = (n, f=2) => n && (n).toFixed(f)*-1 ? n.toFixed(f).replace(`.`, `,`).replace(/\B(?=(\d{3})+(?!\d))/g, ".") : `-`


    static increment(target, value, config = {}) {
        try {

            config = config || {}

            let v = (target.value||target.text()) * 1 || 0 ;;

            if(v == value || !target) return

            config.d = config.d || v < value
            config.pace = config.pace || (Math.abs(value) - Math.abs(v)) / 10
            config.fixed = config.fixed || 0
            config.fill = config.fill || 0

            v += config.pace
            target.value = v

            config.count = (config.count||0)
            if(config.count++ > 10 || (config.d && v >= value) || (!config.d && v <= value)){
                target.value = value
                return target.text((config.nerd ? value.nerdify(config.fixed||1) : value.toFixed(config.fixed||0).fill('0', config.fill||0)) + (config?.suffix||""))
            }
            target.text(config.nerd ? v.nerdify(config.fixed||1) : v.toFixed(config.fixed||0).fill('0', config.fill||0))
            setTimeout(increment, 20, target, value, config)
        } catch(e) { console.trace(e) }
    }

};

$ = fw.$

const
initpool = new Pool()
, bootloader = new Loader()
, App = fw
, GET = get = async (url, args) => {
    let callback, data, head ;;
    if(typeof args == `function`) callback = args
    else {
        callback = args?.callback || args?.cb || null
        data = args?.data || args?.payload || null
        head = args?.head || args?.headers || null
    }
    let res = await fw.call(url + (data ? `?${new URLSearchParams(data).toString()}` : ''), null, 'GET', head) ;;
    try { res = JSON.parse(res.res) } catch(e) { res = res.res }
    return callback ? callback(res) : res
}
, POST = post = async (url, args) => {
    let callback, data, head ;;
    if(typeof args == `function`) callback = args
    else {
        callback = args?.callback || args?.cb || null
        data = args?.data || args?.payload || null
        head = args?.head || args?.headers || null
    }
    let res = await fw.call(url, data, 'POST', head) ;;
    try { res = JSON.parse(res.res) } catch(e) { res = res.res }
    return callback ? callback(res) : res
}
;;

window.oncontextmenu = (e, all=false) => {
    let trigger, evs = [] ;;
    if(e.path) e.path.forEach(e => {
        const ev = e.dataset?.contextevent || e.contextevent || el.getAttribute('contextevent') ;;
        if(ev) {
            evs.push(ev)
            if(!trigger) trigger = e
        }
    })
    else if(e.target || e.srcElement) {
        let el = (e.target || e.srcElement) ;;
        do {
            const ev = el.dataset.contextevent || el.contextevent || el.getAttribute('contextevent') ;;
            if(ev) {
                evs.push(ev)
                if(!trigger) trigger = el
            }
            el = el.parent()
        } while(el.tagName != 'HTML')
    }
    evs = evs.filter(i=>i)
    try{
        if(!all) { if(evs.length && fw.contextEvents && fw.contextEvents[evs[0]]) fw.contextEvents[evs[0]](trigger, e) }
        else for(let i of evs) { if(evs.length && fw.contextEvents && fw.contextEvents[i]) fw.contextEvents[i](trigger, e) }
    } catch(er) {
        console.trace(er)
        try {
            if(evs.length) evs[0](trigger, e)
        } catch(err) { console.trace(err)}
    }
    return false
}

// LIBS
function include(path, args) {
    const id = path.hash() ;;
    if($('#scr-' + id).length) return
    const s = document.createElement('script') ;;
    s.id = `scr-${id}`
    s.type = 'text/javascript'
    s.src = path.indexOf(".js") + 1 ? path : path + '.js'
    s.args = args || {}
    document.getElementsByTagName('head')[0].appendChild(s)
}

function selects() {
    $(`fselect`).forEach(sel => {
        const
        ft      = sel.attributes[`font`]?.value || fw.palette.FONT
        , bg    = sel.attributes[`bg`]?.value   || fw.palette.FOREGROUND
        , cls   = sel.className
        , rect  = sel.parent().getBoundingClientRect()
        , h = Math.max(fw.em2px(2), rect.height)
        , change = sel.attributes['@change']?.value || sel.attributes['onchange']?.value
        , behavior = sel.attributes['behavior']?.value
        , e = TAG(`form`, `relative wrap p0 m0 only-pointer _select` + cls, {
            overflow: `hidden`
            , border:`1px solid ${ft}44`
            , borderRadius: `.25em`
            , color: ft
            , background: bg
        }).app(
            DIV(`wrap no-scrolls`, { borderRadius:`.25em` }).app([
                DIV(`relative bar`, { width:`calc(100% - ${h}px)` }).app([
                    TAG(`input`).attr({ type: `hidden`, name: sel.attributes[`name`]?.value })
                    , TAG(`input`, `row centered ellipsis content-left px only-pointer`, {
                        border:`none`
                        , color: ft
                        , background: 'none'
                    }).attr({
                        tip:`@`
                        , type: `text`
                        , readonly: `true`
                        , placeholder: sel.getAttribute(`placeholder`) || `-`
                    })
                ])
                , DIV(`relative right bar`, { width: (h - 4) + `px` }).app(
                    SPAN(`arrow_drop_down`, `icon centered`, { fontSize:`1.5em` })
                )
            ])
        ).attr({
            action: `javascript:void(0)`
            , name: sel.getAttribute(`name`)
        }).on(`click`, ev => {
            const rect = e.getBoundingClientRect() ;;
            e.form.remClass(`_blured`).css({ top: rect.y + 'px', left: rect.x + 'px'})
            e.form.show()
            e.form.$('input')[0].focus()
        })
        , menu  = DIV(`fixed _menu`, {
            boxShadow: `0 0 1em ${fw.palette.DARK2}`
            , border:`1px solid ${ft}44`
            , borderRadius: `.5em`
            , background: bg
            , color: ft
            , top: rect.y + `px`
            , left: rect.x + `px`
            , width: rect.width + `px`
            , zIndex: 9000
        }).app(
            DIV(`row _Searcher`, { height: `${h}px`}).app([
                DIV(`relative left bar pl2`, { width: `calc(100% - ${h}px` }).app(
                    TAG(`input`, `centered px2 row`, {
                        border: 'none'
                        , background: 'none'
                        , color: ft
                    }).attr({
                        type: `text`
                        , placeholder: `Filter:`
                    }).on([ `keyup`, `blur` ], ev => search_ev.fire(ev))
                )
                , DIV(`relative left bar only-pointer`, { width: h + `px` }).app(
                    SPAN(`close`, `centered icon`)
                ).on(`click`, _ => menu.hide())
            ])
        ).app(
            DIV(`row scrolls -stage`, { maxHeight: `28vh` })
        ).on(`mouseenter`, e => menu.remClass(`_blured`)).on(`mouseleave`, e => menu.addClass(`_blured`))
        ;;
        ;[].slice.call(sel.children).forEach(item => menu.$(`.-stage`)[0].app(
            item.mime().addClass(`row pointer tile content-left ellipsis -item`).css({
                padding:`.5em`
                , minHeight: '2em'
                , borderBottom: `1px solid ${fw.palette.DARK2}`
            }).on(`click`, ev => {
                menu.$(`item`).not(ev.target).forEach(item => item.removeAttribute(`selected`))
                ev.target.setAttribute(`selected`, true)
                e.$(`input`)[0].value = ev.target.attributes["value"]?.value
                e.$(`input`)[1].value = ev.target.textContent
                e.dispatchEvent(new Event(`change`))
                if (change) {
                    try {
                        let tmp = change ;;
                        if(typeof tmp == 'string') tmp = eval(change)
                        if(typeof tmp == 'function') tmp(ev.target.attributes["value"]?.value, ev.target)
                    } catch(e) { console.log(e, '\n', change) }
                }
                menu.hide()
            })[behavior == 'hint' ? 'hide' : 'show']()
        ))
        e.form = menu
        sel.parent().pre(e)
        $(`body`)[0].app(menu)
        menu.$(`.-item`).forEach(item => {
            if([ `true`, `selected`, `checked`, `default`, `1`, 1 ].indexOf(item.attributes[`selected`]?.value.toLowerCase())+1) item.dispatchEvent(new Event(`click`))
        })
        // if(sel.attributes[`initial-value`]) {
        //     e.form.$(`[value="${sel.attributes[`initial-value`].value}"]`)[0]?.dispatchEvent(new Event(`click`))
        // }
        sel.remove()
        const search_ev = new throttle(ev => {
            menu.$(`.-item`).forEach(item => {
                if(behavior == 'hint'){
                    if(!ev.target.value || !ev.target.value.sanitized_compare(item.textContent)) item.hide()
                    else item.show()
                } else {
                    if(!ev.target.value || ev.target.value.sanitized_compare(item.textContent)) item.show()
                    else item.hide()
                }
            })
        }, 40) ;;
        e.spy('value', (v, p, e) => {
            menu.$(`.-item`).forEach(item => {
                if(item.attributes["value"]?.value?.toLowerCase() == v.toLowerCase()) {
                    item._value = v
                    item.click()
                }
            })
        })
        e.val = v => {
            if(v !== undefined) e.value = v
            return e._value
        }
        tileEffect(`.tile`)

        if(sel.attributes[`value`]) {
            e.val(sel.attributes[`value`].value)
        }

        menu.hide()
        sel.remove()
    })
}

function lists() {
    $(`flist`).forEach(sel => {
        const
        ft      = sel.attributes[`font`]?.value || fw.palette.FONT
        , bg    = sel.attributes[`bg`]?.value   || fw.palette.FOREGROUND
        , cls   = sel.className
        , rect  = sel.parent().getBoundingClientRect()
        , h = Math.max(fw.em2px(6), rect.height)
        , change = sel.attributes['@change']?.value || sel.attributes['onchange']?.value
        , e = DIV(`relative wrap p0 m0 _list ` + cls, {
            overflow: `hidden`
            , background: fw.palette.FOREGROUND
            , borderRadius:`.5em`
            , border: `1px solid ${ft}44`
        }).app(
            TAG(`form`, `wrap no-scrolls m0 p0`, { height: rect.height + `px` }).attr({ action: `javascript:void(0)`, name: sel.getAttribute(`name`) }).app([
                TAG(`input`).attr({ type:`hidden`, name: sel.attributes[`name`]?.value })
                , DIV(`row _Searcher`, { height: `2em`, borderBottom: `1px solid {{font}}44`}).app([
                    DIV(`relative wrap`).app(
                        TAG(`input`, `row centered px`, { border: 'none' }).attr({
                            type: `search`
                            , placeholder: `Filter:`
                        }).on([ `keyup`, `blur` ], ev => search_ev.fire(ev))
                    )
                ])
                , DIV(`row scrolls -stage`, { height: `calc(100% - 2em)` })
            ])
        )
        ;;
        [].slice.call(sel.children).forEach(item => e.$(`.-stage`)[0].app(
            DIV(`row flex only-pointer no-scrolls tile -item -active m0 px`, {
                height: `2em`
                , borderRadius: `.25em`
            }).app(
                item.mime().addClass(`wrap content-left ellipsis no-scrolls m0 px`)
            ).on(`click`, ev => {
                e.$(`.-item`).not(ev.target).css({ background: `transparent`, border:`none` })
                ev.target.css({ background: `{{span}}44`, border: `2px solid {{span}}` })
                ev.target.upFind(`form`).$(`input[type=hidden]`)[0].value = ev.target.textContent
            })
        ))
        sel.parent().pre(e)
        e.$(`item`).forEach(item => {
            if([ `true`, `selected`, `checked`, `default`, `1`, 1 ].indexOf(item.attributes[`selected`]?.value.toLowerCase())+1) item.dispatchEvent(new Event(`click`))
        })
        // if(sel.attributes[`initial-value`]) {
        //     sel.attributes[`initial-value`].value.split(`,`).forEach(item => e.$(`[value="${item}"]`)[0]?.dispatchEvent(new Event(`click`)))
        // }
        sel.remove()
        const
        search_ev = new throttle(ev => {
            e.$(`.-item`).forEach(item => {
                if(!ev.target.value || ev.target.value.sanitized_compare(item.textContent)) {
                    item.addClass(`-active`).show()
                } else {
                    item.remClass(`-active`).hide()
                }
            })
        }, 40)
        ;;
        tooltips()
        tileEffect(`.tile`)
    })
}

function multiselects() {
    $(`fmultiselect`).forEach(sel => {
        const
        ft = sel.attributes[`font`]?.value || fw.palette.FONT
        , bg = sel.attributes[`bg`]?.value   || fw.palette.FOREGROUND
        , cls = sel.className
        , rect = sel.parent().getBoundingClientRect()
        , h = Math.max(fw.em2px(2), rect.height)
        , change = sel.attributes['@change']?.value || sel.attributes['onchange']?.value
        , input = TAG(`input`, `row centered ellipsis content-left px -tooltip _label`, {
            border: 'none'
            , background: bg
            , color: ft
        }).attr({
            tip:`@`
            , type: `text`
            , readonly: `true`
            , placeholder: sel.getAttribute(`placeholder`) || `-`
        })
        , e = DIV(`relative wrap p0 m0 _multiselect ` + cls, {
            overflow: `hidden`
            , background: bg
            , color: ft
            , borderRadius:`.25em`
            , border: `1px solid ${ft}44`
        }).app(
            DIV(`wrap only-pointer no-scrolls`, { borderRadius:`.5em` }).app(
                DIV(`relative bar`, { width:`calc(100% - ${h}px)` }).app(input)
            ).app(
                DIV(`relative right bar`, { width: (h - 4) + `px` }).app(
                    SPAN(`arrow_drop_down`, `icon centered`, {
                        color: fw.palette.FONT
                        , fontSize:`1.5em`
                    })
                )
            )
        ).on(`click`, _ => {
            const rect = e.getBoundingClientRect() ;;
            e.form.remClass(`_blured`).css({ top: rect.y + 'px', left: rect.x + 'px'}).show().$(`input[type=text]`)[0].focus()
        })
        , menu = TAG(`form`, `fixed _menu`, {
            boxShadow: `0 0 1em ${fw.palette.DARK2}`
            , border:`1px solid ${ft}44`
            , borderRadius: `.25em`
            , background: bg
            , color: ft
            , top: rect.y + `px`
            , left: rect.x + `px`
            , width: 'calc(' + rect.width + 'px - .5em)'
            , zIndex: 9000
        }).attr({
            action: `javascript:void(0)`
            , name: sel.getAttribute(`name`)
        }).app([
            DIV(`row _Searcher`, { height: `${h}px`}).app([
                DIV(`relative left bar`, { width: h + `px` }).app(
                    TAG(`input`, `centered only-pointer p0 m0 _master-check`).attr({ type:`checkbox` }).on(`click`, ev => {
                        menu.$(`.-item.-active`).map(item => item.$(`._check`)[0].checked = ev.target.checked)
                        fill_label.fire()
                    })
                )
                , DIV(`relative left bar`, { width: `calc(100% - ${h*2}px` }).app(
                    TAG(`input`, `row centered px`, {
                        border: 'none'
                        , background: bg
                        , color: ft
                    }).attr({
                        type: `text`
                        , placeholder: `Filter:`
                    }).on([ `keyup`, 'blur' ], ev => {
                        if(ev.key == 'Enter') ev.target.upFind('_Searcher').$('._master-check')[0].click()
                        else search_ev.fire(ev)
                    })
                )
                , DIV(`relative left bar only-pointer`, { width: h + `px` }).app(
                    SPAN(`close`, `centered icon`)
                ).on(`click`, _ => menu.hide())
            ])
            , DIV(`row scrolls -stage`, { maxHeight: `28vh` })
        ]).on(`mouseenter`, e => e.target.remClass(`_blured`)).on(`mouseleave`, e => e.target.addClass(`_blured`))
        ;;
        let count = 0 ;;
        ;[].slice.call(sel.children).sort((p, q) => p.textContent.localeCompare(q.textContent)).forEach(item => menu.$(`.-stage`)[0].app(
            DIV(`row flex only-pointer no-scrolls tile -item -active m0 p0 content-left`, { borderBottom: `1px solid ${fw.palette.DARK2}`, height: '2em' }).app([
                DIV(`relative bar`, { width: h + `px` }).app(
                    TAG(`input`, `centered p0 m0 _check`,).attr({
                        type:`checkbox`
                        , name: sel.attributes[`name`]?.value||``
                        , value: item.attributes[`value`]?.value||item.textContent||``
                    })
                )
                , item.mime().emptyClasses().addClass(`bar content-left ellipsis no-scrolls m0 px`).css({ width: `calc(100% - ${h}px)` })
            ]).on(`click`, function() {
                this.$(`[type=checkbox]`)[0].click()
                if(!this.$(`[type=checkbox]`)[0].checked) $(`._master-check`)[0].checked = false
                fill_label.fire()
            }).attr({ selected: item.getAttribute('selected') || null })
        ))
        e.form = menu
        e.input = input
        sel.parent().pre(e)
        $(`body`)[0].app(menu)
        menu.$(`.-item`).forEach(item => {
            if([ `true`, `selected`, `checked`, `default`, `1`, 1 ].indexOf(item.attributes[`selected`]?.value.toLowerCase())+1) item.dispatchEvent(new Event(`click`))
        })

        const
        fill_label = new throttle(_ => {
            const values = menu.$(`.-item.-active`).map(item => item.$(`._check`)[0].checked ? item.textContent : null).filter(i=>i) ;;
            e.$(`._label`)[0].value = values.join(` - `)
            e._value = values.join(',')
            if(menu.$(`.-item.-active`).filter(item => {
                item.show()
                return item.$(`._check`)[0].checked == false
            }).length) menu.$(`._master-check`)[0].checked = false
            else menu.$(`._master-check`)[0].checked = true
            if (change) try { eval(change)(menu.json(), e) } catch(e) { console.trace(e) }
        }, 40)
        , search_ev = new throttle(ev => {
            menu.$(`.-item`).forEach(item => {
                if(!ev.target.value || ev.target.value.sanitized_compare(item.textContent)) {
                    item.addClass(`-active`).show()
                } else {
                    item.remClass(`-active`).hide()
                    item.$(`._check`)[0].checked = false
                }
            })
        }, 40)
        ;;
        e.fill_label = _ => fill_label.fire()
        e.erase = _ => {
            const mc = e.form.$('._master-check')[0] ;;
            mc.checked = false
            mc.dispatchEvent(new Event(`click`))
        }
        e.spy('value', (v, p, e) => {
            e.form.$('[type=checkbox]').forEach(check => {
                if(check.checked) check.click()
                if(v.split(',').map(_v => _v == check.value).filter(i=>i).length) check.click()
            })
            setTimeout(_ => e.fill_label(), AL/2)
        })
        e.val = v => {
            if(v !== undefined) e.value = v
            return e._value
        }
        tooltips()
        tileEffect(`.tile`)
        if(sel.attributes[`value`]?.value) {
            sel.attributes[`value`].value.split(`,`).forEach(item => menu.$(`[value="${item}"]`)[0]?.click())
            setTimeout(_ => fill_label.fire(), AL)
        }
        menu.hide()
        sel.remove()
    })
}

function multilists() {
    $(`fmultilist`).forEach(sel => {
        const
        ft      = sel.attributes[`font`]?.value || fw.palette.FONT
        , bg    = sel.attributes[`bg`]?.value   || fw.palette.FOREGROUND
        , rect  = sel.parent().getBoundingClientRect()
        , h = Math.max(fw.em2px(6), rect.height)
        , change = sel.attributes['@change']?.value || sel.attributes['onchange']?.value
        , e = DIV(`relative wrap p0 m0 _list`, {
            overflow: `hidden`
            , background: fw.palette.FOREGROUND
            , borderRadius:`.5em`
            , border: `1px solid ${ft}44`
        }).app(
            TAG(`form`, `wrap no-scrolls m0 p0`, { height: rect.height + `px` }).attr({ action: `javascript:void(0)`, name: sel.getAttribute(`name`) }).app([
                DIV(`row _Searcher`, { height: `2em`, borderBottom: `1px solid {{font}}44`}).app([
                    DIV(`relative left bar`, { width: `2em` }).app(
                        TAG(`input`, `centered only-pointer p0 m0 _master-check`).attr({ type:`checkbox` }).on(`click`, ev => {
                            ev.target.upFind(`form`).$(`.-item.-active`).map(item => item.$(`._check`)[0].checked = ev.target.checked)
                        })
                    )
                    , DIV(`relative left bar`, { width: `calc(100% - 2.5em` }).app(
                        TAG(`input`, `row centered px`, { border: 'none' }).attr({
                            type: `search`
                            , placeholder: `Filter:`
                        }).on([ `keyup`, `blur` ], ev => search_ev.fire(ev))
                    )
                ])
                , DIV(`row scrolls -stage`, { height: `calc(100% - 2em)` })
            ])
        )
        ;;
        [].slice.call(sel.children).forEach(item => e.$(`.-stage`)[0].app(
            DIV(`row flex only-pointer no-scrolls tile -item -active m0 p0`, {
                borderBottom: `1px solid ${fw.palette.DARK2}`
                , height: `2em`
            }).app(
                DIV(`relative bar`, { width: `2.5em` }).app(
                    TAG(`input`, `centered p0 m0 _check`).attr({
                        type:`checkbox`
                        , name: sel.attributes[`name`]?.value||``
                        , value: item.attributes[`value`]?.value||item.textContent||``
                    })
                )
            ).app(
                item.mime().addClass(`bar content-left ellipsis no-scrolls m0 px`).css({ width: `calc(100% - 2.5em)` })
            ).on(`click`, function() {
                this.$(`[type=checkbox]`)[0].click()
                if(!this.$(`[type=checkbox]`)[0].checked) $(`._master-check`)[0].checked = false
            })
        ))
        sel.parent().pre(e)
        e.$(`item`).forEach(item => {
            if([ `true`, `selected`, `checked`, `default`, `1`, 1 ].indexOf(item.attributes[`selected`]?.value.toLowerCase())+1) item.dispatchEvent(new Event(`click`))
        })
        // if(sel.attributes[`initial-value`]) {
        //     sel.attributes[`initial-value`].value.split(`,`).forEach(item => menu.$(`[value="${item}"]`)[0]?.dispatchEvent(new Event(`click`)))
        // }
        sel.remove()
        const
        search_ev = new throttle(ev => {
            e.$(`.-item`).forEach(item => {
                if(!ev.target.value || ev.target.value.sanitized_compare(item.textContent)) {
                    item.addClass(`-active`).show()
                } else {
                    item.remClass(`-active`).hide()
                    item.$(`._check`)[0].checked = false
                }
            })
        }, 40)
        ;;
        tooltips()
        tileEffect(`.tile`)
    })
}

function dropdowns() {
    $(`fdropdown`).forEach(dp => {
        const
        cls     = dp.className
        , e     = DIV(`relative wrap _dropdown ` + cls, { overflow: `visible`, minHeight:`2em`, minWidth:'2em' })
        , label = dp.attributes[`label`]?.value         || ``
        , ft    = dp.attributes[`font`]?.value          || fw.palette.FONT
        , bg    = dp.attributes[`bg`]?.value            || fw.palette.FOREGROUND
        , icon  = dp.attributes[`icon`]?.value          || `menu`
        , float = dp.attributes[`orientation`]?.value   || `left`
        , rect  = dp.parent().getBoundingClientRect()
        , h = Math.max(fw.em2px(2), rect.height)
        , menu  = DIV(`abs row _menu`, {
            display:`none`
            , top: `.5em`
            , minWidth: '10em'
        }).app(
            DIV(`row`, { height: `${h}px` }).app(
                SPAN(`arrow_drop_up`, `icon ${float}`, { color: bg, fontSize: `4em`, transform: `translate(${float!=`left` ? `` : `-`}.25em, 0)` })
            )
        ).app(
            DIV(`row scrolls -stage`, {
                borderRadius: `.25em`
                , background: bg
                , color: ft
                , maxHeight: `28vh`
                , boxShadow: '0 0 1em gray'
            })
        ).on(`mouseenter`, e => e.target.remClass(`_blured`)).on(`mouseleave`, e => e.target.addClass(`_blured`))
        ;;
        e.app(
            DIV(`row bar flex`)[float == `left` ? `pre` : `app`](
                DIV(`relative bar`, { width: h + `px`, height: h + `px` }).app(
                    SPAN(icon, `icon centered only-pointer`, { fontSize:`1.75em` })
                ).on(`click`, e => menu.remClass(`_blured`).appear())
            )[float == `left` ? `pre` : `app`](
                DIV(`relative bar`, { width:`calc(100% - ${h}px)`, height: h + `px` }).app(
                    SPAN(label, `centered ellipsis content-${float}`, { width: `calc(100% - 2em)` })
                )
            )
        )
        ;[].slice.call(dp.children).forEach(item => menu.on(`click`, _ => menu.hide()).$(`.-stage`)[0].app(
            item.mime().addClass(`row px2 pointer content-left ellipsis`)
        ))
        if(float == 'left') menu.css({ left:0 })
            else menu.css({ right: 0 })
        dp.parent().css({ padding: 0 }).pre(e.app(menu))
        dp.remove()
    })
}

function switches() {
    $(`fswitch`).forEach(dp => {
        const
        state   = dp.attributes[`value`]?.value * 1     || 0
        , on    = dp.attributes[`on`]?.value            || fw.palette.FONT
        , off   = dp.attributes[`off`]?.value           || fw.palette.FONT + '44'
        , icon  = dp.attributes[`icon`]?.value          || null
        , name  = dp.attributes[`name`]?.value          || `name`
        , change = dp.attributes['onclick']?.value || dp.attributes['onchange']?.value
        , e = SPAN(icon, `icon pointer field -field _switch`).attr({
            name
            , style: dp.getAttribute('style')
            , class: dp.getAttribute('class')
            , color: state ? on : off
            , value: state
        }).on(`click`, ev => {
            const state = !(ev.target.getAttribute('value') * 1 || 0) ;;
            ev.target.setAttribute('value', state ? 1 : 0)
            ev.target.css({ color: state ? on : off }).html(state ? (icon||'toggle_on') : (icon||'toggle_off'))
            if (change) try { eval(change)(ev) } catch(err) { console.trace(err) }
        })
        ;;
        dp.parent().app(e)
        dp.remove()
        e.setAttribute('value', state ? 0 : 1)
        e.click()
    })
}

function tooltips() {
    let ttip = $('tooltip#tooltip')[0];
    if (!ttip) {
        ttip = TAG("tooltip#tooltip", "fixed", {
            padding: ".5em"
            , borderRadius: ".25em"
            , background: fw.palette.BACKGROUND
            , boxShadow: `0 0 .25em ` + fw.palette.FONT
            , color: fw.palette.FONT
            , display: "none"
            , zIndex: 9999
        })
        $("#app").app(ttip)
        // ttip.on("mouseleave", e => e.target.hide())
    }
    $(".-tooltip").forEach(tip => {
        tip.on('mouseenter', e => {
            let
            v = e.target.attributes[`tip`]?.value
                ? (e.target.attributes[`tip`].value == `@` ? (
                    e.target.value
                    || e.target.getAttribute(`value`)
                    || e.target.dataset.value
                    || e.target.innerHTML
                ) : e.target.attributes[`tip`].value)
                : e.target.textContent
            ;;
            if(!v.trim()) return
            ttip.css({
                background: e.target.attributes[`tip-background`]?.value || fw.palette.FONT
                , color: e.target.attributes[`tipclr`]?.value || fw.palette.BACKGROUND
                , width: e.target.attributes[`tipwd`]?.value || 'auto'
            }).html(v).show()
        }).on('mousemove', e => {
            ttip.style.top = e.clientY + "px";
            ttip.style.left = e.clientX + "px";
            ttip.style.transform = (e.clientX > window.innerWidth * .85) ? `translateX(calc(-100% + -${fw.em2px(2)}px)` : 'translateX(3em)';
        }).on('mouseleave', e => ttip.hide()).removeClass("-tooltip")
    })
}

function tileEffect(selector=null, clr=null) {
    if (!selector) return;
    $(`${selector}`).forEach(x => {
        if (!x.has("_effect-selector-attached")&&!x.has("-skip")) {
            x.addClass("relative _effect-selector-attached").on("click", async e => {
                const
                bounds = e.target.getBoundingClientRect()
                , size = Math.max(bounds.width, bounds.height)
                , bubble = DIV("absolute block circle _bubble", {
                    background: clr || (fw.palette.FONT + "44")
                    , width: size + "px"
                    , height: size + "px"
                    , top: e.layerY + "px"
                    , left: e.layerX + "px"
                    , transformOrigin: "center center"
                    , transform: "translate(-50%, -50%) scale(.1)"
                })
                , wrap = DIV(`absolute wrap zero`).app(
                    DIV(`relative left wrap zero no-scrolls`).app(bubble)
                )
                ;;
                e.target.app(wrap)
                await fw.sleep(10)
                await bubble.stop().anime({ transform: "translate(-50%, -50%) scale(1.75)", filter:`opacity(0)` })
                wrap.remove()
            })
        }
    })
}

function enableDragging() {

    $(".-drag-trigger, .-drag").forEach((x, i) => {

        if (x.has(".-drag-enabled")) return
        x.addClass("-drag-enabled")

        var ax = 0, ay = 0, bx = 0, by = 0;
        const
        tgt = x.has("-drag") ? x : x.upFind("-drag-target")
        , dragselect = e => {
            e.preventDefault()
            bx = e.clientX
            by = e.clientY
            document.onmouseup = dragend
            document.onmousemove = dragstart
        }
        , dragstart = e => {
            e.preventDefault()
            tgt.style.transition = 'none'
            tgt.style.transitionDelay = "0s"
            ax = bx - e.clientX
            ay = by - e.clientY
            bx = e.clientX
            by = e.clientY
            tgt.style.top = Math.min(window.innerHeight - fw.em2px(3), Math.max(0, tgt.offsetTop - ay), window.innerHeight - tgt.offsetHeight) + "px"
            tgt.style.left = Math.min(Math.max(0, Math.min(window.innerWidth - fw.em2px(3), tgt.offsetLeft - ax)), window.innerWidth - tgt.offsetWidth) + "px"
        }
        , dragend = e => {
            document.onmouseup = null
            document.onmousemove = null
        }
        ;;

        if (tgt == $('#app')) return;

        x.attr({ draggable: "true" }).onmousedown = dragselect;
    })
}

document.addEventListener("touchstart", function() {}, true);

console.log(`  ____ _     ___   __  __  ___  ____  _____\n / ___| |   |_ _| |  \\/  |/ _ \\|  _ \\| ____|\n| |   | |    | |  | |\\/| | | | | | | |  _|\n| |___| |___ | |  | |  | | |_| | |_| | |___\n \\____|_____|___| |_|  |_|\\___/|____/|_____|\n\n`);