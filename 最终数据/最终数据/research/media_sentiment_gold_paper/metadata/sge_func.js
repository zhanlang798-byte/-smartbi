/**
 * 如果指定checkbox选中，则返回其值，否则返回空
 */
function getChexkBoxVal(node){
    if(node.length<1){
        return "";
    }
    if(node[0].checked){
        return node.val();
    }
    return "";
}

/**
 * 从url中获取参数值
 */
function getRequest(key,paramUrl){
	var paraMap = getLocationParameterMap(paramUrl);
	var res = paraMap.get(key);
	if(!res){
		return "";
	}
	return res;
}

/**
 * 将URL中的参数转换成对照容器
 * paramUrl 动作路径
 */
function getLocationParameterMap(paramUrl){
	//构建返回值
	var reMap = new ValueMap();
	//获取调用路径
	if(!paramUrl){
	       paramUrl = window.location.href;
    }
	//参数分割点
	var point = paramUrl.indexOf("?");
	if(point>-1){
		//去掉动作路径
		paramUrl = paramUrl.substring(point+1,paramUrl.length);
		var subPara; //参数段
		while(true){
			var fixOver = false; //是否处理结束
			point = paramUrl.indexOf("&");
			if(point>-1){
				subPara = paramUrl.substring(0,point);
				paramUrl = paramUrl.substring(point+1,paramUrl.length);
			}else{
				subPara = paramUrl;
				fixOver = true;
			}
			point = subPara.indexOf("=");
			if(point>-1){
				reMap.put(
					subPara.substring(0,point)
					,subPara.substring(point+1,subPara.length));
			}
			if(fixOver){
				break;
			}
		}
	}
	return reMap;
}


/**
 * 提交XML内容
 * url 动作路径
 * xml 提交XML内容
 * 返回文本
 */
function postData(url,data){
	var xmlHttp;
	try{
		if(window.XMLHttpRequest){
			xmlHttp = new XMLHttpRequest();
		}else if(window.ActiveXObject){
			xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");
		}
		if (url.indexOf("?")>-1){
				url+="&";
		}else{
				url+="?";
		}
		url+="_js=1&_ts_="+(new Date()).valueOf();

		if(data==null || data==""){
			xmlHttp.open("GET","<%=ctx%>"+url,false);
			xmlHttp.setRequestHeader("CONTENT-TYPE", "application/x-www-form-urlencoded");
			xmlHttp.send(null);
		}else{
			xmlHttp.open("POST","<%=ctx%>"+url,false);
			xmlHttp.setRequestHeader("CONTENT-TYPE", "application/x-www-form-urlencoded");
			xmlHttp.send(data);
		}
		return xmlHttp.responseText;
	}catch(ex){
		if(debug){
			alert("Error:\nAction:["+url+"]\nParams:["+data+"]\n"+ex);
		}
	}
}

/**
 * 提交XML内容并返回XML内容
 */
function queryXml(url,xml){
	var method;
	if(xml){
		method = "POST";
	}else{
		method = "GET";
	}
	if (url.indexOf("?")>-1){
			url+="&";
	}else{
			url+="?";
	}
	url+="_js=1&_ts_="+(new Date()).valueOf();
    var res = $.ajax({
                  type: method,
                  url:"<%=ctx%>"+url,
                  dataType:"xml",
                  cache: false,
                  async: false,
                  type:"post",
                  data:xml
             });
    if(res==null){
        return null;
    }
    return $(res.responseXML);
}

/**
 * 调用数据返回Json对象
 * url 调用动作路径
 * params 传入参数
 */
function getJson(url,params,debug){
	var method;
	if(params){
		method = "POST";
	}else{
		method = "GET";
	}
	if (url.indexOf("?")>-1){
			url+="&";
	}else{
			url+="?";
	}
	url+="_js=1&_ts_="+(new Date()).valueOf();
    var res = $.ajax({
                type: method,
                url: "<%=ctx%>"+url,
                cache: false,
                async: false,
                data:params
            }).responseText;
    if(debug){
        alert(res);
    }
    if(res==""){
        return null;
    }
    eval("var dataJson = "+res);
    try{
    	if(dataJson.status=="-99"){//-404
    		window.location = "<%=ctx%>/sso/login.html?redir="+urlEncode(window.location.href);
    	}else if(dataJson.status=="-404"){
			X.dialog.alert("该用户已在其他终端登陆，请重新登陆",{title:'温馨提示',notify:function(nt){
				postData("/100026.ha");
				 window.location = "<%=ctx%>/sso/login.html?redir="+urlEncode(window.location.href);
			}});
		}
    }catch(e){}
    return dataJson;
}


/**
 * AJAX提交信息
 * url 动作路径
 * params 提交参数字符串 &para1=value1&para2=value2
 * invokeMethod 异步调用时调用成功后执行的方法 如果存在该值，则为异步调用
 */
function getUrlValue(url,params,innerTag,invokeMethod){
	var method;
	if(params){
		method = "POST";
	}else{
		method = "GET";
	}
    if(invokeMethod){
        //异步调用
        $.ajax({
          type: method,
          url: "<%=ctx%>"+url,
          data:params,
          cache: false,
          success: invokeMethod
        });
    }else{
        //同步调用
        return $.ajax({
                    type: method,
                    url: "<%=ctx%>"+url,
                    cache: false,
                    async: false,
                    data:params
                }).responseText;
    }
}


/**
 * 通过父节点主键获取当前节点的父节点
 * node 当前节点
 * attributeValue 父节点的指定属性的值
 * attributeName 父节点指定的属性名，如果为空，则默认为id
 */
function getParentNode(node,attributeValue,attributeName){
    if(!node){
        return null;
    }
    if (!(node instanceof jQuery)){
        node = $(node);
    }
	if(node[0].nodeName=="#document"){
		return null;
	}
    var res = node.find("["+attributeName+"="+attributeValue+"]");
    if(res.length<1){
        return getParentNode(node[0].parentNode,attributeValue,attributeName);
    }
	return res;
}

