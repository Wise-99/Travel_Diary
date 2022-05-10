var express = require('express'); // 웹 서버 프레임워크
var app = express();
var bodyParser = require('body-parser'); //post로 요청된 body를 쉽게 추출할 수 있는 모듈
const mysql = require('mysql'); // DB에 연결하기 위한 미들웨어
const path = require('path'); // 파일 경로를 가져오기 위한 모듈
const session = require('express-session'); // 세션을 사용하기 위한 미들웨어
const FileStore = require('session-file-store')(session); // 세션을 파일에 저장
const multer = require('multer'); // 이미지 저장 시 사용하는 미들웨어

app.use(bodyParser.urlencoded({ extended: false })); // 중첩된 객체 표현 X
app.use(express.json());

app.use(express.static(path.join(__dirname,'/public')));

app.set('views', __dirname + '/views'); // 기본적으로 사용할 파일 설정
app.set('view engine', 'ejs'); // 뷰엔진으로 ejs를 사용

const client = mysql.createConnection({ // DB 연결
    user : 'nodejs',
    password : 'yer2110kek^^',
    database : 'Travel_Diary',
    dateStrings: 'date'
});

var storage = multer.diskStorage({ // 이미지 파일 저장을 위한 모듈
    destination: function (req, file, cb) {
      cb(null, "public/images/");
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, path.basename(file.originalname, ext) + "-" + Date.now() + ext);
    },
});
  
var upload = multer({ storage: storage }); // 여러 이미지를 한번에 저장

app.use(session({ // 세션 설정
    secret: 'keyboard cat', // 데이터를 암호화 하기 위해 필요한 옵션
    resave: false, // 요청이 왔을때 세션을 수정하지 않더라도 다시 저장소에 저장되도록
    saveUninitialized: true, // 세션이 필요하면 세션을 실행시칸다(서버에 부담을 줄이기 위해)
    store : new FileStore() // 세션이 데이터를 저장하는 곳
}));

app.get('/', function (req, res) { // 메인 화면
    if(req.session.is_logined == true){ // 세션이 존재한다면
        id = req.session.id;
        client.query('SELECT id FROM users where session_id=?', [id], function(err, result){
            client.query('SELECT DISTINCT area FROM posts WHERE id = ?',[result[0].id], function(err, gauge){
                if(err) console.log('query is not excuted. select fail...\n' + err);
                else{
                    client.query('SELECT * FROM posts where id=?', [result[0].id], function(err, rows){
                        if(err) console.log('query is not excuted. select fail...\n' + err);
                        else res.render('loginIndex', {rows : rows, gauge : gauge}); // 사용자가 저장한 일기의 지역과 갯수를 가지고 이동
                    });
                }
            });
        });
    }else{
        res.render('Index',{ // 세션이 없다면 일반 메인페이지로 이동
            is_logined : false // 세션 존재 false
        });
    }
});

app.get('/Information', function (req, res) { // 사이트 소개 페이지
    res.render('Information');
});

app.get('/Top10Page', function (req, res) { // Top10 페이지
    if(req.session.is_logined == true){ // 세션이 존재한다면
        client.query('SELECT area, COUNT(*) as "count" FROM posts GROUP BY area ORDER BY count DESC, area ASC limit 10;',function(err, results){
            if(err) console.log('query is not excuted. select fail...\n' + err);
            else
                res.render('Top10Page', {results : results}); // DB에서 지역과 저장된 일기 수를 넘겨준다
        });
            
    }else{ // 세션이 없다면
        res.send("<script>alert('로그인 후 이용해주세요.'); location.href='/';</script>");
    }
});

app.get('/Top10PageArea', function(req, res){ // Top10 상세 페이지
    client.query('SELECT * FROM posts WHERE area = ? AND private is null', [req.query.area], function(err, rows){
        if(err) console.log('query is not excuted. select fail...\n' + err);
        else
            res.render('Top10PageArea', {rows : rows}); // 사용자가 선택한 지역의 공개된 일기의 정보들을 넘겨준다.
    });
});

app.get('/DiaryWrite', function (req, res) { // 일기 작성 페이지
    if(req.session.is_logined == true){ // 세션이 있다면
        res.render('DiaryWrite'); // 바로 연결
    }else{ // 세션이 없다면
        res.send("<script>alert('로그인 후 이용해주세요.'); location.href='/';</script>");
    }
});

app.get('/Login', function (req, res) { // 로그인 페이지로 이동
    res.render('Login');
});

app.get('/join.ejs', function (req, res) { // 회원 가입 페이지
    res.render('join');
});

app.post('/joining', function (req, res) { // 회원 가입 시 모든 정보 입력 후 회원 가입 버튼을 눌렀을 경우
    const body = req.body;
    const id = body.id;
    const password = body.password2;
    const name = body.name;
    const birth = body.birth;

    client.query('select * from users where id=?',[id],(err,data)=>{
        if(data.length == 0){ // 중복되는 아이디가 없다면
            res.send("<script>alert('회원 가입에 성공하였습니다. 가입한 아이디로 로그인해주세요.'); location.href='/';</script>");
            client.query('insert into users(id, password, name, birth, session_id) values(?,?,?,?,?)',[
                id, password, name, birth, null // DB에 저장되는 정보들
            ]);
        }else{ // 중복되는 아이디가 존재할 때
            res.send("<script>alert('회원가입 실패, 중복된 아이디입니다.');location.href='join';</script>");
        }
    });
});

