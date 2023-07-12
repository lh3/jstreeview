/*
 * Pop-it menu- Dynamic Drive (www.dynamicdrive.com). This notice MUST
 * stay intact for legal use Visit http://www.dynamicdrive.com/ for full
 * source code.
 */

document.write('<style type="text/css"><!-- \
	#popdiv { \
	  position: absolute; \
	  background-color: #F8F8F8; \
	  border: 1px solid #CCC; \
	  color: #1C94C4; \
	  font: 12px "Lucida Grande", "Lucida Sans Unicode", Sans-serif, Arial; \
	  line-height: 18px; \
	  z-index: 100; \
	  visibility: hidden; \
	} \
	#popdiv a { \
	  text-decoration: none; \
	  padding-left: 6px; \
	  font-weight: bold; \
	  color: #1C94C4; \
	  border: 1px solid #F8F8F8; \
	  display: block; \
	} \
	#popdiv a:hover { \
	  color: #C77405; \
	  background-color: #FDF9E1; \
	  border: 1px solid #FBCB09; \
	} \
	#popdiv h4 { \
	  color: white; \
	  background: #F7B54A; \
	  text-align: center; \
	  font: 13px; \
	  font-weight: bold; \
	  margin: 0em; \
	} \
	#popdiv input { \
	  border: 1px solid #FBCB09; \
	} \
    #popdiv table { \
	  font: 12px "Lucida Grande", "Lucida Sans Unicode", Sans-serif, Arial; \
	  color: #1C94C4; \
	  border-spacing: 0px; \
	  width: 100%; \
    } \
--></style>');

var listenEvent = function(o, e, f) {
	if (o.addEventListener) o.addEventListener(e, f, false);
	else o.attachEvent('on'+e, f);
}

var popmenu = new function() {
	var ie = document.all && !window.opera;
	var timeout, pmo = null, timeBeg;
	var w3c_contains = function(a, b) { // Determines if 1 element in contained in another- by Brainjar.com	
		while (b.parentNode)
			if ((b = b.parentNode) == a)
				return true;
		return false;
	};
	this.createMenu = function() {
		pmo = document.createElement("div");
		pmo.setAttribute("id", "popdiv");
		pmo.onmouseover = popmenu.clear;
		listenEvent(pmo, 'mouseout', popmenu.autoHide);
		document.body.appendChild(pmo);
	}
	this.clear = function() { if (timeout) clearTimeout(timeout); };
	this.hide = function() { if (pmo) pmo.style.visibility = "hidden"; };
	this.delayedHide = function() { timeout = setTimeout("popmenu.hide()", 500); };
	this.clickHide = function(e) {
		if (timeBeg && (new Date().getTime()) - timeBeg > 500 && pmo
			&& (e.pageX < pmo.offsetLeft || e.pageX > pmo.offsetLeft + pmo.offsetWidth
				|| e.pageY < pmo.offsetTop || e.pageY > pmo.offsetTop + pmo.offsetHeight))
			popmenu.hide(e);
	};
	this.autoHide = function(e) {
		if (ie && !pmo.contains(e.toElement)) popmenu.hide();
		else if (e.currentTarget != e.relatedTarget && !w3c_contains(e.currentTarget, e.relatedTarget))
			popmenu.hide();
	};
	this.show = function(e, which, optWidth) {
		var ieo = (document.compatMode && document.compatMode.indexOf("CSS")!=-1)?
			document.documentElement : document.body;
		this.clear();
		if (pmo == null) this.createMenu();
		pmo.innerHTML = which;
		pmo.style.width = (typeof optWidth != "undefined")? optWidth : "150px";
		eventX = ie? event.clientX : e.clientX;
		eventY = ie? event.clientY : e.clientY;
		// Find out how close the mouse is to the corner of the window
		var rightedge = ie? ieo.clientWidth - eventX : window.innerWidth - eventX;
		var bottomedge = ie? ieo.clientHeight - eventY : window.innerHeight - eventY;
		// if the horizontal distance isn't enough to accomodate the width of the context menu
		if (rightedge < pmo.offsetWidth) // then move the horizontal position of the menu to the left by it's width
			pmo.style.left = (ie? ieo.scrollLeft : window.pageXOffset) + eventX - pmo.offsetWidth + "px";
		else // then position the horizontal position of the menu where the mouse was clicked
			pmo.style.left = (ie? ieo.scrollLeft : window.pageXOffset) + eventX + "px";
		//same concept with the vertical position
		if (bottomedge < pmo.offsetHeight)
			pmo.style.top = (ie? ieo.scrollTop : window.pageYOffset) + eventY - pmo.offsetHeight + "px";
		else pmo.style.top = (ie? ieo.scrollTop : window.pageYOffset) + eventY + "px";
		pmo.style.visibility = "visible";
		timeBeg = new Date().getTime();
	}
}

listenEvent(window, 'click', popmenu.clickHide);