/**
 * URL编码转码
 */
function urlEncode(str){      
	var ret="";      
	var strSpecial="!\"#$%&'()*+,/:;<=>?[]^`{|}~%";      
	var tt= "";     
	for(var i=0;i<str.length;i++){      
		var chr = str.charAt(i);      
		var c=str2asc(chr);      
		tt += chr+":"+c+"n";      
		if(parseInt("0x"+c) > 0x7f){      
			ret+="%"+c.slice(0,2)+"%"+c.slice(-2);      
		}else{      
			if(chr==" "){  
				ret+="+";      
			}else if(strSpecial.indexOf(chr)!=-1){     
				ret+="%"+c.toString(16);      
			}else{
				ret+=chr;
			}
		}      
	}      
	return ret;      
}      

/**
 * URL编码解码
 */
function urlDecode(str){      
	var ret="";      
	for(var i=0;i<str.length;i++){      
		var chr = str.charAt(i);      
		if(chr == "+"){      
			ret+=" ";      
		}else if(chr=="%"){      
			var asc = str.substring(i+1,i+3);      
			if(parseInt("0x"+asc)>0x7f){      
				ret+=asc2str(parseInt("0x"+asc+str.substring(i+4,i+6)));      
				i+=5;      
			}else{      
				ret+=asc2str(parseInt("0x"+asc));      
				i+=2;      
			}      
		}else{      
			ret+= chr;      
		}      
	}      
	return ret;      
}      

function str2asc(strstr){ 
	return ("0"+strstr.charCodeAt(0).toString(16)).slice(-2); 
} 
function asc2str(ascasc){ 
	return String.fromCharCode(ascasc); 
} 

/**
 * 主键值容器
 */
function ValueMap(){
        
    var keyList = new ValueList(); //主键序列
    var vMap = ({}); //值容器
    
    this.typeName = "Map"; //容器名称
    this.put = doPut; //设置值
    this.get = doGet; //获取值
    this.clear = doClear; //清除所有值
    this.getKeys = doGetKeys; //获取所有值主键数组
    this.remove = doRemove; //移除指定值
    this.getKeyString = doGetKeyString; //获取主键字符串
    this.getKeyList = doGetKeyList; //获取主键序列
    this.toJavaString = getJavaString; //获取提交java类的字符串信息
    this.toEncodeJavaString = getEncodeJavaString; //获取编码后的提交java类的字符串信息
    this.size = keyList.size; //容器中元素数量
    this.putAll = doPutAll; //将目标容器中的所有元素装入当前容器中
    this.containsKey = containsKey; //判断是否存在该主键
    this.toString = doToString; //获取内容字符串
    this.removeValue = doRemoveValue; //移出容器中的值
    
    /*
     * 返回字符串信息
     */
    function doToString(){
       var res = "";
       var keyList = doGetKeyList();
       for(var i=0;i<keyList.size();i++){
           var key = keyList.get(i);
           var value = doGet(key);
           if(value==null){
               res += "["+key+"#null]";
           }else if(value instanceof ValueList){
               res += "["+key+"#List:"+value.toString()+"]";
           }else if(value instanceof ValueList){
               res += "["+key+"#Map:"+value.toString()+"]";
           }else {
                res += "["+key+"#"+value+"]";
           }
           res += "\n";
       }
       res += "{total:"+i+"}\n";
       return res;
    }
    
    
    /**
     * 判断是否存在该主键
     * key 指定主键
     */
    function containsKey(key){
        return doGetKeyList().contains(key);
    }
    
    
    /**
     * 将目标容器中的所有元素装入当前容器中 
     * 目标容器
     */
    function doPutAll(map){
        if(map==null || !(map instanceof ValueMap)){
            return;
        }
        var keyList = map.getKeyList();
        if(keyList==null){
            return;
        }
        for(var i=0;i<keyList.size();i++){
            var key = keyList.get(i);
            doPut(key,map.get(key));
        }
    }
    
    
    /**
     * 获取编码后的提交java类的字符串信息
     * @return 提交java类的字符串信息
     */
    function getEncodeJavaString(){
        return urlEncode(getObjectJavaString(this));
    }
    
    /**
     * 获取提交java类的字符串信息
     * @return 提交java类的字符串信息
     */
    function getJavaString(){
        return getObjectJavaString(this);
    }
    
    /**
     * 移除主键值
     * @param key 主键
     */
    function doRemove(key){
        vMap[key] = null;
        if (keyList.contains(key)){
            keyList.removeByElement(key);
        }
    }
    
    /**
     * 获取容器主键数组
     * @return 主键数组
     */
    function doGetKeys(){
        return keyList.getList();
    }
    
	/**
	 * 移出容器中的值
	 * 指定值
	 */
	function doRemoveValue(value){
		//获取主键序列
		var keyList = doGetKeyList();
		var key; //指定主键
		for(var i=0;i<keyList.size();i++){
			key = keyList.get(i);
			if(doGet(key)==value){
				doRemove(key);
				return;
			}
		}
	}
	
    /**
     * 获取主键序列
     * @return 主键序列
     */
    function doGetKeyList(){
        return keyList;
    }
    
    /**
     * 清除内容
     */
    function doClear(){
        keyList.clearAll();
        vMap = ({});
    }
    /**
     * 将值放入容器
     * @param key 主键
     * @param value 值
     */
    function doPut(key,value){
        vMap[key] = value;
        if (!keyList.contains(key)){
            keyList.add(key);
        }
    }
    
    /**
     * 取出指定值
     * @param key 主键
	 * @param notNull 如果返回值为空，则返回空字符串
     * @return 对应值
     */
    function doGet(key,notNull){
		var res = vMap[key];
		if(notNull && !res){
			return "";
		}
        return res;
    }
    
    /**
     * 获取主键字符串
     * @return 主键字符串
     */
    function doGetKeyString(){
        return keyList.getListString();
    }
}




/**
 * 序列容器
 * arr 内容数组
 */
