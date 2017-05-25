var express = require('express');
var router = express.Router();

/*GET home page. */
router.get('/goods',function(res,req,next){
	//res.locals.loginbean=req.session.loginbean;
	keywords = req.query.keywords;
	kwArr = keywords.split(' ');
	len = kwArr.length;
	keyword = '';
	for(i=0;i<len;i++){
		if(kwArr[i]!=''){
			keyword += keyArr[i]+'|';

		}
	}

});

module.exports = router;