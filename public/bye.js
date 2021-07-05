function byeFunction(){
    console.log("reached here")
}
function Rejoin(){
    history.go(-1)
}
function leave(){
    // history.go(-1)
    window.location.href="chrome://newtab/"
}
function anotherRoom(){
    history.go(-2)
    // window.location.href="http://localhost:443/"
}
