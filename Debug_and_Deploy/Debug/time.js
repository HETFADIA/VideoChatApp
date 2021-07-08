function currentTime(){
    var today = new Date();
    var hrs=today.getHours();
    var min=today.getMinutes();
    var delay=" AM"

    if(hrs>12){
        hrs-=12
        delay=" PM"
    }
    else if(hrs==0){
      hrs=12;
    }
    else if(hrs==12){
        dealy=" PM"
    }
    if(hrs<10){
        hrs='0'+hrs;
    }
    if(min<10){
        min='0'+min;
    }
    return hrs+":"+min+delay;
}
var today = new Date();
var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
console.log(time)
var time = today.getHours() + ":" + today.getMinutes();
console.log(time)
console.log(currentTime())