app.post('/login',(req,res)=>{ // 로그인 페이지에서 post 요청이 왔을 때
    const body = req.body;
    const id = body.id;
    const pw = body.password;

    client.query('select * from users where id=?',[id],(err,data)=>{
        // 로그인 확인
        if(id == data[0].id && pw == data[0].password){
            console.log(data[0].id);
            console.log(id);
            console.log(data[0].password);
            console.log(pw);
            // 세션에 추가
            req.session.is_logined = true;
            req.session.name = data.name;
            req.session.id = data.id;

            req.session.save(function(){ // 세션 스토어에 적용하는 작업
                client.query('SELECT DISTINCT area FROM posts WHERE id = ?',[id], function(err, gauge){ // 일기를 저장한 지역의 갯수(중복제외)
                    if(err) console.log('query is not excuted. select fail...\n' + err);
                    else{
                        client.query('SELECT * FROM posts where id=?', [id], function(err, rows){ // 로그인한 사용자가 작성한 일기
                            if(err) console.log('query is not excuted. select fail...\n' + err);
                            else res.render('loginIndex', {rows : rows, gauge : gauge}); // 위의 정보들을 넘겨준다
                        });
                    }
                });
            });
            client.query('update users set session_id=? WHERE id=?',[req.session.id, id]); // User 정보에 암호화된 세션 ID를 변경
        }else{
            // 로그인에 실패했을 경우
            res.send("<script>alert('로그인에 실패하였습니다. 아이디와 비밀번호를 확인해주세요.'); location.href='login';</script>");
        }
    });
});

app.get('/logout',(req,res)=>{ // 로그아웃 시
    req.session.destroy(function(err){ // 세션 정보 삭제
        res.redirect('/'); // 메인페이지로 이동
    });
});

const fileFields = upload.fields([ // 여러 개의 이미지를 한번에 저장하기 위해 설정
    { name: 'front_image', maxCount: 1 },
    { name: 'image', maxCount: 5 },
]);

app.post('/writeAf', fileFields, (req, res)=> { // 일기 작성 후 일기 저장 버튼을 눌렀을 경우
    const body = req.body;
    const id = req.session.id;
    const private = body.private;
    const weather = body.weather;
    const date = body.date;
    const content = body.content;
    const area = body.area;
    const tag = body.tag;
    var image = null;
    try{ // 대표 사진의 경로 저장
        image = '/images/' + req.files['front_image'][0].filename;
    }catch(error){
        image = null;
    }

    let urlArr = new Array(); // 여러 이미지의 경로를 저장하기 위해 배열 생성
    try{
        for (let i = 0; i < req.files['image'].length; i++) { 
            urlArr.push(`/images/${req.files['image'][i].filename}`);
        }
    }catch(error){
        for (let i = 0; i < 3; i++) { 
            urlArr.push(`null`);
        }
    }

    client.query('SELECT id FROM users where session_id=?', [id], function(err, result){ // DB - user 테이블에 있는 세션 정보를 통해 아이디 유추
        client.query('insert into posts(id, private, date, weather, area, content, tag , img) values(?,?,?,?,?,?,?,?)',[
            result[0].id, private, date, weather, area, content, tag, image
        ]);
        client.query('insert into images(id, date, area, content, tag, img1, img2, img3, img4) values(?,?,?,?,?,?,?,?,?)',[
            result[0].id, date, area, content, tag, urlArr[0],urlArr[1],urlArr[2],urlArr[3],urlArr[4]
        ]);
    });
    res.send("<script>alert('성공적으로 글이 저장 되었습니다.'); location.href='DiaryList';</script>"); // 일기와 이미지 저장
});

app.get('/DiaryList', function (req, res) { // 일기 목록 페이지
    if(req.session.is_logined == true){ // 세션이 존재한다면
        const id = req.session.id;
        client.query('SELECT id FROM users where session_id=?', [id], function(err, result){ // DB - user 테이블에 있는 세션 정보를 통해 아이디 유추
            client.query('SELECT * FROM posts where id=? order by date ASC, area ASC;', [result[0].id], function(err, rows){
                if(err) console.log('query is not excuted. select fail...\n' + err);
                else {
                    client.query('SELECT * FROM images where id=? order by date ASC, area ASC;', [result[0].id], function(err, imgs){
                        res.render('DiaryList', {rows : rows, imgs : imgs}); // 일기 내용과 이미지 정보를 전달
                    });
                }
            });
        });
    }else{ // 세션이 존재하지 않는다면
        res.send("<script>alert('로그인 후 이용해주세요.'); location.href='/';</script>");
    }
});

app.get('/DiaryDelete', (req, res)=> { // 일기 삭제
    client.query('DELETE FROM posts WHERE id=? AND date=? AND weather=? AND area =? AND content=? AND tag=?;', // 일기 삭제
    [req.query._id, req.query.date, req.query.weather, req.query.area, req.query.content, req.query.tag],
    function(err, rows){
        if(err) console.log('query is not excuted. select fail...\n' + err);
        else{
            client.query('DELETE FROM images WHERE id=? AND date=? AND area =? AND content=? AND tag=?', // 이미지 삭제
            [req.query._id,req.query.date, req.query.area, req.query.content, req.query.tag], 
            function(err, rows){
                if(err) console.log('query is not excuted. select fail...\n' + err);
                res.send("<script>alert('성공적으로 삭제되었습니다.'); location.href='/DiaryList';</script>");
            });
        }
    });
});

app.get('/DiaryAllDelete', (req, res)=> { // 일기 전체 삭제
    const id = req.session.id;
    client.query('SELECT id FROM users where session_id=?', [id], function(err, result){
        client.query('DELETE FROM posts WHERE id=?', [result[0].id], function(err, rows){
            client.query('DELETE FROM images WHERE id=?', [result[0].id], function(err, rows){
                if(err) console.log('query is not excuted. select fail...\n' + err);
                res.send("<script>alert('성공적으로 전체 삭제되었습니다.'); location.href='/DiaryList';</script>");
            });
        });
    });
});

app.listen(3000, () => console.log('Server is running on port 3000...'));