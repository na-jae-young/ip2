var http = require('http');
var url = require('url');
var qs= require('querystring');


var app = http.createServer(function(request,response){
    var _url = request.url;
    var queryData = url.parse(_url,true).query;
    var pathname = url.parse(_url,true).pathname;

    var mysql = require('mysql');  // mysql 모듈 사용 
    var db1 = mysql.createConnection({   //mysql 접속속성
        host     : 'localhost',
        user     : 'nah0101',
        password : 'cjdruf0984~',
        database : 'log'
    })
    db1.connect();   //mysql 접속

    if(pathname === '/'){
        console.log(queryData.id)
        if(queryData.id === undefined){

            let HTML = 
            `<!doctype html><html>
                <head>
                    <title>ip</title>
                    <meta charset="utf-8">
                    <link rel="stylesheet" type="text/css" href="./css.css">
                </head>
                <body>
                    <h1 id='title'><a href = "/">IP</a></h1>
                    <form action= '/process' method='post'>
                        <select name='type' >
                            <option selected value='보안'>보안</option>
                            <option value='응용'>응용</option>
                            <option value='MSSQL'>MSSQL</option>
                        </select>
                        <input type = 'text' name='table' placeholder = 'table명'></input>
                        <input type='submit' value='조회'></input>
                    </form>
                </body>
            </html>`
            response.writeHead(200);
            response.end(HTML)

        }
        else{

            var _url = request.url; // url 반환 /?id=html
            var queryData = url.parse(_url, true).query;

            db1.query(`select * from (select ip, count(ip) as cnt from ${queryData.id} group by ip) as a where a.cnt>10`,function(er,result_ip){
                if(er){
                    throw er
                }
                let i = 0
                let ip_list = `${queryData.id}  10회 이상 접속 실패 ip`
                while (i < result_ip.length){
                    ip_list = ip_list + "<br>" + result_ip[i].ip
                    i= i+1
                }
                let HTML =            
                `<!doctype html><html>
                    <head>
                        <title>ip</title>
                        <meta charset="utf-8">
                        <link rel="stylesheet" type="text/css" href="./css.css">
                    </head>
                    <body>
                        <h1 id='title'><a href = "/">IP</a></h1>
                        <form action= '/process' method='post'>
                            <select name='type' >
                                <option selected value='보안'>보안</option>
                                <option value='응용'>응용</option>
                                <option value='MSSQL'>MSSQL</option>
                            </select>
                            <input type = 'text' name='table' placeholder = 'table명'></input>
                            <input type='submit' value='조회'></input>
                        </form>

                        <p>${ip_list}</p>
                    </body>
                </html>`
                response.writeHead(200)
                response.end(HTML)

            }) 

        
        }
           

    }    else if(pathname === "/process"){
        console.log('process')
        var body = ''
        request.on('data',function(data){
            body += data;})

        request.on('end',function(){
            var post = qs.parse(body)
            var table = post.table
            var type = post.type
            console.log( table,type)

            // 테이블 확인 
            db1.query(`select count(*) cnt from information_schema.tables where table_schema = 'log' and table_name = '${table}' `,function(ee,result8){
                if(ee){
                    throw ee
                }
                console.log(result8[0].cnt)
                if(result8[0].cnt === 1){  // 테이블 존재할경우 
                    db1.query(`create table ${table+'_IP'} (ip varchar(20))`)
                    db1.query(`alter table ${table} add ip varchar(30) null`)
                    db1.query(`ALTER TABLE ${table} ADD COLUMN id INT AUTO_INCREMENT UNIQUE FIRST`)
                    console.log('테이블생성')
                    //NEW 테이블 생성
                    if( type === '응용'){
                        let qr = `SELECT id, MyUnknownColumn FROM ${table} where MyUnknownColumn like '%로그인하지%'`;
                        db1.query(qr,function(err1,result){
                            if(err1){
                                console.log('here')
                                throw err1
                            }
                            console.log('here')
                            let o = result[0].MyUnknownColumn.substring(-2,-16)
        
                            console.log(o)
                            console.log(result.length)
                            let i = 0;
                            while( i < result.length){
                                let str = result[i].MyUnknownColumn
                                const id = result[i].id
                                let ip = str.slice(-16,-1)
                                
                                let j =0
                                while(j < 5){
                                    if(!isNaN(ip[j])){
                                        ip = ip.substr(j)
                                        
                                        break
                                    }
                                    j=j+1
                                }
                                db1.query(`update ${table} set ip = ? where id = ${id} `,[ip],function(er1,result4){
                                    if(er1){
                                        throw er1
                                    }
                                })
                                db1.query(`insert into ${table+'_ip'} values(?)`,[ip],function(err2,result2){
                                    if(err2){
                                        throw err2
                                    }
                                })
                                i= i+1
                            } 
                            console.log('end',result.length)
                            response.writeHead(302 , {location: encodeURI(`/?id=${table}`)})
                            response.end();
                        })
                    }else if (type ==='보안'){
                        console.log('보안')
                        // 컬럼 명 다를 경우 컬럼명 변경 
                        db1.query(`select count(*) cnt from information_schema.columns where table_schema = 'log' and table_name = '${table}' and column_name = 'MyUnknownColumn' `,function(er4,result7){
                            if(er4){
                                throw er4
                            }
                            console.log(result7[0].cnt)
                            if(result7[0].cnt === 1){
                                db1.query(`alter table ${table} CHANGE MyUnknownColumn 정보 text `,function(errr,resultt){
                                    if(errr){
                                        console.log('eeee')
                                        throw errr
                                    }
        
                                })
                            }
                            let qr = `SELECT id ,정보 FROM ${table} where 정보 like '%로그온하지%'`
                            db1.query(qr,function(err1,result){        //로그인실패 데이터 갖어옴
                                if(err1){
                                    throw err1
                                }
                                //
                                let i = 0 
                                while(i < result.length){                                 //ip 뽑아냄 
                                    const str_list = result[i].정보.split(':')
                                    let ip = str_list[20].slice(1,-7)
                                    const id = result[i].id
                                    db1.query(`update ${table} set ip = ? where id = ${id} `,[ip],function(er2,result5){      //기존 테이블에 추가 
                                        if(er2){
                                            throw er2
                                        }
                                    })
                                    db1.query(`insert into ${table+'_ip'} values(?)`,[ip],function(err3,result3){        //새로운 테이블에 추가 
                                        if(err3){
                                            throw err3
                                        }
                                    })
                                    i= i +1 
                                }
                                console.log('end',result.length)
                                response.writeHead(302 , {location: encodeURI(`/?id=${table}`)})
                                response.end();
                            })
                        })
                    }else if(type ==='MSSQL'){
                        let qr = `SELECT id, 메시지 FROM ${table} where 메시지 like '%failed%'`;
                        db1.query(qr,function(err1,res){
                            if(err1){
                                throw err1
                            }
                            let i = 0;
                            while( i < res.length){
                                let str = res[i].메시지
                                let ip = str.slice(-16,-1)
                                let id = res[i].id
                                let j =0
                                while(j < 5){
                                    if(!isNaN(ip[j])){
                                        ip = ip.substr(j)
                                        break
                                    }
                                    j=j+1
                                }
                                db1.query(`update ${table} set ip = ? where id = ${id} `,[ip],function(er3,result6){
                                    if(er3){
                                        throw er3
                                    }
                                })
                                db1.query(`insert into ${table+'_ip'} values(?)`,[ip],function(err2,result2){
                                    if(err2){
                                        throw err2
                                    }
                                })
                                i= i+1
                            } 
                            console.log('end',res.length)
                            response.writeHead(302 , {location: encodeURI(`/?id=${table}`)})
                            response.end();
                        })
                    }
                }
                //테이블이 존재하지 않을 경우 

                else{
                    console.log('존재하지 않는 테이블입니다.')
                    response.writeHead(302,{location:`/`})
                    response.end()
                }
            })
            })
    }




}


)
app.listen(3001)