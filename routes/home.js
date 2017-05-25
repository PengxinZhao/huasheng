var express = require('express');
var router = express.Router();
var formidable = require('formidable');
var PrivateInfoModel = require('../model/PrivateInfoModel');
var Users = require('../model/UserModel');
var Msg = require('../model/MsgModel');
var ShopModel = require('../model/ShopModel');
var GoodsModel = require('../model/GoodsModel');
var sequelize = require('../model/ModelHeader')();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.locals.loginbean = req.session.loginbean;
  if(loginbean.role>0){
      cpage = 1;
      if(req.query.cpage){
        cpage = req.query.cpage;

      }
      pageItem = 3;
      startPoint = (cpage-1)*pageItem;
      rowCount=0;
      sumPage=0;
      //----------查询消息列表-------------------
      sqlCount = 'select count(*) as count from msgs where toid=?';
      sequelize.query(sqlCount,{replacements:[loginbean.id],type:sequelize.QueryTypes.QUERY}).then(function(rs){
      rsjson = JSON.parse(JSON.stringify(rs[0]));
      rowCount = rsjson[0].count;
      sumPage=Math.ceil(rowCount/pageItem);
      sql = 'select m.*,u.nicheng  from msgs m,users u where m.toid=? and m.sendid=u.id limit ?,?';
      sequelize.query(sql,{replacements:[loginbean.id,startPoint,pageItem],type:sequelize.QueryTypes.QUERY}).then(function(rs){
      res.render('home/home',{rs:rs[0]});
      });
    })
  }else{
    res.send('<script>alert("你无权访问此页面");location.href="/";</script>');
  }
  
});

router.post('/privateAuth', function(req, res, next) {
	var form = new formidable.IncomingForm();   //创建上传表单 
    form.encoding = 'utf-8';        //设置编辑 
    form.uploadDir = './public/images/privateauth/';     //设置上传目录 文件会自动保存在这里 
    form.keepExtensions = true;     //保留后缀 
    form.maxFieldsSize = 5 * 1024 * 1024 ;   //文件大小5M 
    form.parse(req, function (err, fields, files) { 
        if(err){ 
            console.log(err); 
            return;
        } 
    
    //-----------入库------------
       loginbean = req.session.loginbean;
       fields.id = loginbean.id;
       fields.idphoto=files.idphoto.path.replace('public','');
       fields.userphoto=files.userphoto.path.replace('public','');
       fields.updtime=new Date();
       //------------启动事物----------------------------------
       sequelize.transaction().then(function (t) {
           return PrivateInfoModel.create(fields).then(function(rs){
            //------修改User表中的role为2------
            return Users.update({role:2},{where:{'id':loginbean.id}}).then(function(rs){
              //console.log(rs);
              loginbean.role=2;
              req.session.loginbean=loginbean;
              res.send('身份认证已提交,请耐心等待审核');
            });
          }).then(t.commit.bind(t)).catch(function(err){
            t.rollback.bind(t);
            console.log(err);
            if(err.errors[0].path=='PRIMARY'){
              res.send('你已经申请过');
            }else if(err.errors[0].path=='idcodeuniq')
            {
              res.send('身份证号已用过');
            }else if(err.errors[0].path=='prphoneuniq'){
              res.send('电话号码已用过');
            }else if(err.errors[0].path=='premailuniq'){
              res.send('此email已用过');
            }else{
              res.send('数据库错误,稍后再试');
            }
          })
          
        });
   })   //-----------------结束事物--------------------------------------  

})
router.get('/pubShop', function(req, res, next) {
  sql = 'select id,typename from shoptypes';
  sequelize.query(sql).then(function(rs){
    res.render('home/pubShop', {shoptypeRs:rs[0]});
  });
})