function ValueList(arr){

    var listValue = arr?arr:[]; //核心容器
    var currentPoint = 0; //当前指针位置
    
    this.typeName = "List"; //容器名称
    this.size = getSize; //容器元素数量方法
    this.add = addElement; //增加元素方法
    this.removeByElement = removeByElement; //移除指定元素
    this.removeByIndex = removeByIndex; //通过索引移除指定元素
    this.get = getElement; //获取指定元素
	this.set = setElement; //设置指定元素
    this.contains = containsElement; //判断指定元素是否存在于序列中
    this.clearAll = clearAll; //清空所有元素
    this.getList = getElementList; //获取元素数组
    this.getListString = getElementString; //获取元素字符串序列
    this.toJavaString = getJavaString; //获取提交java类的字符串信息
    this.toEncodeJavaString = getEncodeJavaString; //获取编码后的提交java类的字符串信息
    this.toArray = doToArray; //将序列转换为数组
    this.addAll = doAddAll;     //添加指定序列中的所有元素
    this.toString = doToString; //获取内容字符串
    this.setArray = doSetArray;  //将数组设置到对象中
    this.hasNext = doHasNext;   //序列中是否存在下一个值
    this.nextValue = doNextValue; //获取当前指针所指的位置的值，获取后将指针累加1
    this.value = doValue;  //当前元素值
	this.replaceValue = doReplaceValue; //替换当前元素
	
	/**
	 * 替换当前元素
	 */
	function doReplaceValue(ele){
		if(getSize()<1 || currentPoint<1 || currentPoint>getSize()){
			return;
		}
		return setElement(currentPoint-1,ele);
	}
	
	/**
	 * 获取当前元素值
	 */
	function doValue(){
		if(getSize()<1){
			return null;
		}else if(currentPoint<1){
			return getElement(0);
		}else if(currentPoint>getSize()){
			return getElement(getSize()-1);
		}
		return getElement(currentPoint-1);
	}
	
    /**
     * 获取当前指针所指的位置的值，获取后将指针累加1
     */
    function doNextValue(){
        return getElement(currentPoint++);
    }
    
    /**
     * 序列中是否存在下一个值
     */
    function doHasNext(){
        if(getSize()>currentPoint){
            return true;
        }
        return false;
    }
    
	
	/**
	 * 将数组设置到对象中
	 */
	function doSetArray(arr){
		listValue = arr;
		if(arr){
			listValue = arr;
		}else{
			listValue = [];
		}
	}
	
    /*
     * 返回字符串信息
     */
    function doToString(){
       var res = "";
       var size = getSize();
       for(var i=0;i<size;i++){
           var ele = getElement(i);
           if(ele==null){
               res += "[null]";
           }else if(ele instanceof ValueList){
               res += "[List:"+ele.toString()+"]";
           }else if(ele instanceof ValueList){
               res += "[Map:"+ele.toString()+"]";
           }else{
               res += "["+ele+"]";
           }
           res += "\n";
       }
       res += "{total:"+i+"}\n";
       return res;
    }
    
    /**
     * 添加指定序列中的所有元素
     * list 待添加的序列
     */
    function doAddAll(list){
        if(list==null || !(list instanceof ValueList)){
            return; 
        }
        for(var i=0;i<list.size();i++){
            addElement(list.get(i));
        }
    }
    
    /**
     * 将序列转换为数组
     */
    function doToArray(){
        var res = [];
        for(var i=0;i<getSize();i++){
            res[i] = getElement(i);
        }
        return res;
    }
    
    /**
     * 返回容器元素数量
     * @return 回容器元素数量
     */
    function getSize(){
        return listValue.length;
    }
    
    /**
     * 获取提交java类的字符串信息
     * @return 提交java类的字符串信息
     */
    function getJavaString(){
        return getObjectJavaString(this);
    }
    
    
    /**
     * 获取提交java类的字符串信息
     * @return 提交java类的字符串信息
     */
    function getEncodeJavaString(){
        return urlEncode(getObjectJavaString(this));
    }
    
    /**
     * 清空所有元素
     */
    function clearAll(){
        listValue = [];
    }
    
    /**
     * 增加元素
     * @param element 增加的元素
     * @param index 增加到的位置
     */
    function addElement(element,index){
    
        if (index==null || index==""){
            listValue[listValue.length] = element;
            return;
        }
        var indexInt; //获取指定索引位置数字
        try{
            indexInt = parseInt(index);
        }catch(e){
            return;
        }
        if (indexInt<0){
            return;
        }
        //将指定位置之后的元素后遗
        var i =listValue.length; //循环索引
        while(i>indexInt){
            listValue[i] = listValue[i-1];
            i--;
        }
        listValue[indexInt] = element;
    }
    
    /**
     * 移除指定的元素
     * 如果容器中有相同的元素存在
     * 则只移除需要由小到大头一个相同的元素
     * @param element 指定的元素
     */
    function removeByElement(element){
        
        var afterRemoveList = []; //移除元素后的容器
        for(var i=0;i<listValue.length;i++){
            if (listValue[i]==element){
                continue;
            }
            afterRemoveList[afterRemoveList.length]=listValue[i];
        }
        listValue = afterRemoveList;
    }
    
    /**
     * 通过元素序号移除指定元素
     * @param index 元素序号
     */
    function removeByIndex(index){
        //元素索引数字
        var indexInt;
        try{
            indexInt = parseInt(index);
        }catch(e){
            return;
        }
        var afterRemoveList = []; //移除元素后的容器
        for(var i=0;i<listValue.length;i++){
            if (i==indexInt){
                continue;
            }
            afterRemoveList[afterRemoveList.length]=listValue[i];
        }
        listValue = afterRemoveList;
    }
    
    /**
     * 获取元素值
     * @param index 元素索引
	 * @param notNull 如果返回值为空，则返回空字符串
     * @return 返回对应元素
     */
    function getElement(index,notNull){
        //元素索引数字
        var indexInt;
        try{
            indexInt = parseInt(index);
        }catch(e){
			if(notNull){
				return "";
			}
            return null;
        }
        try{
			//构建返回值
            var res = listValue[index];
			if(notNull && !res){
				return "";
			}
			return res;
        }catch(e){
			if(notNull){
				return "";
			}
            return null;
        }
    }
	
	/**
	 * 将元素替换到指定位置
	 */
	function setElement(index,ele){
        //元素索引数字
        var indexInt;
        try{
            indexInt = parseInt(index);
        }catch(e){
            return;
        }
		if(indexInt<1 || indexInt>=getSize()){
			return;
		}
        listValue[index] = ele;
	}
    
    /**
     * 判断元素是否存在与序列中
     * @param element 带判断元素
     * @return tree存在与序列中
     */
    function containsElement(element){
        for(var i=0;i<listValue.length;i++){
            if (listValue[i]==element){
                return true;
            }
        }
        return false;
    }
    
    /**
     * 获取元素数组
     * @return 元素数组
     */
    function getElementList(){
        return listValue;
    }
    
    
    /**
     * 获取元素字符串序列
     * @return 元素字符串序列
     */
    function getElementString(){
        
        //返回值
        var reStr = "";
        for(var i=0;i<listValue.length;i++){
            if (i>0){
                reStr += ",";
            }
            if (listValue[i]!=null){
                reStr += listValue[i];
            }
        }
        return reStr;
    }
}


