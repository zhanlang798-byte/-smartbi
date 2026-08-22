/*=======================================
@CopyRight VFA 视一广告
@Author    VFA Tech Team
@Version   v1.3
=======================================*/
 
function getUrlParam(name){    //获取浏览器url参数  例如 uid=ab ，获取方式getUrlParam("uid") 获取结果 ab
	var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");  
	var r = window.location.search.substr(1).match(reg);  
	if (r!=null) return unescape(r[2]);
	 return null;
} 


function trackEvent(category,action,label) { //跟踪事件
	//_hmt.push(['_trackEvent', category, action,label]);
	//ga('send', 'event', category,action, label);
}

function _initArray(){
		if (!Array.prototype.indexOf)
		{
		  Array.prototype.indexOf = function(elt /*, from*/)
		  {
			var len = this.length >>> 0;
		
			var from = Number(arguments[1]) || 0;
			from = (from < 0)
				 ? Math.ceil(from)
				 : Math.floor(from);
			if (from < 0)
			  from += len;
		
			for (; from < len; from++)
			{
			  if (from in this &&
				  this[from] === elt)
				return from;
			}
			return -1;
		  };
		}
	}
	
_initArray();


//=============================================================

function percent(obj,str){
	var objAttr = strToJson(str);
	if(objAttr.w){
		obj.css({"width":objAttr.w*b+"px"});
	}
	
	if(objAttr.h){
	    obj.css({"height":objAttr.h*b+"px"});
	}
	
	if(objAttr.f){
		obj.css({"font-size":objAttr.f*b+"px"});
	}
	
	if(objAttr.lh){
		obj.css({"line-height":objAttr.lh*b+"px"});
	}
	
	if(objAttr.blw){
		obj.css({"border-left-width":objAttr.blw*b+"px"});
	}
	if(objAttr.brw){
		obj.css({"border-right-width":objAttr.brw*b+"px"});
	}
	if(objAttr.btw){
		obj.css({"border-top-width":objAttr.btw*b+"px"});
	}
	if(objAttr.bbw){
		obj.css({"border-bottom-width":objAttr.bbw*b+"px"});
	}
	if(objAttr.t){
		obj.css({"top":objAttr.t*b+"px"});
	}
	if(objAttr.l){
		obj.css({"left":objAttr.l*b+"px"});
	}
	if(objAttr.r){
		obj.css({"right":objAttr.r*b+"px"});
	}
	if(objAttr.b){
		obj.css({"bottom":objAttr.b*b+"px"});
	}
	if(objAttr.mt){
		obj.css({"margin-top":objAttr.mt*b+"px"});
	}
	if(objAttr.ml){
		obj.css({"margin-left":objAttr.ml*b+"px"});
	}
	if(objAttr.mb){
		obj.css({"margin-bottom":objAttr.mb*b+"px"});
	}
	if(objAttr.mr){
		obj.css({"margin-right":objAttr.mr*b+"px"});
	}
	if(objAttr.pt){
		obj.css({"padding-top":objAttr.pt*b+"px"});
	}
	if(objAttr.pl){
		obj.css({"padding-left":objAttr.pl*b+"px"});
	}
	if(objAttr.pb){
		obj.css({"padding-bottom":objAttr.pb*b+"px"});
	}
	if(objAttr.pr){
		obj.css({"padding-right":objAttr.pr*b+"px"});
	}
	
	if(objAttr.br){
		obj.css({"-moz-border-radius":objAttr.br*b+"px","-webkit-border-radius":objAttr.br*b+"px"});
		
	}
	
	if(objAttr.maxH){
		obj.css({"max-height":objAttr.maxH*b+"px"});
		
	}
	
};


function resizeElements(_obj){
	$(_obj).find('*[percent]').filter('[percent!=""]').each(function(index) {
		  percent($(this),$(this).attr('percent'));
		   percent($(_obj),$(_obj).attr('percent'));
	    });
}


function strToJson(str){
var json = eval('(' + str + ')');
return json;
}


//----------------- rollTool 滚动---------------------


//rollToolTransverse("#hpBox #box1 .hpItems","#hpBox #box1 .hpitem",4,230,"#hpBox #box1 .prevArrow","#hpBox #box1 .nextArrow",true,3000);
//rollToolTransverse("列表元素容器","元素","显示数量","单位移动间隔距离","上一个按钮","下一个按钮","是否自动滚动 true/false","单位移动间隔时间 毫秒")  横向

