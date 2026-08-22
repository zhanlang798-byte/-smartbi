$(function(){
	var winW;
	var bannerImgListW;
	var bannerBtnListW;
	
	_initHomepage();
    _initInputs();
	_initSelects();
	_inittextarea();
	_initSubpageDsj();  //初始化大事记
	_initSubpageNav();  //初始化内页左侧菜单
	_initServicePage(); //初始化投资者服务
    _initwsjysIndex();  //网上交易所首页
	
	containerCenter();//垂直居中
	
	var initTop=50
	$(window).bind("scroll", function(event){
			 if($(window).scrollTop()>initTop){
				 $(".header .top").css({"display":"none"});
				 }
			else{
				 $(".header .top").css({"display":"block"});
				}
					
		 });
		 
});





function setBannerImgListPosition(){
		winW=$(window).width();		
		var w=winW;	
		
		if(w<1260){
			w=1260;
			}
		
		bannerImgListW=$(".bannerImgList").width();
		$(".bannerImgList").css({"margin-left":(w-bannerImgListW)/2});
		
		bannerBtnListW=$(".bannerBtnList").width();
		$(".bannerBtnList").css({"left":(w-bannerBtnListW)/2});
	}
	
function _initHomepage(){   //初始化首页
	
	setBannerImgListPosition();
	$(window).resize(function(){
		setBannerImgListPosition();
		});

   // carousel(".bannerImgList Li",".bannerBtnList li",4000);
   //carousel(".picList Li",".newsbtnList li",4000);
   
   rollToolVertical(".tipsBar .tipsCont ul",".tipsBar .tipsCont li",1,40,".tipsBtn .btn1",".tipsBtn .btn2",true,4000,400)	
   swtichTool(".newsCenterTitle .titleList li","current",".newsCenterCont .content1","click")
   rollToolTransverse(".mainQuike .quikeNav ul",".mainQuike .quikeNav ul li",6,188,".mainQuike .quikeLBtn",".mainQuike .quikeRBtn",true,3000,400)
   
   
   rollToolTransverse(".PSbtnBar .btnList ul",".PSbtnBar .btnList li",7,98,".PSbtnBar .arrowLBtn",".PSbtnBar .arrowRBtn",false,4000,400)

   swtichTool(".PSbtnBar .btnList li","current",".PScontentList .list","click")
   swtichTool(".jzk_swhj_introduction .subTitle li","current",".jzk_swhj_introduction .content","mouseover") 
   rollToolVertical(".tzz_tipsBar_left .txtCent ul",".tzz_tipsBar_left .txtCent li",1,50,".tzz_tipsBar_left .tipsBtn .btn1",".tzz_tipsBar_left .tipsBtn .btn2",true,4000,400)	
	
	$(".marketData tr").click(function(){
		$(".marketData tr").removeClass("current");
		$(this).addClass("current");
		
		});
	
	}
	
function _initSelects(){   //初始化 input,select focus事件
  
	  $("select").focus(
			 function(){
			  $(this).addClass("selectFocus");
			}
	  );
	  
	  $("select").blur(
			 function(){
			  $(this).removeClass("selectFocus");
			}
	  );
	
	}	
	
function _initSubpageNav(){  //初始化内页左侧菜单
	var _cont;
	$(".leftColumnNav .item").bind("click",function(){
		_cont=$(this).parent().find(".subNav:first");
		if(!$($(this).parent()).hasClass("current")){
				$($(this).parent().parent().find("li")).removeClass("current");
				$($(this).parent().parent().find(".subNav")).removeClass("current");
				$(_cont).addClass("current");
				$($(this).parent()).addClass("current");
				$($(this).parent().parent().find(".item")).removeClass("itemCurrent");
				$(this).addClass("itemCurrent");
				
			}else{
				$(_cont).removeClass("current");
				$($(this).parent()).removeClass("current");
				$(this).removeClass("itemCurrent");
				}
		})			
		
		
	}

	
function _initSubpageDsj(){  //初始化大事记
      rollToolTransverse(".djsbtnBar .djsbtnList ul",".djsbtnBar .djsbtnList li",8,96,".djsbtnBar .arrowBtnL",".djsbtnBar .arrowBtnR",false,4000,200)
      swtichTool(".djsbtnBar .djsbtnList li","current",".djscontent","click")
	}
	
function _initwsjysIndex(){  //网上交易所首页
	swtichTool(".jyhqCont .btnList li", "current", ".newsLeftCont", "click")
	swtichTool(".newCenterLeft .title li", "current",".newCenterLeft .newCenterCont", "click")
	swtichTool(".newCenterRight .title li", "current",".newCenterRight .newCenterCont", "click")
	swtichTool(".ProductsBtnList li", "current", ".Productscontent", "click")
	swtichTool(".titleBar li", "current", ".jzk_gjgw_content", "click")
	swtichTool(".lt_content .btnList li", "current", ".content_box", "click")// 高峰论坛
	swtichTool(".titleBar li", "current", ".zjct", "click")

	}

function _initServicePage(){  //初始化投资者服务
	$(".tzz_kcfl .controlBtn").click(function(){
		 if($(this).hasClass("open")){
			$(this).parent().css({"height":45});
			$(this).removeClass("open");
			$(this).html('+<span>展开</span>');
			}
		else{
			
			$(this).parent().css({"height":"auto"});
			$(this).addClass("open");
			$(this).html('-<span>收起</span>');
			}
		});
	}