/**
 * 解析当前页面动作
 */
function parsePage(debug){
   var params = window.location.href;
   var point = params.indexOf("?");
   if(point>-1){
   		params = params.substring(point+1,params.length);
   }else{
   		params = "";
   }
	var nodes = $("[_execute='js']");
	for(var i=0;i<nodes.length;i++){
		_parseOneNode(nodes[i],params,debug);
	}
}

/**
 * 设置下拉框中的值
 * nodeId 下拉框节点主键或对象
 * debug 是否为调试模式
 */
function setSelect(nodeId,debug){
	var node;
	if(!nodeId){
		return;
	}
	if(typeof(nodeId)=="string"){
		node = $("#"+nodeId);
	}else{
		node = nodeId;
	}
	var action = node.attr("_action");
	if(!action){
		return;
	}
	var params = node.attr("_params");
	if(action.substring(0,1)!="/"){
		action = "/"+action;
	}
	var listKey = node.attr("_listkey");
	var valueKey = node.attr("_valueKey");
	var textKey = node.attr("_textKey");
	
	var point = action.indexOf("?");
	if(point>-1){
		action = action.substring(0,point)+".ha"+action.substring(point,action.length);
	}else{
		action += ".ha";
	}
  	if(debug){
     	alert("URL:"+action); 
		alert("处理前的下拉框：\n"+node.html());
    }
	//获取动作数据
	var data = getJson(action,params,debug);
	if(data==null){
		return;
	}
	node.find("[_data_='1']").remove();
	
	data = data[listKey];
	if(!data){
		return;
	}
	if(data.rs){
		data = data.rs;
	}
	for(var i=0;i<data.length;i++){
		node.append($("<option _data_=\"1\" value=\""+data[i][valueKey]+"\">"+data[i][textKey]+"</option>"));
	}
}

/**
 * 调用指定动作，并将结果信息设置到指定节点中
 * nodeId 需要设置信息的节点主键或者节点对象
 * action 调用的动作路径
 * params 传入参数
 * debug true是否为调试模式
 */
function parseAction(nodeId,action,params,debug){
	var node;
	if(!nodeId){
		return;
	}
	if(typeof(nodeId)=="string"){
		node = $("#"+nodeId);
	}else{
		node = nodeId;
	}
	if(action.substring(0,1)!="/"){
		action = "/"+action;
	}
	var point = action.indexOf("?");
	if(point>-1){
		action = action.substring(0,point)+".ha"+action.substring(point,action.length);
	}else{
		action += ".ha";
	}
  	if(debug){
     	alert("URL:"+action); 
		alert("处理前的HTML模板：\n"+node.html());
    }
	//获取动作数据
	var data = getJson(action,params,debug);
	if(data==null){
		return;
	}
	var dataEle; //数据元素
	var setNode; //需要设置数据的节点
    for(var key in data){
		setNode = node.find("#"+key);
        if(setNode.length<1){
			continue;
		}
		dataEle = data[key];
		if(dataEle["allcount"]){
			//记录集
			_fixIntoRs(setNode,dataEle);
		}else if(typeof(dataEle)=="string"){
			//设置指定值
			_setNodeValue(setNode,dataEle);
		}else{
			//设置详细信息
			var fields = setNode.find("[_field]");
			for(var j=0;j<fields.length;j++){
				_fixIntoField($(fields[j]),dataEle);
			}
		}
    }
  	if(debug){
		alert("处理后的HTML模板：\n"+node.html());
    }
}

/**
 * 解析其中一个节点
 */
function _parseOneNode(node,params,debug){
	node = $(node);
	var action = node.attr("_action");
	if(!action){
		node.hide();
		return;
	}
	if(action.substring(0,1)!="/"){
		action = "/"+action;
	}
	var point = action.indexOf("?");
	if(point>-1){
		action = action.substring(0,point)+".ha"+action.substring(point,action.length);
	}else{
		action += ".ha";
	}
  	if(debug){
     	alert("URL:"+action+"\nparams:"+params); 
		alert("处理前的HTML模板：\n"+node.html());
    }
	//获取动作数据
	var data = getJson(action,params,debug);
	if(data==null){
		return;
	}
	var dataEle; //数据元素
	var setNode; //需要设置数据的节点
    for(var key in data){
		setNode = node.find("#"+key);
        if(setNode.length<1){
			continue;
		}
		dataEle = data[key];
		if(dataEle["allcount"]){
			//记录集
			_fixIntoRs(setNode,dataEle);
		}else if(typeof(dataEle)=="string"){
			//设置指定值
			_setNodeValue(setNode,dataEle);
		}else{
			//设置详细信息
			var fields = setNode.find("[_field]");
			for(var j=0;j<fields.length;j++){
				_fixIntoField($(fields[j]),dataEle);
			}
		}
    }
  	if(debug){
		alert("处理后的HTML模板：\n"+node.html());
    }
}