function rollToolTransverse(_content,_item,_showCount,_gapDist,_prevBtn,_nextBtn,_auto,_delay,_speed){  
	var _totalNum=$(_item).length;
	var _maxIndex=$(_item).length-_showCount;
	var _currentIndex=0;
	var _gapDist=_gapDist;
	var _timer;
	var _delay;
	var _speedNum=600;
	
	if(_delay==null){
		_delay=3000;
		}
	else{
		_delay=_delay;
		}
		
	
	if(_speed!=null){
		_speedNum=_speed;
		}

		
	
	
	$(_content).css({"width":_totalNum*_gapDist});
	
	$(_prevBtn).click(function(){	
			_prev();	
		});
	
	$(_nextBtn).click(function(){	
			_next();
		});
		
	function _prev(){
		if(_currentIndex>0){
			_currentIndex-=1;
			_moveContent();
			}else{
			_currentIndex=_totalNum-_showCount;
			_moveContent();
			}		
		}
		
	function _next(){
		if(_currentIndex<_totalNum-_showCount){
			_currentIndex+=1;
			_moveContent();
			}
		else{
			_currentIndex=0;
			_moveContent();
			}
				
		}
		
	function _moveContent(){
		  $(_content).stop().animate({"margin-left":-(_gapDist*_currentIndex)},{queue:false,duration:_speedNum});	
		}
		
	if(_auto){
		_timer=setInterval(_next,_delay);
		
		$(_prevBtn).hover(function(){
			clearInterval(_timer);
			},function(){
			_timer=setInterval(_next,_delay);
				
		});
		
		
		$(_nextBtn).hover(function(){
			clearInterval(_timer);
			},function(){
			_timer=setInterval(_next,_delay);
				
		});
		
		
		$(_item).hover(function(){
			clearInterval(_timer);
			},function(){
			_timer=setInterval(_next,_delay);
				
		});
		
		
		
		}	
		
	
	}
	
//rollToolVertical("#hpBox #box1 .hpItems","#hpBox #box1 .hpitem",4,230,"#hpBox #box1 .prevArrow","#hpBox #box1 .nextArrow",true,3000);
//rollToolVertical("列表元素容器","元素","显示数量","单位移动间隔距离","上一个按钮","下一个按钮","是否自动滚动 true/false","单位移动间隔时间 毫秒")  纵向

	
function rollToolVertical(_content,_item,_showCount,_gapDist,_prevBtn,_nextBtn,_auto,_delay,_speed){
	var _totalNum=$(_item).length;
	var _maxIndex=$(_item).length-_showCount;
	var _currentIndex=0;
	var _gapDist=_gapDist;
	var _timer;
	var _delay;
	var _speedNum=600;
	if(_delay==null){
		_delay=3000;
		}
	else{
		_delay=_delay;
		}
		
	if(_speed!=null){
		_speedNum=_speed;
		}

	
	
	$(_content).css({"height":_totalNum*_gapDist});
	
	$(_prevBtn).click(function(){		
		_prev();		
		});
	
	$(_nextBtn).click(function(){	
			_next();	
		});
		
	function _prev(){
			if(_currentIndex>0){
				_currentIndex-=1;
				_moveContent();
			}else{
				_currentIndex=_totalNum-_showCount;
				_moveContent();
			}		
		}
		
	function _next(){
			if(_currentIndex<_totalNum-_showCount){
				_currentIndex+=1;
				_moveContent();
				}
			else{
				_currentIndex=0;
				_moveContent();
				}
		}
	
		
	function _moveContent(){
		  $(_content).stop().animate({"margin-top":-(_gapDist*_currentIndex)},{queue:false,duration:_speedNum});	
		}
		
	if(_auto){
		_timer=setInterval(_next,_delay);	
		
		$(_prevBtn).hover(function(){
			clearInterval(_timer);
			},function(){
			_timer=setInterval(_next,_delay);
				
		});
		
		
		$(_nextBtn).hover(function(){
			clearInterval(_timer);
			},function(){
			_timer=setInterval(_next,_delay);
				
		});
		
		
		$(_item).hover(function(){
			clearInterval(_timer);
			},function(){
			_timer=setInterval(_next,_delay);
				
		});
		
		}	
		
	
	}


//======================== carousel 轮播图 =========================

	//carousel(".hp_banner2 a",".hp_banner2 .carouselIcons li",4000);
	//carousel("banner图片列表","序列按钮","轮播间隔时间 毫秒")


