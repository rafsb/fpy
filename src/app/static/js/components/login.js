(function(app, args){

    const
    d = DIV('fixed zero wrap bg').app(
        TAG('form', 'col-2 centered fg', { padding:`1em`, borderRadius:`.5em`, boxShadow:`0 0 .5em {{dark3}}` }).attr({ action:'javascript:void(0)' }).app([
            TAG('header', 'row', { marginBottom: `2em` }).app([
                IMG('assets/img/logo.png', 'left', { height:'3em', width:'3em', borderRadius:'50%', boxShadow:'0 0 1em {{dark2}}' })
                , SPAN('LOGIN', 'col-6 right content-right', { 
                    color:'white'
                    , borderRadius:'0 1.5em 1.5em 0'
                    , padding:`1em 1.5em`
                    , backgroundImage: 'linear-gradient(to left, {{belize_hole}}44, transparent)' 
                })
            ])
            , DIV('row').app(
                TAG('input', 'row').attr({ name:'user', type:'user', placeholder:'Usuário' })
            )
            , DIV('row', { margin: "1em 0"}).app(
                TAG('input', 'row -hash').attr({ name:'pswd', type:'password', placeholder:'Senha' })
            )
            , DIV('row').app(
                TAG('input', 'row only-pointer', {
                    background:'{{belize_hole}}'
                    , color: 'white'
                    , padding: '.75em'
                    , borderRadius:`1.5em`
                }).attr({ type:'submit', value:'PRONTO' }).on('click', function() {
                    const data = this.upFind('form').json() ;;
                    post('auth/sign', { 
                        data
                        , callback: res => {
                            if(res.status) {
                                app.storage('uat', res.uat)
                                app.success('Login realizado com sucesso! Reiniciando o sistema...')
                                setTimeout(_ => location.reload(), AL*2)
                            } else {
                                app.storage('uat', "")
                                app.error('Ops! Algo deu errado, tente novamente mais tarde...')
                            }
                        } 
                    })
                })
            )
            , DIV('row content-center').app(
                SPAN('OU', null, { color:'{{SILVER}}44', padding:'1em' })
            )
            , DIV('row').app(
                TAG('input', 'row', { background:'{{silver}}22', color:"{{silver}}" }).attr({ name:'token', type:'text', placeholder:'Chave' })
            )
        ])
    )
    ;;

    $('#app')[0].empty().app(d)

})