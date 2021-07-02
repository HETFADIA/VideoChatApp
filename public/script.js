let username="Anon"
const socket = io('/')
const videoGrid = document.getElementById('video-grid')
let usersCount=0
let people=[]
let peopleCount=0
const myPeer = new Peer(undefined, {
  host: '/',
  path: '/peerjs',
  port: '3030' //443 for deploy 3030 for local
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
  addVideoStream(myVideo, stream)
  

  socket.on('user-connected', userId => {
    // updatePeople()
    connectToNewUser(userId, stream)
  })

  let text = $("#chat_message");

  $('html').keydown(function (e) {
    if (e.which == 13 && text.val().length !== 0) {
      socket.emit('message', text.val(),username);
      text.val('')
    }
  });
  socket.on("createMessage", (message,username) => {
    var currTime=currentTime();
    console.log(currTime)
    $("ul").append(`<li class="message"><b>${username}</b> ${currTime}<br/>${message}</li>`);
    scrollToBottom()
  })
})
let name_input=$("#username");

function newUserAdd(){
  
      if(name_input.val().trim().length !== 0){

          username=name_input.val().trim();
          if(username.length>27){
            username=username.slice(0,27)
          }
          console.log(username);
          addUserName(username)
          EnterMeet()
      }
      else{
          addUserName(username)
          EnterMeet()
      }

    
}
function addUserName(username){
  console.log("username received at script.js",username);
  socket.emit('add-Username',username)
}
var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
myPeer.on('call', function(call){
  getUserMedia({video: true, audio: true}, function(stream){
      call.answer(stream);
      const video = document.createElement('video');
      call.on('stream', function(remoteStream){
        addVideoStream(video, remoteStream);
      })
  },function(err){
      console.log('Failed to get local stream' ,err);
  })
})

socket.on('user-disconnected', userId => {

  if (peers[userId]) peers[userId].close()
})
socket.on('userlist',users=>{
    console.log("userlist reached script",users);
    var string=""
    var spaces=""
    var spacestimes=6;
    for(var i=0;i<spacestimes;i++){
      spaces+="&nbsp;"
    }
    for(var i=0;i<users.length;i++){
      string+=spaces+users[i]+"</br>"+"<br>";
    }
    console.log(string)
    document.getElementById("userlist").innerHTML=string;
})
myPeer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id)
})

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream)
  const video = document.createElement('video')
  
  call.on('stream', userVideoStream => {

    addVideoStream(video, userVideoStream)
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
  // console.log("length",document.querySelector("video"))
  // document.querySelector("video").style.width="50%"
  // document.querySelector("video").style.height="50%"
  if(number>4){
    document.getElementsByClassName("main__videos")[0].style.overflowY="scroll";

  }
  else{
    document.getElementsByClassName("main__videos")[0].style.overflowY="hidden";
  }
}
function addVideoStream(video, stream) {
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  
  videoGrid.append(video)
  usersCount=document.getElementById("video-grid").childElementCount;
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

}