var http = require('http');
var fs = require('fs');
var url = require('url');

var app = http.createServer(function(request,response){
    var _url = request.url;
    var queryData = url.parse(_url, true).query;
    var pathname = url.parse(_url, true).pathname;

    if(pathname === '/'){
        if(queryData.id === undefined){
            fs.readFile(`Index.html`, 'utf8', function(err, description){
                    var template= `${description}
                        <div id="map" style="position: fixed; left: 350px; top: 100px; width:1000px; height:700px;"></div>
                        <script type="text/javascript" src="//dapi.kakao.com/v2/maps/sdk.js?appkey=9391fe5e1e7e6d6c52d4953932517012"></script>
                        <script>
                            var container = document.getElementById('map');
                            var options = {
                                center: new kakao.maps.LatLng(35.831700, 127.124386),
                                level: 13
                            };
                            var map = new kakao.maps.Map(container, options);
                        </script>
                        <div style="position:fixed; right: 10px; bottom:10px;">
                            <a href = "/?id=DiaryWrite.html"><img src="https://cdn-icons-png.flaticon.com/512/3075/3075818.png" width = "80px" height= "80px"></a>
                        </div>
                    </body>
                    </html>
                    `;
            response.writeHead(200);
            response.end(template);
            });
        } else{
            fs.readFile(`Index.html`, 'utf8', function(err, description){
                var template= `${description}`;
                fs.readFile(`${queryData.id}`, 'utf-8', function(err, description){
                    template += `${description}`;
                    response.writeHead(200);
                    response.end(template);
                });
            });
        }
    }
});
app.listen(3000);