/**
 * 设置记录集到指定节点中
 */
function _fixIntoRs(rsNode,rsData){
	//移除上一次查询的数据（如果存在的话）
	rsNode.find("#tr_data").remove();
	
	//行记录模板
	var trMode = rsNode.find("#tr");
	trMode.hide();
	trMode = trMode.clone();
	trMode.show();
	trMode.attr("id","tr_data");
	
	//记录集
	var rsList = rsData["rs"];
	if(!rsList ||  !rsList.length || rsList.length<1){
		return;
	}
	rsNode.find("#_nodata").remove();
	var tr;
	var fields;
	for(var i=0;i<rsList.length;i++){
		tr = trMode.clone();
		fields = tr.find("[_field]");
		for(var j=0;j<fields.length;j++){
			_fixIntoField($(fields[j]),rsList[i]);
		}
		rsNode.append(tr);
	}
}

/**
 * 将指定数据节点中设置对应的值
 */
function _fixIntoField(fNode,dataMap){
	if(fNode.length<1){
		return;
	}
	var fieldIds = (""+fNode.attr("_field")).split(",");
	var value;
	for(var i=0;i<fieldIds.length;i++){
		if(fieldIds[i]==null || fieldIds[i]==""){
			continue;
		}
		value = dataMap[fieldIds[i]];
		_setNodeValue(fNode,value,i+1);
	}
}

/**
 * 设置指定节点值
 */
function _setNodeValue(fNode,value,index){
	if(fNode.length<1){
		return;
	}
	var nodeName = fNode[0].nodeName;
	if(nodeName){
		nodeName = nodeName.toLowerCase();
	}else{
		nodeName = "";
	}
	if(index==null){
		index = 1;
	}
	var keyWord = fNode.attr("_keyword");
	if(!keyWord){
		keyWord = fNode.attr("_keyword"+index);
	}
	var setValueAttr;
	var checkType = fNode.attr("_checktype");
	if(!checkType){
		setValueAttr = fNode.attr("_checktype"+index);
	}
	if(!checkType){
		checkType = fNode.attr("_check");
	}
	if(!checkType){
		setValueAttr = fNode.attr("_check"+index);
	}
	value = _checkValue(checkType,value,fNode);
	
	setValueAttr = fNode.attr("_set");
	if(!setValueAttr){
		setValueAttr = fNode.attr("_set"+index);
	}
	if(setValueAttr){
		if(keyWord){
			value = (""+fNode.attr(setValueAttr)).replace(keyWord,value);
		}
		fNode.attr(setValueAttr,value);
	}else{
		if(nodeName=="input"){
			var atype = fNode.attr("type");
			if(atype){
				atype = atype.toLowerCase();
			}else{
				atype = "text";
			}
			if(atype=="image"){
				fNode.attr("src",value);
			}else if(atype=="checkbox" || atype=="radio"){
				if(fNode.attr("value")==value){
					fNode.attr("checked","checked");
				}else{
					fNode.attr("checked","");
				}
			}else{
				if(keyWord){
					value = (""+fNode.attr("value")).replace(keyWord,value);
				}
				fNode.attr("value",value);
			}
		}else if(nodeName=="select"){
			setSelect(fNode); //设置下拉框的值
			//下拉框
			var options = fNode.find("option");
			var opt;
			for(var j=0;j<options.length;j++){
				opt = $(options[j]);
				if(opt.attr("value")==value){
					opt.attr("selected","selected");
					break;
				}
			}
		}else{
			if(keyWord){
				value = (""+fNode.text()).replace(keyWord,value);
			}
			fNode.text(value);
		}
	}
}


/**
 * 根据判断处理值
 */