router.post('/pubShop', function(req, res, next) {
  var form = new formidable.IncomingForm();   //创建上传表单 
    form.encoding = 'utf-8';        //设置编辑 
    form.uploadDir = './public/images/shop/';     //设置上传目录 文件会自动保存在这里 
    form.keepExtensions = true;     //保留后缀 
    form.maxFieldsSize = 5 * 1024 * 1024 ;   //文件大小5M 
    form.parse(req, function (err, fields, files) { 
        if(err){ 
            console.log(err); 
            return;
        } 
       //res.send('rname='+fields.realname);
       //-----------入库------------
       loginbean = req.session.loginbean;
       fields.uid = loginbean.id;
       fields.photourl=files.photourl.path.replace('public','');
       //------------启动事物----------------------------------
       sequelize.transaction().then(function (t) {
           return ShopModel.create(fields).then(function(rs){
            //------修改User表中的role为2------
            return Users.update({role:4},{where:{'id':loginbean.id}}).then(function(rs){
              //console.log(rs);
              loginbean.role=4;
              req.session.loginbean=loginbean;
              res.redirect('./shopmanage');
            });
          }).then(t.commit.bind(t)).catch(function(err){
            t.rollback.bind(t);
            console.log(err);
            res.send('店铺发布失败，请重新发布');
          })
          
        });
      //-----------------结束事物---------------------------------------
    })
})

router.get('/deletemsgs', function(req, res, next) {
  loginbean = req.session.loginbean;
  res.locals.loginbean = req.session.loginbean;
      id = req.query.id;
      ids = req.query.id;
      sql = 'delete from msgs where id=?';

      sequelize.query(sql,{replacements:[id]}).then(function(rs){
        sequelize.query(sql,{replacements:[ids]}).then(function(rs){
        sqlupd = 'update users set msgnum=msgnum-1 where id=?';
      res.redirect('/home');
    })
 })
})
router.get('/shopmanage', function(req, res, next) {
  //------------判定权限--------------
  loginbean = req.session.loginbean;
  if(loginbean.role==4){
  //----------查询出商铺位置信息-----------
    sql = 'select id,shopname,lng,lat from shops where uid=?';
    sequelize.query(sql,{replacements:[loginbean.id]}).then(function(shopRs){
    //-------------用商铺信息渲染地图-------------
      sql = 'select id,typename from shoptypes';
      sequelize.query(sql).then(function(shoptypeRs){
      //------------查询店铺中的商品列表------------
      page=1;
      if (req.query.page){
        page=req.query.page;
      }
      pageSize=2;
      GoodsModel.count({where:{uid:loginbean.id}}).then(function(countRS){
        GoodsModel.findAll({where:{uid:loginbean.id},offset:(page-1)*pageSize,limit:pageSize}).then(function(goodsRs){
          res.render('home/shopmanage',{shoptypeRs:shoptypeRs[0],shopRs:shopRs[0],goodsRs : goodsRs});
        });

      });//-----------GoodsModel.count----------
      
    });//----------sequelize.query(sql)---------
  })
  }else{
    res.send("你还没有发布营业点");
  }
})

router.post('/pubgoods', function(req, res, next) {
  var form = new formidable.IncomingForm();   //创建上传表单 
    form.encoding = 'utf-8';        //设置编辑 
    form.uploadDir = './public/images/goods/';     //设置上传目录 文件会自动保存在这里 
    form.keepExtensions = true;     //保留后缀 
    form.maxFieldsSize = 5 * 1024 * 1024 ;   //文件大小5M 
    form.parse(req, function (err, fields, files) { 
        if(err){ 
            console.log(err); 
            return;
        } 
    
    //-----------入库------------
       loginbean = req.session.loginbean;
       fields.id = loginbean.id;
       fields.goodsimg=files.goodsimg.path.replace('public','');
       fields.goodsintro=files.editorValue;
       fields.createtime=new Date();
       //------------启动事物----------------------------------
       GoodsModel.create(fields).then(function(rs){
          console.log(rs);
          res.redirect('./shopmanage');
       }).catch(function(err){
          console.log(err);
          res.send('创建失败');
       })
       
   })   //-----------------结束事物--------------------------------------  

})

router.get('/getGoodsInfo', function(req, res, next) {
  //接参
  goodsid = req.query.id;
  GoodsModel.findOne({where:{id:goodsid}}).then(function(goodsInfo){
            res.send(goodsInfo);
  });
})
module.exports = router;