function carousel(_kv,_pointIcon,_delay){  
	var currentKvIndex=0;
	var oldKvIndex=0;
	var kvList;
	var _timer;
	var _delay=_delay;
	var _pointIcon;
	
	function autoPlayKv(){
		
		currentKvIndex+=1;
		if(currentKvIndex==kvList.length){
			currentKvIndex=0;
			}
		playKv();
		
	}
	
	function playKv(){
		
		if(oldKvIndex<currentKvIndex){		
				moveOutKv(oldKvIndex,true);	
			}else{
				moveOutKv(oldKvIndex,false);	
			}
				
			if(oldKvIndex<currentKvIndex){		
				moveInKv(currentKvIndex,true);
			}else{
				moveInKv(currentKvIndex,false);
			}
			
			setPointBtnStatus();												
		}
	
	
	
	function moveOutKv(kvIndex,next){
			
		$(kvList[kvIndex]).stop().animate({"opacity":0},{queue:false,duration:1000,complete:hideKv});
		}
		
	function moveInKv(kvIndex,next){
			$(kvList[kvIndex]).css({"display":"block"})
			$(kvList[kvIndex]).stop().animate({"opacity":1},{queue:false,duration:1000});
			oldKvIndex=currentKvIndex;
			
		}				
		
	function hideKv(){
		for(var i=0;i<kvList.length;i++){
			if($(kvList[i]).css("opacity")==0&&i!=currentKvIndex){
				$(kvList[i]).css({"display":"none"});
				}
			}
		}
		
	function setPointBtnStatus(){
		$(_pointIcon).removeClass("current");
		$($(_pointIcon)[currentKvIndex]).addClass("current");
		
		}	
		
		
	function resetKv(){
		kvList=$(_kv);
		_pointIcon=$(_pointIcon);
		
		$(_kv).css({"display":"none","opacity":0,"position":"absolute","top":0,"left":0})
		$(kvList[currentKvIndex]).css({"display":"block","opacity":1});
		
		if($(_kv).length>1){
			_timer=setInterval(autoPlayKv,_delay);
	
			
			$(_kv).hover(function(){
				
				clearInterval(_timer);
				}, function(){
					_timer=setInterval(autoPlayKv,_delay);
				});
			
			}
			
		$(_pointIcon).hover(function(){
			
			clearInterval(_timer);
			}, function(){
				_timer=setInterval(autoPlayKv,_delay);
			});
		
			
			
		$(_pointIcon).click(function(){
			currentKvIndex=$(_pointIcon).index(this);
			playKv();
			});
			
		setPointBtnStatus();
			
		}
		
	resetKv();
		
		
	}


//----------------- swtichTool -------------------

function swtichTool(_tab,_current,_content,_mouseEventType){
	var _contents=$(_content);
	var _index=0;
	
	$(_tab).bind(_mouseEventType,mouseEventHandle);
	function mouseEventHandle(){
		$(_tab).removeClass(_current);
		$(this).addClass(_current);		
		_index=$(_tab).index($(this));
		$(_content).css({"display":"none"});
		$($(_content)[_index]).css({"display":"block"});	
		}
	
	}



//====================轮播 淡出淡入   ============================


	//changeLb(".login_bgImg ul",".login_bgImg ul li",".login_bgImg .dot span",".login_bgImg .btn_left",".login_bgImg .btn_right",true)
		
	function changeLb(oContent,item,pointIcon,prevBtn,nextBtn,auto){
		var oDiv = $(".login_wrap");
		var wrapBg = $('.wrap_bg li');
        var oUl = $(oContent);
		var aLiImg = $(item);
		var aLiDot = $(pointIcon);
		var Btn = $(".btn");
		var btnLeft = $(prevBtn);
		var btnRight = $(nextBtn);
		
		var LiImgSize = $(item).size();
		var cur = 0;
		
		
		//alert(LiImgSize);
		
		aLiDot.hover(function(){
			var index = $(this).index();
			cur = index;
			wrapBg.eq(cur).fadeIn(500).siblings().fadeOut(500);
			aLiImg.eq(cur).fadeIn(500).siblings().fadeOut(500);
			aLiDot.eq(cur).addClass('current').siblings().removeClass('current');	
		}); 
		
		btnLeft.click(function(){
			BtnLeft();
		});
		
		btnRight.click(function(){
			BtnRight();
		});
		
		function BtnRight(){
			cur++;
			
			if(cur == LiImgSize){
			cur = 0;
			}
			
			wrapBg.eq(cur).fadeIn(500).siblings().fadeOut(500);
			aLiImg.eq(cur).fadeIn(500).siblings().fadeOut(500);
			aLiDot.eq(cur).addClass('current').siblings().removeClass('current');	
		}
		
		
		function BtnLeft(){
			cur--;
			if(cur == -1){
			cur = LiImgSize - 1;
			}
			wrapBg.eq(cur).fadeIn(500).siblings().fadeOut(500);
			aLiImg.eq(cur).fadeIn(500).siblings().fadeOut(500);
			aLiDot.eq(cur).addClass('current').siblings().removeClass('current');	
		}
		
		/*if(auto){
			var timer = setInterval(BtnLeft,5000);
			oDiv.mouseover(function(){
				clearInterval(timer);
				Btn.stop().animate({opacity:1})
			});
			oDiv.mouseout(function(){
				timer = setInterval(BtnLeft,5000);
				Btn.stop().animate({opacity:0})
			});
		}*/
	};
	


	//========================= 弹出层 20160716===========================
	//openPopup(_targetPopup,_fixed)   //_targetPopup 弹出框名称(例如：.popA或#popB)  _fixed (position:fixed或position:absolute) 是否固定 true或false
	  
	var popupList=new Array();
	
	function openPopup(_targetPopup,_fixed,_targetMask){
		var _mask=$(".blackMask");
		
		if(_targetMask!=null){
			_mask=$(_targetMask);
			}
		
		$(_mask).show();
		$(_targetPopup).show();
		
		if(_fixed){
			$(_targetPopup).css({"position":"fixed"});
			}
		else{
			$(_targetPopup).css({"position":"absolute"});
			}
		
		if(popupList.length==0){
			$(window).bind("resize",setPopupPosition);
		}
		
		popupList.push($(_targetPopup)[0]);
		setPopupPosition();
		
		}

	function closePopup(_targetPopup,_targetMask){
		var _mask = null
		
		if(_targetMask!=null){
			_mask=$(_targetMask);
			}
			
		$(_mask).hide();
		$(_targetPopup).hide();
	    
		if(popupList.length>0){
			var _index=popupList.indexOf($(_targetPopup)[0]);
			popupList.splice(_index,1);
		}
		
		if(popupList.length==0){
			$(window).unbind("resize",setPopupPosition);
			}
			
		clearTimeout(popupTimer);
			
		}
		
	function setPopupPosition(){
			winW=$(window).width();
			winH=$(window).height();
	     	for (var i = 0; i < popupList.length; i++) {
					
					if((winH-$(popupList[i]).height())/2<0){
						$(popupList[i]).css({"left":(winW-$(popupList[i]).width())/2,"top":20});
						}
					else{
						$(popupList[i]).css({"left":(winW-$(popupList[i]).width())/2,"top":(winH-$(popupList[i]).height())/2});
						}
					
				}
			
		}
	
	var popupTimer;
	function openTimerPopup(_delay,_targetPopup,_fixed,_targetMask){
			openPopup(_targetPopup,_fixed,_targetMask);
			clearTimeout(popupTimer);
			popupTimer=setTimeout(function(){
				closePopup(_targetPopup,_targetMask);
				},_delay);
		
		}
		