function _checkValue(checkType,value,node){
	if(!checkType){
		return value;
	}
	if(value==null){
		value = "";
	}
	if (checkType=="date") {
		//只显示年月日
		if (value) {
			value = formatDate(value,"yyyy-mm-dd");
		}
	}else if(startsWith(checkType,"date:[")) {
		//按照指定格式输出年月日
		var format = checkType.substring(6,checkType.length);
		var point = format.lastIndexOf("]"); //分隔符
		if(point>0) {
			format = format.substring(0,point);
		}
		format = trim(format);
		value = formatDate(value,format);
	}else if(checkType=="trim"){
		//去掉首尾空格
		value = trim(value);
	}else if(checkType=="showint"){
		//格式化整型数据  3,124,344,123
		value = addCommas(value);
	}else if(checkType=="time") {
		//只显示小时分秒
		if (value) {
			value = formatDate(value,"hh:mm:ss");
		}
	}else if(checkType=="datemd") {
		//只显示月日
		if (value) {
			value = formatDate(value,"mm-dd");
		}
	}else if(checkType.indexOf("switch:")==0) {
		//根据数据值，按照约定替换为指定字符
		//1:是;2:否
		checkType = checkType.substring(7,checkType.length);
		//获取对照表
		var infoMap = fixStringToMap(checkType,";",":");
		if(infoMap.containsKey(value)){
			value = infoMap.get(value);
		}
	}else if (checkType.indexOf("cut:")==0) {
		//cut:20:...   截取前20个字符，并且在尾部加...
		checkType = checkType.substring(4,checkType.length);
		var fength = checkType.indexOf(":");
		//附加字符串
		var addStr = null;
		if (toLength<0) {
			toLength = checkType.length;
			addStr = "";
		}else {
			addStr = checkType.substring(toLength+1,checkType.length);
		}
		//获取截取长度
		var cutPoint = parseInt(checkType.substring(0,toLength));
		//切除超出范围的字符(切除内容不包含html)
		value = cutHtmlString(value,cutPoint,addStr);
	}else if(checkType.indexOf("swap:")==0){
		//swap:3:***** 将结果字符串，从第3个字符后开始的字符，替换成*****
		checkType = checkType.substring(5, checkType.length);
		var toLength = checkType.indexOf(":");
		if(toLength>0) {
			//第n个字符后开始替换
			var startCount = parseInt(checkType.substring(0,toLength));
			checkType = checkType.substring(toLength+1);
			if(value.length>startCount) {
				//整理后的字符串
				var newValue = value.substring(0,startCount);
				value = value.substring(startCount,value.length);
				if(value.length>checkType.length) {
					//实现成 139******001
					value = newValue+checkType+value.substring(checkType.length+value.length);
				}else {
					//长度不够，实现成 139********
					value = newValue+checkType;
				}
			}else {
					//长度完全不够，实现成 **********
                    value = checkType;
			}
		}
	}else if (checkType.indexOf("float:")==0) {
		//处理浮点数  float:16:4  将数字转换为 总长16 小数4位
		//除去float:
		checkType = checkType.substring(6,checkType.length);
		//位置
		var toLength = checkType.indexOf(":");

		var allLength = 0; //整体长度
		var pointLength = 0; //小数点位数
		if (toLength>0) {
			allLength = parseInt(checkType.substring(0,toLength));
			pointLength = parseInt(checkType.substring(toLength+1,checkType.length));
		}else {
			pointLength = parseInt(checkType);
		}
		try {
			value = roundNumber(value,pointLength);
		}catch(e) {
			value = "--";
		}
	}else if(checkType.indexOf("head:")==0) {
		//head:字符串  最终的值为   字符串+字段值
		return checkType.substring(5,checkType.length)+value;
	}else if(checkType.indexOf("foot:")==0) {
		//foot:字符串  最终的值为  字段值+字符串
		return value+checkType.substring(5,checkType.length);
	}else if(checkType=="tohtml") {
		//将文本转换为HTML格式
		return fixHtmlString(value);
	}else if(startsWith(checkType,"if:")) {
		/*
		 * if:value{srcattrib:objattrib}  如果数据值为value，则将srcattrib属性名改为objattrib 
		 * 或者 if:value{hidden}  如果条件成立，就隐藏  
		 * 或者 if:value{!hidden} 如果条件不成立，就隐藏
		 * value 前缀  >  大于value时条件生效
		 *                  < 小于value时条件生效
		 *                  >=  同上，你懂的
		 *                  <= 
		 *                  <>
		 *                  || 被value整除
		 *                  (包含的值，用逗号分割)
		 * 
		 */
		//条件触发
		checkType = checkType.substring(3,checkType.length);
		var point = checkType.lastIndexOf("{"); //检测分隔符
		if(point<0) {
			return null;
		}
		//原属性名
		var srcAttr = checkType.substring(point+1,checkType.length);
		checkType = checkType.substring(0,point);
		//目标属性名
		var objAttr = null;
		point = srcAttr.lastIndexOf("}");
		if(point>0) {
			srcAttr = srcAttr.substring(0,point);
		}
		if(srcAttr.toLowerCase()=="hidden") {
			srcAttr = null;
			objAttr = "hidden";
		}else if(srcAttr.toLowerCase()=="!hidden") {
			srcAttr = "hidden";
			objAttr = null;
		}else {
			point = srcAttr.lastIndexOf(":");
			if(point<0) {
				return null;
			}
			objAttr = srcAttr.substring(point+1,srcAttr.length);
			srcAttr = srcAttr.substring(0,point);
		}
		var checkValue; //检测值
		if(startsWith(checkType,">=")) {
			checkValue = checkType.substring(2,checkType.length);
			if(parseFloat(value)>=parseFloat(checkValue)) {
				if(srcAttr==null) {
					node.hide();
				}else if(objAttr!=null){
					node.removeAttr(objAttr);
					
					node.attr(objAttr,node.attr(srcAttr));
					node.removeAttr(srcAttr);
				}
			}else {
				if(objAttr==null) {
					node.hide();
				}else if(srcAttr!=null) {
					node.removeAttr(srcAttr);
				}
			}
		}else if(startsWith(checkType,"<=")) {
			checkValue = checkType.substring(2,checkType.length);
			if(parseFloat(value)<=parseFloat(checkValue)) {
				if(srcAttr==null) {
					node.hide();
				}else if(objAttr!=null){
					node.removeAttr(objAttr);
					node.attr(objAttr,node.attr(srcAttr));
					node.removeAttr(srcAttr);
				}
			}else {
				if(objAttr==null) {
					node.hide();
				}else if(srcAttr!=null) {
					node.removeAttr(srcAttr);
				}
			}
		}else if(startsWith(checkType,"<")) {
			checkValue = checkType.substring(1,checkType.length);
			if(parseFloat(value)<parseFloat(checkValue)) {
				if(srcAttr==null) {
					node.hide();
				}else if(objAttr!=null){
					node.removeAttr(objAttr);
					node.attr(objAttr,node.attr(srcAttr));
					node.removeAttr(srcAttr);
				}
			}else {
				if(objAttr==null) {
					node.hide();
				}else if(srcAttr!=null) {
					node.removeAttr(srcAttr);
				}
			}
		}else if(startsWith(checkType,">")) {
			checkValue = checkType.substring(1,checkType.length);
			if(parseFloat(value)>parseFloat(checkValue)) {
				if(srcAttr==null) {
					node.hide();
				}else if(objAttr!=null){
					node.removeAttr(objAttr);
					node.attr(objAttr,node.attr(srcAttr));
					node.removeAttr(srcAttr);
				}
			}else {
				if(objAttr==null) {
					node.hide();
				}else if(srcAttr!=null) {
					node.removeAttr(srcAttr);
				}
			}
		}else if(startsWith(checkType,"==")) {
			checkValue = checkType.substring(2,checkType.length);
			if(value==checkValue) {
				if(srcAttr==null) {
					node.hide();
				}else if(objAttr!=null){
					node.removeAttr(objAttr);
					node.attr(objAttr,node.attr(srcAttr));
					node.removeAttr(srcAttr);
				}
			}else {
				if(objAttr==null) {
					node.hide();
				}else if(srcAttr!=null) {
					node.removeAttr(srcAttr);
				}
			}
		}else if(startsWith(checkType,"=")) {
			checkValue = checkType.substring(1,checkType.length);
			if(value==checkValue) {
				if(srcAttr==null) {
					node.hide();
				}else if(objAttr!=null){
					node.removeAttr(objAttr);
					node.attr(objAttr,node.attr(srcAttr));
					node.removeAttr(srcAttr);
				}
			}else {
				if(objAttr==null) {
					node.hide();
				}else if(srcAttr!=null) {
					node.removeAttr(srcAttr);
				}
			}
		}else if(startsWith(checkType,"||")) {
			//是否能被整除
			checkValue = checkType.substring(2,checkType.length);
			var testInt1 = parseInt(value);
			var testInt2 = parseInt(checkValue);
			//整除值
			var testInt = testInt1/testInt2;
			if(testInt1==(testInt2*testInt)) {
				if(srcAttr==null) {
					node.hide();
				}else if(objAttr!=null){
					node.removeAttr(objAttr);
					node.attr(objAttr,node.attr(srcAttr));
					node.removeAttr(srcAttr);
				}
			}else {
				if(objAttr==null) {
					node.hide();
				}else if(srcAttr!=null) {
					node.removeAttr(srcAttr);
				}
			}
		}else if(startsWith(checkType,"(")) {
			//是否包含指定值
			checkValue = checkType.substring(1,checkType.length);
			point = checkValue.lastIndexOf(")");
			if(point<0) {
				return null;
			}
			//包含值序列
			var checkList = new ValueList();
			checkList.setArray(checkValue.substring(0,point).split(","));
			
			if(checkList.contains(value)) {
				if(srcAttr==null) {
					node.hide();
				}else if(objAttr!=null){
					node.removeAttr(objAttr);
					node.attr(objAttr,node.attr(srcAttr));
					node.removeAttr(srcAttr);
				}
			}else {
				if(objAttr==null) {
					node.hide();
				}else if(srcAttr!=null) {
					node.removeAttr(srcAttr);
				}
			}
		}else {
			if(value==checkType) {
				if(srcAttr==null) {
					node.hide();
				}else if(objAttr!=null){
					node.removeAttr(objAttr);
					node.attr(objAttr,node.attr(srcAttr));
					node.removeAttr(srcAttr);
				}
			}else {
				if(objAttr==null) {
					node.hide();
				}else if(srcAttr!=null) {
					node.removeAttr(srcAttr);
				}
			}
		}
		return null;
	}
	return value;
}



