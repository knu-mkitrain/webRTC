# webRTC
webRTC for broadcasting with signaling server
구현 해야할 기능
1. 메세지 전송
+ 기능으로 인한 부가적인 기능
로그인(첫 입장 화면)
같은 룸안에 있는 사람들만 통신 룸 별로 user 관리
새로운 유저 입장시 방에 메세지 전송 broadcast.emit(자기를 제외한 모두에게 전송)


2. 첫 입장 화면 
+ user id 입력 => caster 일지 viewer 일지 정함  
if(caster)=> 방생성 
if(viewer)=> 방선택