//=============== alert ====================
var errorAlert='<div class="popup xw_dataPopup popup_prompt errorAlert" style="display:block;"><h1 class="dataPopup_h">提示 <i onClick="closePopup(\'.errorAlert\',\'.blackMask\')" class="fa fa-times-circle"></i></h1><div class="remind_text"><div class="remind_text_center"><span class="msg" >提交失败！</span> </div></div><div class="it_btn" style="text-align:center;" ><input type="button" value="确 认" onClick="closePopup(\'.errorAlert\',\'.blackMask\')" class="dataPopup_btn"/></div></div>'
var successAlert='<div class="popup xw_dataPopup popup_prompt successAlert" style="display:block;"><h1 class="dataPopup_h">提示 <i onClick="closePopup(\'.successAlert\',\'.blackMask\')" class="fa fa-times-circle"></i></h1><div class="remind_text"><div class="remind_text_center"> <span class="msg" >提交成功！</span> </div></div><div class="it_btn" style="text-align:center;" ><input type="button" value="确 认" onClick="closePopup(\'.successAlert\',\'.blackMask\')" class="dataPopup_btn"/></div></div>'

function addErrorAlert(_msg){
	var alertPopup=$(errorAlert);
	$(".errorAlert").remove();
	$("body").append(alertPopup);
	$(".errorAlert .msg").html(_msg);
	openPopup('.errorAlert',true);
}
	

function addSuccessAlert(_msg){
	var alertPopup=$(successAlert);
	$(".successAlert").remove();
	$("body").append(alertPopup);
	$(".successAlert .msg").html(_msg);
	openPopup('.successAlert',true);

	}	

//===================== 图片上传 20160716 ============================

function uploadImg(file,previewImg,_maxW,_maxH)
	{
	  var MAXWIDTH  = _maxW; 
	  var MAXHEIGHT = _maxH;
	  var ImgType=["gif", "jpeg", "jpg", "bmp", "png"];
	  var filemaxsize=500; 
  
	  if (file.files && file.files[0])
	  {
		
		var _file=file.files[0];
		 
		if (_file.value) {
                if (!RegExp("\.(" +ImgType.join("|") + ")$", "i").test(_file.value.toLowerCase())) {
                    alert("选择文件错误,图片类型必须是" + ImgType.join("，") + "中的一种");
                    _file.value = "";
                    return false
                }
				
				fileSize = _file.Size; 
				var size = fileSize / 1024; 
					if(size>filemaxsize){ 
						alert("附件大小不能大于"+filemaxsize/1024+"M！"); 
						_file.value =""; 
						return false; 
					} 
					if(size<=0){ 
						alert("附件大小不能为0M！"); 
						_file.value =""; 
						return false; 
					} 
				
		}
		
		 
		  var img = $(previewImg)[0];
		  img.onload = function(){
			$(img).css({"width":"auto","height":"auto"});
			var rect = clacImgZoomParam(MAXWIDTH, MAXHEIGHT, img.offsetWidth, img.offsetHeight);
			$(img).css({"width":rect.width,"height":rect.height,"margin-top":rect.top});
			
		  }
		  var reader = new FileReader();
		  reader.onload = function(evt){				  
			  $(img).attr('src',evt.target.result).fadeIn();
			  }
		  reader.readAsDataURL(file.files[0]);
	  }
	  else //兼容IE
	  {
		var sFilter='filter:progid:DXImageTransform.Microsoft.AlphaImageLoader(sizingMethod=scale,src="';
		file.select();
		 var src = document.selection.createRange().text;
		 var img = $(previewImg)[0];
		 $(img).attr('src',src).fadeIn();
		 
		$(img).css({"width":"auto","height":"auto"});
		var rect = clacImgZoomParam(MAXWIDTH, MAXHEIGHT, img.offsetWidth, img.offsetHeight);
		status =('rect:'+rect.top+','+rect.left+','+rect.width+','+rect.height);
		$(img).css({"width":rect.width,"height":rect.height,"margin-top":rect.top});
		
	  }
	}
	
