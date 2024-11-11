var fps           = 60;

window.raf = (function(){
  return requestAnimationFrame || webkitRequestAnimationFrame || mozRequestAnimationFrame || function(c){setTimeout(c,1000/fps);};
})();
/*--------------=== Slot machine definition ===--------------*/
(function() {
  var NAME        = "SlotMachine",
  defaultSettings = {
    width           : "450",
    height          : "450",
    colNum          : 3,
    rowNum          : 9,
    winRate         : 5, //out of 100
    autoPlay        : true,
    autoSize        : false,
    autoPlayTime    : 10,
    layout          : 'compact',
    handleShow      : true,
    handleWidth     : 35,
    handleHeight    : 30,
    machineBorder   : 15,
    machineColor    : 'rgba(120,60,30,1)',
    names           : [
      "Ak",
      "Aug",
      "Dragon-lore",
      "Glock",
      "Gungnir",
      "Karambit",
      "Knife",
      "m4",
      "mac10"
    ]
  },
  completed       = true,
  isShuffle       = true,
  supportTouch    = 'ontouchstart' in window || navigator.msMaxTouchPoints,
  firstTime       = true,
  nextLoop        = null ;
  SlotMachine = function (argument) {
    this.init = this.init.bind(this);
    this.run = this.run.bind(this);
    this.addListener = this.addListener.bind(this);
    this.beforeRun = this.beforeRun.bind(this);
    this.afterRun = this.afterRun.bind(this);
    this.showWin = this.showWin.bind(this);
    this.rotateHandle = this.rotateHandle.bind(this);
    this.colArr = [];
    this.options = {};
  }
  document.getElementById('handleBar').addEventListener('click', function(){
    SlotMachine.prototype.rotateHandle()
    SlotMachine.prototype.run()
    })
    
  SlotMachine.prototype.beforeRun = function(){    
    if (completed) {
      this.showWin(false);
      completed = false;
      var result = null;
      result = this.options.names[random(this.options.rowNum*100/this.options.winRate)|0];//set winrate
      for(var i=0;i<this.options.colNum;i++){
        this.colArr[i].beforeRun(result);
      }      
    //this.handle()
    
      
    }    
    this.run();
    
  }
  SlotMachine.prototype.afterRun = function(){
    completed = true;
    var results = [],win=true;
    for(var i=0;i<this.options.colNum;i++){
      results.push(this.colArr[i].getResult());
      if (i>0 && results[i]!=results[i-1]) {
        win = false;
        break;
      }
    }
    if(win){
      this.showWin(true);
      
    }
  }
  SlotMachine.prototype.rotateHandle = function(){
    var handle = document.querySelector(".handle");
    if (handle) {
      handle.addClass("active");
      setTimeout(function(){
        handle.removeClass("active");
      },1000); 
    }
  }
  SlotMachine.prototype.run = function(){    
    var done = true;    
    for(var i=0;i<this.options.colNum;i++){
      done &= this.colArr[i].run();
    }
    if (!done) raf(this.run)
    else this.afterRun();
  }

  SlotMachine.prototype.showWin = function(show){
    var winner = document.querySelector(".winner");
    if (winner) winner.className= show ? "winner active" : "winner";
  }
  SlotMachine.prototype.init = function(){
    //reset all
    completed = true;
    clearTimeout(nextLoop);
    //get settings
    var BannerFlow = arguments[0],
        settingStyle = "",
        machine = document.querySelector(".machine"),
        container = document.querySelector(".container");
    machine.style.opacity = 0;
    for(var key in defaultSettings) {
      this.options[key] = defaultSettings[key];
    }
    if (BannerFlow!==undefined){
      var settings = BannerFlow.settings;
      this.options.winRate = settings.winRate ? settings.winRate : defaultSettings.winRate;
      this.options.autoPlay = settings.autoPlay;
      this.options.colNum = settings.numberColumn ? settings.numberColumn : defaultSettings.colNum;
      this.options.layout = settings.layout ? settings.layout : defaultSettings.layout;
      this.options.machineColor = settings.machineColor ? settings.machineColor : defaultSettings.machineColor;
      this.options.machineBorder = settings.machineBorder>=0 ? settings.machineBorder : defaultSettings.machineBorder;
      this.options.height = settings.height ? settings.height : defaultSettings.height;
      this.options.width = settings.width ? settings.width : defaultSettings.width;
      this.options.autoSize = settings.autoSize;            
      if (this.options.autoSize) {
        this.options.height = window.innerHeight;
        this.options.width = window.innerWidth;
      }
      this.options.handleShow = settings.handleShow;
      this.options.handleWidth = this.options.handleShow ? defaultSettings.handleWidth : 0;      
      this.options.autoPlayTime = settings.autoPlayTime ? settings.autoPlayTime : defaultSettings.autoPlayTime;
      this.options.customImage = settings.customImage;
    }
    //apply settings
    if (this.options.customImage){
      var urls = BannerFlow.text.strip().split(",");
      this.options.names = [];
      for(var i=0;i<urls.length;i++){
        var name = "image-"+i ; urls[i];
        this.options.names.push(name);
        settingStyle += getStyle("."+name+":after",{
          "background-image"  : "url('"+urls[i]+"')"
        });
      }      
    }
    
    var winnerSize = 1.2*Math.max(this.options.height,this.options.width);
    settingStyle += getStyle(".winner:before,.winner:after",{
      "height"              : winnerSize+"px",
      "width"               : winnerSize+"px",
      "top"                 : (this.options.height-winnerSize)/2 - 20 + "px",
      "left"                : (this.options.width-winnerSize)/2 - this.options.handleWidth + "px"
    });
    settingStyle += getStyle(".handle",{
      "margin-top"          : this.options.height/2-this.options.handleHeight+"px"
    });
    document.querySelector("#setting").innerHTML = settingStyle;    
    //remove old cols
    if (this.colArr && this.colArr.length > 0)
      for (var i=0;i<this.colArr.length;i++){
        container.removeChild(this.colArr[i].getDOM());
      }
    this.colArr = [];
    // add new cols
    for(var i=0;i<this.options.colNum;i++){
      var col = new SlotColumn();
      col.init(this.options.names.slice(0,this.options.rowNum),isShuffle);
      this.colArr.push(col);
      document.querySelector(".container").appendChild(col.getDOM());
    }
    machine.style.opacity = "1";
  }

  SlotMachine.prototype.addListener = function(){
    var BannerFlow=arguments[0],timer,
        that = this ,
        container = document.querySelector(".container");
    if (typeof BannerFlow!= 'undefined') {
      // BannerFlow event
      BannerFlow.addEventListener(BannerFlow.RESIZE, function() {
        //clearTimeout(timer);
        //timer = setTimeout(function(){that.init(BannerFlow);that.beforeRun()},500);
      });
      BannerFlow.addEventListener(BannerFlow.CLICK, function() {
        that.beforeRun();
      });
    } else {
      // Window event
      window.addEventListener('resize', function(){
        //clearTimeout(timer);
        //timer = setTimeout(function(){that.init(BannerFlow);that.beforeRun()},500)
      });
      if (supportTouch) {
        window.addEventListener("touchstart",function(){
          that.beforeRun();
        });
      } else {
        window.addEventListener("click",function(){
          that.beforeRun();
        });
      }
    }
    var slotTrigger = document.querySelector("#slot-trigger");
    if (slotTrigger) {
      slotTrigger.addEventListener("click",function(e){
        this.addClass('slot-triggerDown');
      })
    }    
  }
  window[NAME]= SlotMachine;
})();
/*--------------=== Slot Column definition ===--------------*/
(function(){
  var NAME = "SlotColumn";
  SlotColumn = function(){
    this.col = document.createElement("div");
    this.col.className = "col";
    this.init = this.init.bind(this);
    this.run = this.run.bind(this);
    this.beforeRun = this.beforeRun.bind(this);
    this.getResult = this.getResult.bind(this);
    this.getDOM = this.getDOM.bind(this);
    this.arr = [];
    this.colHeight=this.rowHeight=0;
    this.loop = 2;
  }
  SlotColumn.prototype.init = function(){
    this.col.empty();
    this.arr=arguments[0];
    var isShuffle=arguments[1];
    if(isShuffle) shuffle(this.arr);
    for(var i=0; i<this.arr.length*this.loop;i++){
      var row = document.createElement("div");
      row.className = "row "+this.arr[i%this.arr.length];
      this.col.appendChild(row);
    }
    this.top = 0;
  }
  SlotColumn.prototype.beforeRun = function(){
    this.halfHeight = this.col.offsetHeight/this.loop;
    this.colHeight = this.col.scrollHeight/2;
    this.rowHeight = this.colHeight/this.arr.length;
    this.nextResult = arguments[0];
    var next = this.arr.indexOf(this.nextResult);
    if (next==-1) next=random(0,this.arr.length-1)|0;
    var s = this.top + (random(2,10)|0)*this.colHeight + ((next+0.5)*this.rowHeight|0) - this.halfHeight;
    var n = (random(2,6)|0) * fps;
    this.speed = 2*s/(n+1);
    this.acceleration = this.speed/n;
  }
  SlotColumn.prototype.getResult = function(){
    var result = Math.ceil(((this.halfHeight-this.top)%this.colHeight)/this.rowHeight)-1;
    //console.log(this.top,result,this.arr[result],this.halfHeight,this.colHeight,this.rowHeight);
    return this.arr[result];
  }
  SlotColumn.prototype.run = function(){
    if(this.speed <= 0) return true;//completed
    this.top = (this.top - this.speed) % this.colHeight;
    this.speed -= this.acceleration;
    this.top %= this.colHeight;
    this.col.style.transform = "translateY("+this.top+"px)";
    return false;//not completed
  }
  SlotColumn.prototype.getDOM = function(){
    return this.col;
  }
  window[NAME] = SlotColumn;
}());
/*--------------=== Utils definition ===--------------*/
//random in range
var random = function(){
  var isNumeric = function(n){return !isNaN(parseFloat(n)) && isFinite(n)},
      val = Math.random(),
      arg = arguments;
  return isNumeric(arg[0]) ? isNumeric(arg[1]) ? arg[0] + val*(arg[1] - arg[0]) : val*arg[0] : val;
};
//shuffle an array
var shuffle = function(arr){
  var j,tmp;
  for(var i=0;i<arr.length;i++){
    j = random(arr.length)|0;
    tmp = arr[i];arr[i]=arr[j];arr[j]=tmp;
  }
}
//get CSS3 style
var setStyleCss3 = function (object, key, value) {
  object.style['-webkit-'+ key] = value;
  object.style['-moz-'+key] = value;
  object.style['-ms-'+key] = value;
  object.style[key] = value;
}
//get name from url
var getNameFromUrl = function(url){
  if (url) {
    var s=url.lastIndexOf("/")+1,e =url.lastIndexOf(".");
    return s<e ? url.substring(s,e) : "";
  }
  return "";
}
//get style from object style
var getStyle = function(selector,styleObj){
  var isAttribute = false;
  var newStyle = selector+"{";
  for(var attr in styleObj) {
    if (styleObj[attr]) {
      isAttribute = true;
      newStyle += attr+" : "+styleObj[attr]+";";
    }
  }
  newStyle+="}";
  return isAttribute ? newStyle : "";
}
// get lighter color from rgba colors
var getLighter = function(rgba){
  var o = /[^,]+(?=\))/g.exec(rgba)[0]*0.75;
  return rgba.replace(/[^,]+(?=\))/g,o);
}
//remove html from text
if (!String.prototype.strip) {
    String.prototype.strip = function() {
        return this.replace(/(<[^>]+>)/ig," ").trim();
    }
}
//remove all child node
if (!Node.prototype.empty) {
    Node.prototype.empty = function(){
        while (this.firstChild) {
            this.removeChild(this.firstChild);
        }
    }
}
if (!HTMLElement.prototype.hasClass) {
    Element.prototype.hasClass = function(c) {
        return (" "+this.className+" ").replace(/[\n\t]/g, " ").indexOf(" "+c+" ") > -1;
    }
}
if (!HTMLElement.prototype.addClass) {
    HTMLElement.prototype.addClass = function(c) {
        if (!this.hasClass(c)) this.className += (" " +c);
        return this;
    }
}
if (!HTMLElement.prototype.removeClass) {
    HTMLElement.prototype.removeClass = function(c) {
        if (this.hasClass(c)) this.className = (" "+this.className+" ").replace(" "+c+" "," ").trim();
        return this;
    }
}



/*--------------=== Main function ===--------------*/
var timer,widget = null;
 {
  window.addEventListener("load",function(e){
    if (widget==null) {
      widget = new SlotMachine();
      widget.addListener();
      widget.init();
    widget.beforeRun();
    }
    
  })
}