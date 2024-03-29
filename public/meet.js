let username="Anon"
if(sessionStorage.getItem('username')!=null){
    username=sessionStorage.getItem('username');
}
let id
const socket = io('/')
const videoGrid = document.getElementById('video-grid')
const ScreenCaptureElement=document.getElementById('screen-share')
let usersCount=0
let people=[]
let peopleCount=0
let screenShared=0
let shareTracker=0;
let shareScreenUserId=-1;

const myPeer = new Peer(undefined, {
    host: '/',
    path: '/peerjs',
    port: '443' //443 for hosting at heroku
})
let myVideoStream;
let conn;
const myVideo = document.createElement('video')
myVideo.muted = true;
const peers = {}
navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream,id)
    myVideoStream.getAudioTracks()[0].enabled=0;
    myVideoStream.getVideoTracks()[0].enabled=0;

    socket.on('user-connected', (userId,newusername) => {
        // updatePeople()
        var conn = myPeer.connect(userId);
        conn.on('open', function(){
            conn.send(username);
        });
        connectToNewUser(userId, stream)
    })

    
    socket.on("createMessage", (message,username) => {
        var currTime=currentTime();
        console.log(currTime)
        var string=`<span class="messages right-padding"><b>${username}</b> ${currTime}<br/>${message}</span><br><br>`
        $("#messages").append(string);
        scrollToBottom()
    })
    socket.on("userAddRem",(username,joined)=>{
        var string="";
        if(joined){
            string=`<i>${username} joined</i><br><br>`
        }
        else{
            string=`<i>${username} left</i><br><br>`
        }
        $("#messages").append(string);
        scrollToBottom()
    })
    myPeer.on('call', function(call){
            console.log(call.peer + ' called');
            shareTracker = 0;
            //answering a call and sending them our stream
            if(peers[call.peer]){
                shareTracker = 1;
            }
            if(shareTracker === 0){
                peers[call.peer] = call;
                call.answer(stream);
            }
            else{
                //one way
                call.answer()
            }
            
            const video = document.createElement('video');
            
            console.log("sharetracker",shareTracker)
            call.on('stream', function(remoteStream){
                if(shareTracker==0){
                    addVideoStream(video, remoteStream,call.peer);
                }
                else{
                    
                    injectScreenIntoField(ScreenCaptureElement, remoteStream,call.peer);
                }
            })
    })
})

const injectScreenIntoField = (videoElement, ScreenShareStream, ShareUserPeerID) => {
    videoElement.srcObject = ScreenShareStream;
    videoElement.style.display = 'flex';
    shareScreenUserID = ShareUserPeerID;
}
let name_input=$("#username");

function newUserAdd(){
  
      if(name_input.val().trim().length === 0){
        document.getElementById("nullLength").innerHTML="Please Enter Name"
        return;
      }
        username=name_input.val().trim();
        
        addUserName(username)
        EnterMeet()
      
      
        sessionStorage.setItem('username',username)
        console.log("myPeer id username",id,username)
        socket.emit('join-room', ROOM_ID, id,username)
}
var displayMediaObject = {
    video: {
      cursor: "always"
    },
    audio: false
};
let text = $("#chat_message");

$('#chat_message').keydown(function (e) {
    if (e.which == 13 && text.val().length !== 0) {
        socket.emit('message', text.val(),username);
        text.val('')
    }
});
isScreenBeingShared=false;
$('#screenShare').on('click', async () => {
    
    
    if(!isScreenBeingShared){
        CapturedStream = await captureScreenMedia();
        isScreenBeingShared = true;
        let UserIDList = Object.keys(peers);
        for(let i = 0; i < UserIDList.length; i++){
            myPeer.call(UserIDList[i], CapturedStream);
        }
        ScreenCaptureElement.style.display = 'flex';
        

        CapturedStream.getVideoTracks()[0].onended = () => {
            
            console.log('stop screen capture');
            ScreenCaptureElement.style.display = 'none';
            isScreenBeingShared = false;
            console.log("150")
            socket.emit('share-screen-end');
            
        };
    }
    else{
        console.log("156")
        socket.emit('share-screen-end');
        stopScreenMediaCapture();
        isScreenBeingShared = false;
        
    }
})
socket.on('update-screen-share-status', () => {
    stopScreenMediaCapture();
    shareScreenUserID = -1;
    console.log('executed')
})
const  captureScreenMedia = async () => {
    console.log('screen capture begins');
    let saveTheStream =  await navigator.mediaDevices.getDisplayMedia(displayMediaObject);
    ScreenCaptureElement.srcObject = saveTheStream;
    return saveTheStream;
}