//=================== 图片等比例缩放 ==========================

function clacImgZoomParam( maxWidth, maxHeight, width, height ){
	var param = {top:0, left:0, width:width, height:height};
	if( width>maxWidth || height>maxHeight )
	{
		var rateWidth = width / maxWidth;
		var rateHeight = height / maxHeight;
		 
		if( rateWidth > rateHeight )
		{
			param.width =  maxWidth;
			
			param.height = Math.round(height / rateWidth);
			
			
		}else
		{
			param.width = Math.round(width / rateHeight);
			param.height = maxHeight;
		}
		
		
	}
	 
	param.left = Math.round((maxWidth - param.width) / 2);
	param.top = Math.round((maxHeight - param.height) / 2);
	return param;
}



function deleteUploadImg(_targetInputFile,_targetImg,_defaultImgUrl){
	 $(_targetImg).attr("src","../assets/images/upimg.png");
	 $(_targetInputFile).value = "";
	}

function previewImg(_targetPopup,_fixed,_targetImg,_imgUrl){
	$(_targetImg).attr("src",_imgUrl);
	openPopup(_targetPopup,_fixed,".previewImgBlackMask");
	
	}

function closePreviewImg(_targetPopup){
	closePopup(_targetPopup,".previewImgBlackMask");
	}
	
	
