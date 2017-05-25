var express = require('express');
var router = express.Router();
var sequelize = require('../model/ModelHeader')();

/* GET home page. */
router.post('/sendnew', function(req, res, next) {
  loginbean = req.session.loginbean;
  res.locals.loginbean = loginbean;
  //接参
  nicheng = req.body.nicheng;
  arr = nicheng.split(';');
  len = arr.length;
  sql = 'select id from users where nicheng=?';
  sqlmsg = 'insert into msgs set sendid=?,toid=?,message=?';
  sqlupd = 'update users set msgnum=msgnum+1 where id=?';
  flag=0;
  var exec=function(i){
  	toids={}
  	return function(){
  		sequelize.query(sql,{replacements:[arr[i]]}).then(function(rs){
	  	rsjson = JSON.parse(JSON.stringify(rs[0]));//rowdatapacke转json
	  	if(rsjson.length==0){
	  		flag++;
	  		return;
	  	}
	  	toids[i] = rsjson[0].id;
	  	//然后插入信息表
	  	sequelize.query(sqlmsg,{replacements:[loginbean.id,toids[i],req.body.message]}).then(function(rs){
	  		sequelize.query(sqlupd,{replacements:[toids[i]]}).then(function(rs){
	  			flag++;
	  			if(flag==len){
	  				res.send('1');
	  			}
	  			
	  		})
	  	})
	  	
	  });
  	}
  }
 
  for(i=0;i<len;i++){
	  	fun=exec(i);
	  	fun();

  }
  
});

module.exports = router;