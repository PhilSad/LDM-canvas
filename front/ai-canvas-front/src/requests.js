let URL_REGISTER_IF_NOT_EXIST = ""

function send_connexion_request (credential){
    fetch(URL_REGISTER_IF_NOT_EXIST + new URLSearchParams(
        credential=credential
    ))
}