//=============================== validate ======================================
var reg={
	mobile:/^(((13[0-9]{1})|(14[0-9]{1})|(17[0]{1})|(15[0-3]{1})|(15[5-9]{1})|(18[0-9]{1}))+\d{8})$/,  //验证手机号码规则
	tel:/^\d{3}-\d{8}|\d{4}-\d{7}/,  //验证电话号码规则
	internationalTel:/^(\+\d+ )?(\(\d+\) )?[\d ]+$/,  //验证国际通用的电话号码规则
	msgVerificationCode:/^[a-zA-Z0-9]{4}$/, //验证手机验证码规则
	//pwd:/^[a-zA-Z0-9]{8,16}$/,
	pwd:/^(?!^\d+$)(?!^[a-zA-Z]+$)[0-9a-zA-Z]{8,16}$/, //验证密码规则
	pwdEnough:/^(?!^\d+$)(?!^[a-zA-Z]+$)[0-9a-zA-Z]{8,10}$/,  //验证密码弱规则
	pwdMedium:/^(?!^\d+$)(?!^[a-zA-Z]+$)[0-9a-zA-Z]{11,13}$/, //验证密码中等规则
	pwdStrong:/^(?!^\d+$)(?!^[a-zA-Z]+$)[0-9a-zA-Z]{14,16}$/, //验证密码强规则
	//taxNum:/^(?!^\d+$)(?!^[a-zA-Z]+$)[0-9a-zA-Z]{15,18}/,
	taxNum:/^[a-zA-Z0-9]{15,18}/,  //验证税号规则
	nickName:/^(?![tT])[~!@#$%^&()\-\+\=\<\>\?\/\,\.\_\w+\d+\u4e00-\u9fa5]{6,12}$/,  //验证昵称规则name:/^(?![tT])[~!@#$%^&()\-\+\=\<\>\?\/\,\.\_\w+\d+\u4e00-\u9fa5]{6,12}$/,  //验证姓名规则
	email:/^\w[-\w.+]*@([A-Za-z0-9][-A-Za-z0-9]+\.)+[A-Za-z]{2,18}/,   //验证email规则
	url:/^((https|http|ftp|rtsp|mms)?:\/\/)[^\s]+/,   //验证url规则
	qq:/^[1-9][0-9]{4,}/,   //验证qq号码规则
	zipCode:/^[1-9]\d{5}(?!\d)/,  //验证中国邮政编码规则
	idCard :/^\d{15}|\d{18}/,  //验证中国的身份证为15位或18位规则
	age:/^(1[0-2]\d|\d{1,2})$/,     //验证年龄规则
	english:/^[A-Za-z]+$/,      //验证英文规则
	chinese:/^[\u0391-\uFFE5]+$/,     //验证中文规则
	money:/^\d+\.\d{2}$/,     //验证是否是货币规则
	number:/^\d+$/,  //验证数字规则
	date_y:/^(\d{4})$/,   //日期格式yyyy 
	date_ym: /^(\d{4})-(0\d{1}|1[0-2])$/,   //日期格式yyyy-mm 
	date_ymd: /^(\d{4})-(0\d{1}|1[0-2])-(0\d{1}|[12]\d{1}|3[01])$/,   //日期格式yyyy-mm-dd 
	time_h:/^(0\d{1}|1\d{1}|2[0-3])$/,   //时间格式hh 
	time_hm:/^(0\d{1}|1\d{1}|2[0-3]):([0-5]\d{1})$/, //时间格式hh:mm
	time_hms:/^(0\d{1}|1\d{1}|2[0-3]):[0-5]\d{1}:([0-5]\d{1})$/  //时间格式hh:mm:ss

	}
	
	
//以下 _str:需要验证的字符串内容,_required:true/false  是/否必选比填写
	
function checkRequired(_target){    //检查 target:被验证input 是否必选或必填
	var _required=false;
	if($(_target).hasClass("required")){
		_required=true;
		}
	return _required;
	}

function checkMobile(_str,_required){  //判断手机号码
	var _errorMsg="";
	
	if(_required==true){
		if(_str==""){
			_errorMsg="手机号码不能为空！"
			return _errorMsg;
			}
	}
	
	if(_str.length>0){
		if(_str.length!==11){
				_errorMsg="请输入有效的手机号码！"
				return _errorMsg;
			}
		
			
		if(!reg.mobile.test(_str)){
				_errorMsg="请输入有效的手机号码！"
				return _errorMsg;
			}
	}
		
	return true;
	
}


function checkTel(_str,_required){  // 验证国内电话号码
	var _errorMsg="";
	
	if(_required==true){
		if(_str==""){
			_errorMsg="电话号码不能为空！"
			return _errorMsg;
			}
	}
	
	if(_str.length>0){
		if(!reg.tel.test(_str)){
			_errorMsg="请输入有效的电话号码！"
			return _errorMsg;
			}
	}
	return true;
	}


function checkInternationalTel(_str,_required){  // 验证国际电话号码
	var _errorMsg="";
	
	if(_required==true){
		if(_str==""){
			_errorMsg="电话号码不能为空！"
			return _errorMsg;
			}
	}
	
	if(_str.length>0){
		if(!reg.internationalTel.test(_str)){
			_errorMsg="请输入有效的电话号码！"
			return _errorMsg;
			}
	}
	
	return true;
	}




function checkMsgVerificationCode(_str,_required){  //判断手机验证码
	if(_required==true){
		if(_str==""){
			_errorMsg="请输入手机验证码！"
			return _errorMsg;
			}
	}
	
	if(_str.length>0){	
		if(!reg.msgVerificationCode.test(_str)){
				_errorMsg="手机验证码有误！"
				return _errorMsg;
			}
	}
		
	return true;
	
	}


function checkPwd(_str,_required){    //判断密码
	
	if(_required==true){
		if(_str==""){
			_errorMsg="密码不能为空！"
			return _errorMsg;
			}
	}
	
	if(_str.length>0){	
		if(!reg.pwd.test(_str)){
				_errorMsg="密码必须且只能包含字母、数字，长度为8-16位！"
				return _errorMsg;
			}
	}
		
	return true;
	}
	
function checkConfirmPwd(_confirmPwdStr,_targetPwdStr){   //判断确认密码
	if(_confirmPwdStr==""){
		_errorMsg="确认密码不能为空！"
		return _errorMsg;
		}
		
	if(_confirmPwdStr!=_targetPwdStr){
			_errorMsg="密码不一致！"
			return _errorMsg;
		}
		
	return true;
	
	}
	
	
function checkPwdStrength(_str){  //判断密码强弱
	var msg;
	 if(reg.pwdEnough.test(_str)){
		      msg="enough";
		      return msg
     }else  if (reg.pwdMedium.test(_str)) {
		      msg="medium";
		      return msg
     }else if(reg.pwdStrong.test(_str)) {
		      msg="strong";
		      return msg
     }else{
		  msg="密码必须且只能包含字母、数字，长度为8-16位！";
		  return msg;
		 }
     return true;	
	}
	
	
	
	
function checkTaxNum(_str,_required){  //判断税号
	if(_required==true){
		if(_str==""){
			_errorMsg="税号不能为空！"
			return _errorMsg;
			}
	}
	
	if(_str.length>0){
	if(!reg.taxNum.test(_str)){
			_errorMsg="税号为15-18位的数字＋字母组合！"
			return _errorMsg;
		}
	}
	return true;
	
	}
	
	
function checkNickName(_str,_required){   //判断用户昵称

	if(_required==true){
		if(_str==""){
			_errorMsg="昵称不能为空！"
			return _errorMsg;
			}
	}
	
	if(_str.length>0){	
		if(!reg.nickName.test(_str)){
				_errorMsg="不能用tT字母开头，不能包含*号，长度6-12位！"
				return _errorMsg;
			}
	}
	return true;
	
	}
	
	
function checkName(_str,_required){   //判断用户姓名
	if(_required==true){
		if(_str==""){
			_errorMsg="姓名不能为空！"
			return _errorMsg;
			}
	}
	
	if(_str.length>0){
		if(!reg.name.test(_str)){
				_errorMsg="不能用T字母开头，不能包含*号，长度6-12位！"
				return _errorMsg;
			}
	}
	
	return true;
	}
	
	
function checkName(_str,_required){   //判断用户姓名
	if(_required==true){
		if(_str==""){
			_errorMsg="姓名不能为空！"
			return _errorMsg;
			}
	}
	if(_str.length>0){
		if(!reg.name.test(_str)){
				_errorMsg="不能用T字母开头，不能包含*号，长度6-12位！"
				return _errorMsg;
			}
	}
	return true;
	}
	
	
	
function checkEmail(_str,_required){   //判断email
	if(_required==true){
		if(_str==""){
			_errorMsg="邮箱地址不能为空！"
			return _errorMsg;
			}
	}
	
	if(_str.length>0){
		if(!reg.email.test(_str)){
				_errorMsg="请正确输入邮箱地址！"
				return _errorMsg;
			}
	}
	
	return true;
	}
	
	
	
function checkUrl(_str,_required){   //判断url
	if(_required==true){
		if(_str==""){
			_errorMsg="Url地址不能为空！"
			return _errorMsg;
			}
	}
	if(_str.length>0){
		if(!reg.url.test(_str)){
				_errorMsg="请正确输入网址！"
				return _errorMsg;
			}
	}
	return true;
	}
	
	
function checkQq(_str,_required){   //判断QQ号码
	if(_required==true){
		if(_str==""){
			_errorMsg="QQ号码不能为空！"
			return _errorMsg;
			}
	}
	if(_str.length>0){
		if(!reg.qq.test(_str)){
				_errorMsg="请正确输入QQ号码！"
				return _errorMsg;
			}
	}
	return true;
	}
	
	
function checkZipCode(_str,_required){   //判断邮政编码
	if(_required==true){
		if(_str==""){
			_errorMsg="邮政编码不能为空！"
			return _errorMsg;
			}
	}
	if(_str.length>0){
		if(!reg.zipCode.test(_str)){
				_errorMsg="请正确输入邮政编码！"
				return _errorMsg;
			}
	}
	return true;
	}
	
	
function checkIdCard(_str,_required){   //判断身份证号码
	if(_required==true){
		if(_str==""){
			_errorMsg="身份证号码不能为空！"
			return _errorMsg;
			}
	}
	if(_str.length>0){
	if(!reg.idCard.test(_str)){
			_errorMsg="请正确输入身份证号码！"
			return _errorMsg;
		}
	}
	return true;
	}
	
	
function checkAge(_str,_required){   //判断年龄
	if(_required==true){
		if(_str==""){
			_errorMsg="年龄不能为空！"
			return _errorMsg;
			}
	}
	if(_str.length>0){
		if(!reg.age.test(_str)){
				_errorMsg="请正确输入年龄！"
				return _errorMsg;
			}
	}
	return true;
	}
	


function checkEnglish(_str,_required){   //判断英文
	if(_required==true){
		if(_str==""){
			_errorMsg="内容不能为空！"
			return _errorMsg;
			}
	}
	if(_str.length>0){
		if(!reg.english.test(_str)){
				_errorMsg="输入的不是英文！"
				return _errorMsg;
			}
	}
	return true;
	}
	

function checkChinese(_str,_required){   //判断中文
	if(_required==true){
		if(_str==""){
			_errorMsg="内容不能为空！"
			return _errorMsg;
			}
	}
	if(_str.length>0){
		if(!reg.chinese.test(_str)){
				_errorMsg="输入的不是中文！"
				return _errorMsg;
			}
	}
	return true;
	}
	

function checkMoney(_str,_required){   //判断货币
	if(_required==true){
		if(_str==""){
			_errorMsg="货币不能为空！"
			return _errorMsg;
			}
	}
	
	if(_str.length>0){
		if(!reg.money.test(_str)){
				_errorMsg="输入的不是货币！"
				return _errorMsg;
			}
	}
	return true;
	}
	

function checkNumber(_str,_required){   //判断是否是数字
	if(_required==true){
		if(_str==""){
			_errorMsg="内容不能为空！"
			return _errorMsg;
			}
	}
	if(_str.length>0){
		if(!reg.number.test(_str)){
				_errorMsg="输入的不是数字！"
				return _errorMsg;
			}
	}
	return true;
	}
	

var errorAlert='<div class="popup xw_dataPopup popup_prompt errorAlert" style="display:block;"><h1 class="dataPopup_h">提示 <i onClick="closePopup(\'.errorAlert\',\'.blackMask\')" class="fa fa-times-circle"></i></h1><div class="remind_text"><div class="remind_text_center"><span class="msg" >提交失败！</span> </div></div><div class="it_btn" style="text-align:center;" ><input type="button" value="确 认" onClick="closePopup(\'.errorAlert\',\'.blackMask\')" class="dataPopup_btn"/></div></div>'


var successAlert='<div class="popup xw_dataPopup popup_prompt successAlert" style="display:block;"><h1 class="dataPopup_h">提示 <i onClick="closePopup(\'.successAlert\',\'.blackMask\')" class="fa fa-times-circle"></i></h1><div class="remind_text"><div class="remind_text_center"> <span class="msg" >提交成功！</span> </div></div><div class="it_btn" style="text-align:center;" ><input type="button" value="确 认" onClick="closePopup(\'.successAlert\',\'.blackMask\')" class="dataPopup_btn"/></div></div>'


function addErrorAlert(_msg){
	var alertPopup=$(errorAlert);
	$(".errorAlert").remove();
	$("body").append(alertPopup);
	$(".errorAlert .msg").html(_msg);
	openPopup('.errorAlert',true);
}
	

function addSuccessAlert(_msg){
	var alertPopup=$(successAlert);
	$(".successAlert").remove();
	$("body").append(alertPopup);
	$(".successAlert .msg").html(_msg);
	openPopup('.successAlert',true);

	}	
	
//=============== alert ====================
var errorAlert='<div class="popup xw_dataPopup popup_prompt errorAlert" style="display:block;"><h1 class="dataPopup_h">提示 <i onClick="closePopup(\'.errorAlert\',\'.blackMask\')" class="fa fa-times-circle"></i></h1><div class="remind_text"><div class="remind_text_center"><span class="msg" >提交失败！</span> </div></div><div class="it_btn" style="text-align:center;" ><input type="button" value="确 认" onClick="closePopup(\'.errorAlert\',\'.blackMask\')" class="dataPopup_btn"/></div></div>'
var successAlert='<div class="popup xw_dataPopup popup_prompt successAlert" style="display:block;"><h1 class="dataPopup_h">提示 <i onClick="closePopup(\'.successAlert\',\'.blackMask\')" class="fa fa-times-circle"></i></h1><div class="remind_text"><div class="remind_text_center"> <span class="msg" >提交成功！</span> </div></div><div class="it_btn" style="text-align:center;" ><input type="button" value="确 认" onClick="closePopup(\'.successAlert\',\'.blackMask\')" class="dataPopup_btn"/></div></div>'

function addErrorAlert(_msg){
	var alertPopup=$(errorAlert);
	$(".errorAlert").remove();
	$("body").append(alertPopup);
	$(".errorAlert .msg").html(_msg);
	openPopup('.errorAlert',true);
}
	

function addSuccessAlert(_msg){
	var alertPopup=$(successAlert);
	$(".successAlert").remove();
	$("body").append(alertPopup);
	$(".successAlert .msg").html(_msg);
	openPopup('.successAlert',true);

	}	
	
//成功错误提示弹层
function errorPanelAlert(_msg){
	$(".errorPanel").hide();
	$(".errorPanel").show();
	$(".errorPanel .msg").html(_msg);
	openPopup('.errorPanel',true);
}
	

function successPanelAlert(_msg){
	$(".successPanel").hide();
	$(".successPanel").show();
	$(".successPanel .msg").html(_msg);
	openPopup('.successPanel',true);

	}
//带有确认框弹层
function surealertPanel(_msg,url){
	$("#urlpath").val('');
	$(".surealertPanel").hide();
	$(".surealertPanel").show();
	$(".surealertPanel .msg").html(_msg);
	openPopup('.surealertPanel',true);
	$("#urlpath").val(url);
	}

//var popupTimer;
function alertTimerPopup(_delay,_targetPopup,_fixed,_targetMask,_msg){
		$(_targetPopup+' .msg').html(_msg);
		openPopup(_targetPopup,true);
		clearTimeout(popupTimer);
		popupTimer=setTimeout(function(){
			closePopup(_targetPopup,_targetMask);
			},_delay);
	
	}
//---------------------- containerCenter update 20160903
function containerCenter(){
	containerCenterTransverse(".center-transverse");
	containerCenterVertical(".center-vertical");	
	}
	
function containerCenterTransverse(_obj){
	var _pw=$($(_obj).parent()).width();
	var _w=$(_obj).width();
	$(_pw).css({"position":"relative"});
	$(_obj).css({"position":"absolute","left":(_pw-_w)/2});
}

	
function containerCenterVertical(_obj){
	var _ph=$($(_obj).parent()).height();
	var _h=$(_obj).height();
	
	
	if($(_obj).length>0){
		if($(_obj).parent()[0].tagName=="body"||$(_obj).parent()[0].tagName=="BODY"){
			_ph=$(window).height();
			}
		else{		
			$(_ph).css({"position":"relative"});
			}
	}
	
	$(_obj).css({"position":"absolute","top":(_ph-_h)/2});
	
	
}

//=========== input,select focus====================
	
function _initInputs(){   //初始化 input,select focus事件
  
	  $("input,select").focus(
			 function(){
			  $(this).addClass("inputFocus");
			}
	  );
	  
	  $("input,select").blur(
			 function(){
			  $(this).removeClass("inputFocus");
			}
	  );
	
	}	

function _initSelects(){   //初始化 input,select focus事件
  
	  $(".zhpxSelect,.rqSelect").focus(
			 function(){
			  $(this).addClass("selectFocus");
			}
	  );
	  
	  $("input,select").blur(
			 function(){
			  $(this).removeClass("selectFocus");
			}
	  );
	
	}
	
function _inittextarea(){   //初始化 input,select focus,textarea(事件
  
	  $(".lytex").focus(
			 function(){
			  $(this).addClass("inputFocus");
			}
	  );
	  
	  $(".lytex").blur(
			 function(){
			  $(this).removeClass("inputFocus");
			}
	  );
	
	}		