/**
 * 按照指定格式，输出日期时间
 * 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符， 
 * 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字) 
 * yyyy-MM-dd hh:mm:ss.S
 */
function formatDate(dateStr,fmt) {
	var d = new Date(dateStr);
    var o = {
        "M+": d.getMonth() + 1, //月份 
        "d+": d.getDate(), //日 
        "h+": d.getHours(), //小时 
        "m+": d.getMinutes(), //分 
        "s+": d.getSeconds(), //秒 
        "q+": Math.floor((d.getMonth() + 3) / 3), //季度 
        "S": d.getMilliseconds() //毫秒 
    };
    if (/(y+)/.test(fmt)){
		fmt = fmt.replace(RegExp.$1, (d.getFullYear() + "").substr(4 - RegExp.$1.length));
	}
    for (var key in o){
		if (new RegExp("(" + key + ")").test(fmt)){
			fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[key]) : (("00" + o[key]).substr(("" + o[key]).length)));
		}
	}
    return fmt;
}


/**
 * 去字符串左侧空格
 */
function ltrim(s){
	return s.replace( /^\s*/, "");
}

/**
 * 去字符串右侧空格
 */
function rtrim(s){
	return s.replace( /\s*$/, "");
}

/**
 * 去字符串两侧空格
 */
function trim(s){
	return rtrim(ltrim(s));
}

/**
 * 判断字符串开头是否相同
 * 指定字符串
 * 待判断字符串
 */
/**
 * 判断字符串开头是否相同
 * 指定字符串
 * 待判断字符串
 */
function startsWith(str,substring) {
	if(str==null || substring==null){
		return false;
	}
	if(str.length==substring.length){
		if(str==substring){
			return true;
		}
		return false;
	}
	if(str.substring(0,substring.length)==substring){
		return true;
	}
	return false;
}
 
/**
 * 判断字符串末尾是否相同
 * 指定字符串
 * 待判断字符串
 */
function endsWith(str,substring){
	if(str==null || substring==null){
		return false;
	}
	if(str.length==substring.length){
		if(str==substring){
			return true;
		}
		return false;
	}
	if(str.substring(str.length-substring.length,str.length)==substring){
		return true;
	}
	return false;
}


/**
 * 数字fgNum位分割
 */
function addCommas(nStr,fgNum){
	if(fgNum==null){
		fgNum = 3;
	}
	nStr += '';
	x = nStr.split('.');
	x1 = x[0];
	x2 = x.length > 1 ? '.' + x[1] : '';
	var rgx = eval("/(\\d+)(\\d{"+fgNum+"})/");
	while (rgx.test(x1)) {
		x1 = x1.replace(rgx, '$1' + ',' + '$2');
	}
	return x1 + x2;
}

/**
 * 将字符串分割为Map格式
 * @param str              字符串    1:是;0:否;:否
 * @param eleSpec     元素分隔符 ;
 * @param keySpec     信息分隔符
 * @return 整理后的容器
 * 2014年3月29日
 * @author 马宝刚
 */
