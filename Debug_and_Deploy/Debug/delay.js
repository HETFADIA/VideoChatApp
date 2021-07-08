a=0
b=0
function fun(b){
    a+=1;
    console.log(a,b++)
    if(a==10){
        clearInterval(variable)
    }
}
var variable=setInterval(fun,1000,b)


