const express = require("express");
const MongoClient = require("mongodb").MongoClient;
const app = express();
const port = process.env.PORT || 8080;
app.set("view engine","ejs");
app.use(express.urlencoded({extended: true}));
app.use(express.static('public'));

MongoClient.connect("mongodb+srv://admin:qwer1234@port2.ackae9r.mongodb.net/?retryWrites=true&w=majority",function(err,result){
    //에러가 발생했을경우 메세지 출력(선택사항)
    if(err) { return console.log(err); }

    //위에서 만든 db변수에 최종연결 ()안에는 mongodb atlas 사이트에서 생성한 데이터베이스 이름
    db = result.db("port2");

    //db연결이 제대로 됬다면 서버실행
    app.listen(port,function(){
        console.log("서버연결 성공");
    });

});

//게시판 화면 get 요청
app.get("/boardtest",async (req,res)=>{
    // query string으로 보내준 데이터값 받는 방법
    // req.query.작명한이름
    // 웹 페이지에서 http://localhost:8080/boardtest?page=100 이라고 쓰면 page에 보내준 데이터값(100)이 전달된다. 
    // console.log(req.query.page);
    
    // 사용자가 게시판에 접속시 몇번 페이징 번호로 접속했는지 체크
    // req.query.page에 들어가있는 값이 없다면, 1을 넣어주고 / 들어가있는 값이 있다면 그 값을 숫자로 넣어준다.
    let pageNumber = (req.query.page == null) ? 1 : Number(req.query.page);
    // console.log(pageNumber);

    // 한 페이지당 보여줄 데이터 갯수
    let perPage = 2;
    // 한 블록당 보여줄 페이징 갯수
    let blockCount = 3;
    // 현재 페이지 블록 구하기 (나머지 올림 처리(사용자가 접속한 페이징 번호 / 한 블록당 보여줄 페이징 갯수))
    // Math.ceil 올림 처리하는 명령어
    let blockNum = Math.ceil(pageNumber / blockCount);
    // 블록 안에 있는 페이징의 시작번호 값을 알아내기 (((현재 페이지 블록 - 1) * 한 블록당 보여줄 페이징 갯수) + 1;)
    let blockStart = ((blockNum - 1) * blockCount) + 1;
    // 블록 안에 있는 페이징의 끝번호 값을 알아내기 (블록 안에 있는 페이징의 시작번호 값 + 한 블록당 보여줄 페이징 갯수 - 1)
    let blockEnd = blockStart + blockCount - 1;
   
    // db의 collection에있는 전체 객체의 갯수값(전체 페이징의 갯수 값) 가져오기
    // 공식 홈페이지 참고 https://www.mongodb.com/docs/manual/core/databases-and-collections/
    let totalData = await db.collection("board").countDocuments({});
    // 전체 데이터값을 통해서 → 몇개의 페이징 번호가 만들어져야하는가 계산
    // (나머지 올림 처리 (db의 collection에있는 전체 객체의 갯수값 / 한 페이지당 보여줄 데이터 갯수))
    let paging = Math.ceil(totalData / perPage);

    // 만약 블록 안에있는 페이징의 끝 번호값이 전체 페이징 갯수보다 많다면 강제로 마지막 페이징 번호를 부여해준다.
    // 블록에서 마지막 번호가 페이징의 끝번호 보다 크다면, 페이징의 끝번호를 강제로 부여
    if (blockEnd > paging) {
        blockEnd = paging; 
    }

    // 블록의 총 갯수 구하기 (페이징 총 갯수 / 한 블록당 보여줄 페이징 갯수)
    let totalBlock = Math.ceil(paging / blockCount);

    // db에서 꺼내오는 데이터의 시작 순번값 결정
    // 몇번 페이지를 보고 있느냐에 따라 보여지는 데이터의 시작 순번값이 달라진다.
    // ex. 1페이지   →   1,2번 게시글 / 2페이지   →  3,4번 게시글
    // ((사용자가 게시판에서 접속한 페이징 번호 - 1) * 한 페이지당 보여줄 데이터 갯수)
    let startFrom = (pageNumber - 1) * perPage;

    
    // db의 실제 값을 꺼내올 때 몇개씩 가져올건지 설정 sort() skip() limit()
    // db의 collection에서 데이터값을 두개씩 순번에 맞춰서 가져오기
    // sort({정렬할프로퍼티명})
    // 데이터를 가져와서 정렬할때 쓰는 함수
    // sort({number:-1}) → (역순, 내림차순으로 가져올때)
    // sort({number:1}) → (정방향, 오름차순으로 가져올때)
    // skip 앞에 나온 데이터의 갯수를 무시하고 그 다음 데이터부터 가져온다.
    // limit 출력할 데이터의 갯수

    db.collection("board").find({}).sort({number:-1}).skip(startFrom).limit(perPage).toArray((err,result) => {
        // board.ejs에 전달해줘야 할 데이터들
        // 1. board 컬렉션에서 가지고 온 데이터값   →   result
        // 2. 페이징 번호의 총 갯수 값   →   paging
        // 3. 현재 페이지에서 몇번째 페이징을 보고있는지 번호값    →    pageNumber
        // 4. 블록 안에 있는 페이징의 시작번호 값   →   blockStart
        // 5. 블록 안에 있는 페이징의 끝번호 값    →    blockEnd
        // 6. 현재 보고있는 페이지의 블록   →   blockNum
        // 7. 블록 총 갯수    →    totalBlock
        res.render("board",{
            prdData:result,
            paging:paging,
            pageNumber:pageNumber,
            blockStart:blockStart,
            blockEnd:blockEnd,
            blockNum:blockNum,
            totalBlock:totalBlock
        });
    });
});

// 응용!
// 검색 기능이 있을 때, 조건문을 이용해서 입력한 검색어가 있는 경우는
// aggregate({}).sort().skip().limit()을 이용해 페이징 기능을 부여해준다.