const stopScreenMediaCapture = async () => {
    let tracks = ScreenCaptureElement.srcObject.getTracks();
    tracks.forEach(track => track.stop());
    ScreenCaptureElement.srcObject = null;
    ScreenCaptureElement.style.display = 'none';
}
function addUserName(username){
    console.log("username received at script.js line 75",username);
    console.log("room id at line 76",ROOM_ID)
    socket.emit('add-Username',username,ROOM_ID)
}
function removeVideo(videoId){
    console.log("video id to be rem",videoId)
    $(`#${videoId}`).remove();
}
socket.on('user-disconnected', (userId,username) => {
    console.log("user-disconnected",username)
    removeVideo(userId)
    if (peers[userId]) peers[userId].close()
    if(shareScreenUserID === userId){
        stopScreenMediaCapture();
        shareScreenUserID = -1;
    }
})
socket.on('userlist',users=>{
    console.log("userlist reached script line 97",users);
    var string=""
    
    
    for(var i=0;i<users.length;i++){
        string+="<span class='people'>"+users[i]+"</span>"+"</br>"+"<br>";
    }
    console.log(string)
    document.getElementById("userlist").innerHTML=string;
})
myPeer.on('open', ID => {
    id = ID
})

function connectToNewUser(userId, stream) {
    const call = myPeer.call(userId, stream)
    const video = document.createElement('video')
    
    call.on('stream', userVideoStream => {

        addVideoStream(video, userVideoStream,userId)
    })
    call.on('close', () => {

        video.remove()
        usersCount=document.getElementById("video-grid").childElementCount;
    scrollVideos(usersCount);
  })

  peers[userId] = call
}

function updatePeople(username){
    people.push(username)
    peopleCount++;
}

function scrollVideos(number){
    // if(number>4){
    if(number){
      document.getElementsByClassName("main__videos")[0].style.overflowY="scroll";

    }
    else{
      document.getElementsByClassName("main__videos")[0].style.overflowY="hidden";
    }
}
function addVideoStream(video, stream,user_id) {
    video.srcObject = stream
    video.addEventListener('loadedmetadata', () => {
      video.play()
    })
    console.log("id")
    video.id=user_id;
    

    videoGrid.append(video)
    usersCount=document.getElementById("video-grid").childElementCount;
    if(isScreenBeingShared){
        myPeer.call(user_id, CapturedStream);
    }
    scrollVideos(usersCount);
    
}



const scrollToBottom = () => {
    var d = $('.main__chat_window');
    d.scrollTop(d.prop("scrollHeight"));
}


const muteUnmute = () => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
      myVideoStream.getAudioTracks()[0].enabled = false;
      setUnmuteButton();
    } else {
      setMuteButton();
      myVideoStream.getAudioTracks()[0].enabled = true;
    }
}

const playStop = () => {
    console.log('object')
    let enabled = myVideoStream.getVideoTracks()[0].enabled;
    if (enabled) {
      myVideoStream.getVideoTracks()[0].enabled = false;
      setPlayVideo()
    } else {
      setStopVideo()
      myVideoStream.getVideoTracks()[0].enabled = true;
    }
}

const setMuteButton = () => {
    const html = `
      <i class="fas fa-headset"></i>
      <span>Mute</span>
    `
    document.querySelector('.main__mute_button').innerHTML = html;
}