function fixStringToMap(str,eleSpec,keySpec) {
	//构建返回值
	var reMap = new ValueMap();
	if(!str) {
		return reMap;
	}
	str = trim(str);
	if(str.length<1) {
		return reMap;
	}
	//将字符串分割为元素数组
	var eles = str.split(eleSpec);
	var infos = null; //元素信息
	for(var i=0;i<eles.length;i++) {
		infos = eles[i].split(keySpec);
		if(infos.length>1) {
			reMap.put(infos[0],infos[1]);
		}
	}
	return reMap;
}



/**
 * 限制字符串长度（不算html代码）
 * 
 * @author 刘虻 2007-10-15下午08:02:28
 * @param source 源html字符串
 * @param cutSize 限制长度
 * @param footStr 限制后附加字符串
 * @return 处理后的字符串
 */
function cutHtmlString(source,cutSize,footStr) {
	if (!source) {
		return "";
	}
	if (!footStr) {
		footStr = "";
	}
	var length = source.length;
	if (length <= cutSize) {
		return source;
	}
	if (source.indexOf("<") < 0) {
		return source.substring(0, cutSize) + footStr;
	}
	var readPoint = 0;
	// 构造返回值
	var reSbf = "";
	var isAppend = true; // 是否累加
	var notAppendFoot = true; // 是否没放入尾部
	var insideTag = false; // 是否为标签内部
	var onOutTag = false; // 是否为结束字符
	for (var i=0; i<length; i++) {
		// 获取一个字符
		var oneChar = source.substring(i,i+1);
		if (oneChar=="<") {
			insideTag = true;
		}else if(oneChar==">") {
			insideTag = false;
			onOutTag = true;
		}else if(!insideTag) {
			readPoint++;
		}
		if(readPoint>cutSize) {
			if (insideTag) {
				isAppend = true;
			} else {
				isAppend = false;
			}
			if (notAppendFoot) {
				reSbf+=footStr;
				notAppendFoot = false;
			}
		}
		if (isAppend || onOutTag) {
			if (onOutTag) {
				onOutTag = false;
			}
			reSbf+=oneChar;
		}
	}
	return reSbf.replace("<br/>", "").replace("<br>", "");
}

/**
 * 处理小数点位数
 */
function roundNumber(number,decimals) {
	number = parseFloat(number);
    var newString;// The new rounded number  
    decimals = Number(decimals);  
    if (decimals < 1) {  
        newString = (Math.round(number)).toString();  
    } else {  
        var numString = number.toString();  
        if (numString.lastIndexOf(".") == -1) {// If there is no decimal point  
            numString += ".";// give it one at the end  
        }  
        var cutoff = numString.lastIndexOf(".") + decimals;// The point at which to truncate the number  
        var d1 = Number(numString.substring(cutoff,cutoff+1));// The value of the last decimal place that we'll end up with  
        var d2 = Number(numString.substring(cutoff+1,cutoff+2));// The next decimal, after the last one we want  
        if (d2 >= 5) {// Do we need to round up at all? If not, the string will just be truncated  
            if (d1 == 9 && cutoff > 0) {// If the last digit is 9, find a new cutoff point  
                while (cutoff > 0 && (d1 == 9 || isNaN(d1))) {  
                    if (d1 != ".") {  
                        cutoff -= 1;  
                        d1 = Number(numString.substring(cutoff,cutoff+1));  
                    } else {  
                        cutoff -= 1;  
                    }  
                }  
            }  
            d1 += 1;  
        }   
        if (d1 == 10) {  
            numString = numString.substring(0, numString.lastIndexOf("."));  
            var roundedNum = Number(numString) + 1;  
            newString = roundedNum.toString() + '.';  
        } else {  
            newString = numString.substring(0,cutoff) + d1.toString();  
        }  
    }  
    if (newString.lastIndexOf(".") == -1) {// Do this again, to the new string  
        newString += ".";  
    }  
    var decs = (newString.substring(newString.lastIndexOf(".")+1)).length;  
    for(var i=0;i<decimals-decs;i++) newString += "0";  
    //var newNumber = Number(newString);// make it a number if you like  
    document.roundform.roundedfield.value = newString; // Output the result to the form field (change for your purposes)  
}  

/**
 * 处理html内容 将敏感字符替换成安全字符
 * @author 刘虻 2007-10-17下午05:53:03
 * @param html 源html内容
 * @return 处理后的html内容
 */
function fixHtmlString(html) {
	if (!html) {
		return "";
	}
	return html.replace("(\\&)", "&amp;").replace("(\\#)", "&#35;")
			.replace("(\\?)", "&#63;").replace("(\\%)", "&#37;")
			.replace("(?i)<", "&lt;").replace("(?i)>", "&gt;")
			.replace("(?i) ", "&nbsp;")
			.replace("(?i)\\r\\n", "<br />")
			.replace("(?i)\\r", "<br />")
			.replace("(?i)\\n", "<br />");
}

function FormatNumber(srcStr,nAfterDot)       
       {
        var srcStr,nAfterDot;
        var resultStr,nTen;
        srcStr = ""+srcStr+"";
        strLen = srcStr.length;
        dotPos = srcStr.indexOf(".",0);
        if (dotPos == -1){
       resultStr = srcStr+".";
       for (i=0;i<nAfterDot;i++){
       resultStr = resultStr+"0";
}
        return resultStr;
}
else{
        if ((strLen - dotPos - 1) >= nAfterDot){
        nAfter = dotPos + nAfterDot + 1;
        nTen =1;
        for(j=0;j<nAfterDot;j++){
        nTen = nTen*10;
}
        resultStr = Math.round(parseFloat(srcStr)*nTen)/nTen;
}
else{
        resultStr = srcStr;
       for (i=0;i<(nAfterDot - strLen + dotPos + 1);i++){
        resultStr = resultStr+"0";
}
        return resultStr;
}
        }
        } 
		function tsleep(numberMillis){
			
			var now = new Date(); 
			var exitTime = now.getTime() + numberMillis; 
			while (true) { 
			now = new Date(); 
			if (now.getTime() > exitTime) 
			return; 
			} 
		} 
		
 