const setUnmuteButton = () => {
    const html = `
      <i class="unmute fas fa-headset"></i>
      <span>Unmute</span>
    `
    document.querySelector('.main__mute_button').innerHTML = html;
}

const setStopVideo = () => {
    const html = `
      <i class="fas fa-video"></i>
      <span>Stop Video</span>
    `
    document.querySelector('.main__video_button').innerHTML = html;
}

const setPlayVideo = () => {
    const html = `
    <i class="stop fas fa-video-slash"></i>
      <span>Play Video</span>
    `
    document.querySelector('.main__video_button').innerHTML = html;
}

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
function EnterMeet(){
    document.body.style.backgroundColor="white";
    document.getElementById("login").style.display="none"
    document.getElementById("meet").style.display="block"
    document.getElementById("users").style.display="none"
}


function close_window() {
    if (confirm("Close Window?")) {
      close();
    }
}
function hidechat(){
    var ischat=document.getElementById("main_right").style.display
    console.log("hi")
    if(ischat=="none"){
      document.getElementById("main_right").style.display="flex"
      document.getElementById("users").style.display="none"
      document.getElementById("users").style.flex=0
      document.getElementById("main__left").style.flex=0.8
      document.getElementById("main_right").style.flex=0.2
      console.log("chat removed")
    }
    else{

      document.getElementById("main_right").style.display="none"
      document.getElementById("main__left").style.flex=1
      document.getElementById("users").style.display="none"
      console.log("chat added")
    }
  
}
function showUsers(){
    var isUsers=document.getElementById("users").style.display;
    if(isUsers=="none"){
      document.getElementById("main_right").style.display="none"
      document.getElementById("users").style.display="flex"
      document.getElementById("main_right").style.flex=0
      document.getElementById("main__left").style.flex=0.8
      document.getElementById("users").style.flex=0.2
    }
    else{
      document.getElementById("users").style.display="none"
      document.getElementById("main__left").style.flex=1
      document.getElementById("users").style.flex=0
      document.getElementById("main_right").style.flex=0
    }
}

function shareScreen(){
    
}

const copyToClipboard = str => {
    //https://www.30secondsofcode.org/articles/s/copy-text-to-clipboard-with-javascript
    const el = document.createElement('textarea');
    el.value = str;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
};
function copyURL(){
    console.log(window.location.href,"successfully copied")
    copyToClipboard(window.location.href)
    var popup = document.getElementById("copy-link");
    popup.classList.toggle("show");
}
const updatecolor=(string)=>{
    document.getElementById(string).style.color="blue";
}
const updatefont=(string)=>{
    document.getElementById(string).style.fontFamily="verdana";
}
const beautify=(string)=>{
    updatecolor(string);
    updatefont(string);
}
function list(a){var res=[];for(let i of a){res.push(i)};return res}
function set(a){var res=new Set();for(let i of a){res.add(i)};return res}
function getEmojis(){
    var string="🌼🌺🌸😂🤩😭😡👍🙂🤗🤯🔥🥳🥺👿🤭🎉😓😤🤝😖😑😅🎂🤮😵😿🤢🤔🙊😇😀🙊🙉🙈"
    string+="👿😳😮😘😚😗😙😽😍"
    console.log(string)
    return list(set(string))
}
Emoji=getEmojis()
function random(a,b){
    let minimum=a;
    let difference=b-a;
    return Math.floor(minimum+Math.random()*difference);
}
function randomChoise(a){
    var randomIndex=random(0,a.length)
    console.log(randomIndex,a[randomIndex])
    return a[randomIndex]
}
function showEmoji(){
    var string=randomChoise(Emoji)
    socket.emit('message', string,username);
}
function endmeet(){
    window.location.href = `/${ROOM_ID}/bye`;
}
function myFunction(){
    hidechat()
    document.getElementById('copytext').style.display="none"
}

var variable;

function EmptyFunction(){
    
    clearInterval(variable)
    document.getElementById("copytext").style.display = "none";
}
function openForm() {
    
    document.getElementById("copytext").style.display = "block";
    variable=setInterval(EmptyFunction,100)
    
  }