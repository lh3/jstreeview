/* The MIT License

   Copyright (c) 2023- Dana-Farber Cancer Institute
                 2010 Broad Institute
                 2008 Genome Research Ltd (GRL)

   Permission is hereby granted, free of charge, to any person obtaining
   a copy of this software and associated documentation files (the
   "Software"), to deal in the Software without restriction, including
   without limitation the rights to use, copy, modify, merge, publish,
   distribute, sublicense, and/or sell copies of the Software, and to
   permit persons to whom the Software is furnished to do so, subject to
   the following conditions:

   The above copyright notice and this permission notice shall be
   included in all copies or substantial portions of the Software.

   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
   EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
   MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
   NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
   BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
   ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
   CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
   SOFTWARE.
*/

// Author: Heng Li <lh3@me.com>

/*
  A phylogenetic tree is parsed into the following Java-like structure:

  class Node {
	Node parent;  // pointer to the parent node; null if root
	Node[] child; // array of pointers to child nodes
	String name;  // name of the current node
	double d;     // distance to the parent node
	bool hl;      // if the node needs to be highlighted
	bool hidden;  // if the node and all its desendants are collapsed
  };

  class Tree {
	Node[] node;  // list of nodes in the finishing order (the leftmost leaf is the first and the root the last)
	int error;    // errors in parsing: 0x1=missing left parenthesis; 0x2=missing right; 0x4=unpaired brackets
	int n_tips;   // number of tips/leaves in the tree
  };

  The minimal code for plotting/editing a tree in the Newick format is:

<head><!--[if IE]><script src="excanvas.js"></script><![endif]-->
<script language="JavaScript" src="knhx.js"></script></head>
<body onLoad="knhx_init('canvas', 'nhx');">
<textarea id="nhx" rows="20" cols="120" style="font:11px monospace"></textarea>
<canvas id="canvas" width="800" height="100" style="border:1px solid"></canvas>
</body>

*/

/********************************************
 ****** The New Hampshire format parser *****
 ********************************************/

function kn_new_node() { // private method
	return {parent:null, child:[], name:"", meta:"", d:-1.0, hl:false, hidden:false};
}

function kn_add_node(str, l, tree, x) // private method
{
	var r, beg, end = 0, z;
	z = kn_new_node();
	for (i = l, beg = l; i < str.length && str.charAt(i) != ',' && str.charAt(i) != ')'; ++i) {
		var c = str.charAt(i);
		if (c == '[') {
			var meta_beg = i;
			if (end == 0) end = i;
			do ++i; while (i < str.length && str.charAt(i) != ']');
			if (i == str.length) {
				tree.error |= 4;
				break;
			}
			z.meta = str.substr(meta_beg, i - meta_beg + 1);
		} else if (c == ':') {
			if (end == 0) end = i;
			for (var j = ++i; i < str.length; ++i) {
				var cc = str.charAt(i);
				if ((cc < '0' || cc > '9') && cc != 'e' && cc != 'E' && cc != '+' && cc != '-' && cc != '.')
					break;
			}
			z.d = parseFloat(str.substr(j, i - j));
			--i;
		} else if (c < '!' && c > '~' && end == 0) end = i;
	}
	if (end == 0) end = i;
	if (end > beg) z.name = str.substr(beg, end - beg);
	tree.node.push(z);
	return i;
}

/* Parse a string in the New Hampshire format and return a pointer to the tree. */
function kn_parse(str)
{
	var stack = new Array();
	var tree = new Object();
	tree.error = tree.n_tips = 0;
	tree.node = new Array();
	for (var l = 0; l < str.length;) {
		while (l < str.length && (str.charAt(l) < '!' || str.charAt(l) > '~')) ++l;
		if (l == str.length) break;
		var c = str.charAt(l);
		if (c == ',') ++l;
		else if (c == '(') {
			stack.push(-1); ++l;
		} else if (c == ')') {
			var x, m, i;
			x = tree.node.length;
			for (i = stack.length - 1; i >= 0; --i)
				if (stack[i] < 0) break;
			if (i < 0) {
				tree.error |= 1; break;
			}
			m = stack.length - 1 - i;
			l = kn_add_node(str, l + 1, tree, m);
			for (i = stack.length - 1, m = m - 1; m >= 0; --m, --i) {
				tree.node[x].child[m] = tree.node[stack[i]];
				tree.node[stack[i]].parent = tree.node[x];
			}
			stack.length = i;
			stack.push(x);
		} else {
			++tree.n_tips;
			stack.push(tree.node.length);
			l = kn_add_node(str, l, tree, 0);
		}
	}
	if (stack.length > 1) tree.error |= 2;
	tree.root = tree.node[tree.node.length - 1];
	return tree;
}

/*********************************
 ***** Output a tree in text *****
 *********************************/

/* convert a tree to the New Hampshire string */
function kn_write_nh(tree)
{
	// calculate the depth of each node
	tree.node[tree.node.length-1].depth = 0;
	for (var i = tree.node.length - 2; i >= 0; --i) {
		var p = tree.node[i];
		p.depth = p.parent.depth + 1;
	}
	// generate the string
	var str = '';
	var cur_depth = 0, is_first = 1;
	for (var i = 0; i < tree.node.length; ++i) {
		var p = tree.node[i];
		var n_bra = p.depth - cur_depth;
		if (n_bra > 0) {
			if (is_first) is_first = 0;
			else str += ",\n";
			for (var j = 0; j < n_bra; ++j) str += "(";
		} else if (n_bra < 0) str += "\n)";
		else str += ",\n";
		if (p.name) str += String(p.name);
		if (p.d >= 0.0) str += ":" + p.d;
		if (p.meta) str += p.meta;
		cur_depth = p.depth;
	}
	str += "\n";
	return str;
}

/* print the tree topology (for debugging only) */
function kn_check_tree(tree)
{
	document.write("<table border=1><tr><th>name<th>id<th>dist<th>x<th>y</tr>");
	for (var i = 0; i < tree.node.length; ++i) {
		var p = tree.node[i];
		document.write("<tr>" + "<td>" + p.name + "<td>" + i + "<td>" + p.d
					   + "<td>" + p.x + "<td>" + p.y + "</tr>");
	}
	document.write("</table>");
}

/**********************************************
 ****** Functions for manipulating a tree *****
 **********************************************/

/* Expand the tree into an array in the finishing order */
function kn_expand_node(root)
{
	var node, stack;
	node = new Array();
	stack = new Array();
	stack.push({p:root, i:0});
	for (;;) {
		while (stack[stack.length-1].i != stack[stack.length-1].p.child.length && !stack[stack.length-1].p.hidden) {
			var q = stack[stack.length-1];
			stack.push({p:q.p.child[q.i], i:0});
		}
		node.push(stack.pop().p);
		if (stack.length > 0) ++stack[stack.length-1].i;
		else break;
	}
	return node;
}

/* Count the number of leaves */
function kn_count_tips(tree)
{
	tree.n_tips = 0;
	for (var i = 0; i < tree.node.length; ++i)
		if (tree.node[i].child.length == 0 || tree.node[i].hidden)
			++tree.n_tips;
	return tree.n_tips;
}

/* Highlight: set node.hl for leaves matching "pattern" */
function kn_search_leaf(tree, pattern)
{
	var re = null;
	if (pattern != null && pattern != "") {
		re = new RegExp(pattern, 'i');
		if (re == null)
			alert("Wrong regular expression: '" + pattern + "'");
	}
	for (var i = 0; i < tree.node.length; ++i) {
		var p = tree.node[i];
		if (p.child.length == 0)
			p.hl = re != null && re.test(p.name)? true : false;
	}
}

/* Remove: delete a node and all its descendants */
function kn_remove_node(tree, node)
{
	var root = tree.node[tree.node.length - 1];
	if (node == root) return;

	var z = kn_new_node();
	z.child.push(root); root.parent = z;

	var p = node.parent, i;
	if (p.child.length == 2) { // then p will be removed
		var q, r = p.parent;
		i = (p.child[0] == node)? 0 : 1;
		q = p.child[1 - i]; // the other child
		q.d += p.d;
		q.parent = r;
		for (i = 0; i < r.child.length; ++i)
			if (r.child[i] == p) break;
		r.child[i] = q; p.parent = null;
	} else {
		var j, k;
		for (i = 0; i < p.child.length; ++i)
			if (p.child[i] == node) break;
		for (j = k = 0; j < p.child.length; ++j) {
			p.node[k] = p.node[j];
			if (j != i) ++k;
		}
		--p.child.length;
	}

	root = z.child[0];
	root.parent = null;
	return root;
}

/* Move: prune the subtree descending from p and regragh it to the edge between q and its parent */
function kn_move_node(tree, p, q)
{
	var root = tree.node[tree.node.length - 1];
	if (p == root) return null; // p cannot be root
	for (var r = q; r.parent; r = r.parent)
		if (r == p) return null; // p is an ancestor of q. We cannot move in this case.

	root = kn_remove_node(tree, p);

	var z = kn_new_node(); // a fake root
	z.child.push(root); root.parent = z;

	var i, r = q.parent;
	for (i = 0; i < r.child.length; ++i)
		if (r.child[i] == q) break;
	var s = kn_new_node(); // a new node
	s.parent = r; r.child[i] = s;
	if (q.d >= 0.0) {
		s.d = q.d / 2.0;
		q.d /= 2.0;
	}
	s.child.push(p); p.parent = s;
	s.child.push(q); q.parent = s;

	root = z.child[0];
	root.parent = null;
	return root;
}

/* Reroot: put the root in the middle of node and its parent */
function kn_reroot(root, node, dist)
{
	var i, d, tmp;
	var p, q, r, s, new_root;
	if (node == root) return root;
	if (dist < 0.0 || dist > node.d) dist = node.d / 2.0;
	tmp = node.d;

	/* p: the central multi-parent node
	 * q: the new parent, previous a child of p
	 * r: old parent
	 * i: previous position of q in p
	 * d: previous distance p->d
	 */
	q = new_root = kn_new_node();
	q.child[0] = node;
	q.child[0].d = dist;
	p = node.parent;
	q.child[0].parent = q;
	for (i = 0; i < p.child.length; ++i)
		if (p.child[i] == node) break;
	q.child[1] = p;
	d = p.d;
	p.d = tmp - dist;
	r = p.parent;
	p.parent = q;
	while (r != null) {
		s = r.parent; /* store r's parent */
		p.child[i] = r; /* change r to p's child */
		for (i = 0; i < r.child.length; ++i) /* update i */
			if (r.child[i] == p) break;
		r.parent = p; /* update r's parent */
		tmp = r.d; r.d = d; d = tmp; /* swap r->d and d, i.e. update r->d */
		q = p; p = r; r = s; /* update p, q and r */
	}
	/* now p is the root node */
	if (p.child.length == 2) { /* remove p and link the other child of p to q */
		r = p.child[1 - i]; /* get the other child */
		for (i = 0; i < q.child.length; ++i) /* the position of p in q */
			if (q.child[i] == p) break;
		r.d += p.d;
		r.parent = q;
		q.child[i] = r; /* link r to q */
	} else { /* remove one child in p */
		for (j = k = 0; j < p.child.length; ++j) {
			p.child[k] = p.child[j];
			if (j != i) ++k;
		}
		--p.child.length;
	}
	return new_root;
}

function kn_multifurcate(p)
{
	var i, par, idx, tmp, old_length;
	if (p.child.length == 0 || !p.parent) return;
	par = p.parent;
	for (i = 0; i < par.child.length; ++i)
		if (par.child[i] == p) break;
	idx = i; tmp = par.child.length - idx - 1;
	old_length = par.child.length;
	par.child.length += p.child.length - 1;
	for (i = 0; i < tmp; ++i)
		par.child[par.child.length - 1 - i] = par.child[old_length - 1 - i];
	for (i = 0; i < p.child.length; ++i) {
		p.child[i].parent = par;
		if (p.child[i].d >= 0 && p.d >= 0) p.child[i].d += p.d;
		par.child[i + idx] = p.child[i];
	}
}

function kn_reorder(root)
{
	sort_leaf = function(a, b) {
		if (a.depth < b.depth) return 1;
		if (a.depth > b.depth) return -1;
		return String(a.name) < String(b.name)? -1 : String(a.name) > String(b.name)? 1 : 0;
	};
	sort_weight = function(a, b) { return a.weight / a.n_tips - b.weight / b.n_tips; };

	var x = new Array();
	var i, node = kn_expand_node(root);
	// get depth
	node[node.length-1].depth = 0;
	for (i = node.length - 2; i >= 0; --i) {
		var q = node[i];
		q.depth = q.parent.depth + 1;
		if (q.child.length == 0) x.push(q);
	}
	// set weight for leaves
	x.sort(sort_leaf);
	for (i = 0; i < x.length; ++i) x[i].weight = i, x[i].n_tips = 1;
	// set weight for internal nodes
	for (i = 0; i < node.length; ++i) {
		var q = node[i];
		if (q.child.length) { // internal
			var j, n = 0, w = 0;
			for (j = 0; j < q.child.length; ++j) {
				n += q.child[j].n_tips;
				w += q.child[j].weight;
			}
			q.n_tips = n; q.weight = w;
		}
	}
	// swap children
	for (i = 0; i < node.length; ++i)
		if (node[i].child.length >= 2)
			node[i].child.sort(sort_weight);
}

/*****************************************
 ***** Functions for plotting a tree *****
 *****************************************/

function kn_canvas_hi_res(canvas, width, height)
{
    var ratio = window.devicePixelRatio;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    canvas.getContext("2d").scale(ratio, ratio);
}

/* Calculate the coordinate of each node */
function kn_calxy(tree, is_real)
{
	var i, j, scale;
	// calculate y
	scale = tree.n_tips - 1;
	for (i = j = 0; i < tree.node.length; ++i) {
		var p = tree.node[i];
		p.y = (p.child.length && !p.hidden)? (p.child[0].y + p.child[p.child.length-1].y) / 2.0 : (j++) / scale;
		if (p.child.length == 0) p.miny = p.maxy = p.y;
		else p.miny = p.child[0].miny, p.maxy = p.child[p.child.length-1].maxy;
	}
	// calculate x
	if (is_real) { // use branch length
		var root = tree.node[tree.node.length-1];
		scale = root.x = (root.d >= 0.0)? root.d : 0.0;
		for (i = tree.node.length - 2; i >= 0; --i) {
			var p = tree.node[i];
			p.x = p.parent.x + (p.d >= 0.0? p.d : 0.0);
			if (p.x > scale) scale = p.x;
		}
		if (scale == 0.0) is_real = false;
	}
	if (!is_real) { // no branch length
		scale = tree.node[tree.node.length-1].x = 1.0;
		for (i = tree.node.length - 2; i >= 0; --i) {
			var p = tree.node[i];
			p.x = p.parent.x + 1.0;
			if (p.x > scale) scale = p.x;
		}
		for (i = 0; i < tree.node.length - 1; ++i)
			if (tree.node[i].child.length == 0)
				tree.node[i].x = scale;
	}
	// rescale x
	for (i = 0; i < tree.node.length; ++i)
		tree.node[i].x /= scale;
	return is_real;
}

function kn_get_node(tree, conf, x, y)
{
	if (conf.is_circular) {
		for (var i = 0; i < tree.node.length; ++i) {
			var p = tree.node[i];
			var tmp_x = Math.floor(conf.width/2 + p.x * conf.real_r * Math.cos(p.y * conf.full_arc) + .999);
			var tmp_y = Math.floor(conf.height/2 + p.x * conf.real_r * Math.sin(p.y * conf.full_arc) + .999);
			var tmp_l = 2;
			if (x >= tmp_x - tmp_l && x <= tmp_x + tmp_l && y >= tmp_y - tmp_l && y <= tmp_y + tmp_l)
				return i;
		}
	} else {
		for (var i = 0; i < tree.node.length; ++i) {
			var tmp_x = tree.node[i].x * conf.real_x + conf.shift_x;
			var tmp_y = tree.node[i].y * conf.real_y + conf.shift_y;
			var tmp_l = conf.box_width * .6;
			if (x >= tmp_x - tmp_l && x <= tmp_x + tmp_l && y >= tmp_y - tmp_l && y <= tmp_y + tmp_l)
				return i;
		}
	}
	return tree.node.length;
}

/* Initialize parameters for tree plotting */
function kn_init_conf()
{
	var conf = new Object();
	conf.c_box = new Array();
	conf.width = 800; conf.height = 600;
	conf.xmargin = 20; conf.ymargin = 20;
	conf.fontsize = 8;
	conf.c_ext = "rgb(0,0,0)";
	conf.c_int = "rgb(255,0,0)";
	conf.c_line = "rgb(0,20,200)";
	conf.c_node = "rgb(0,20,200)";
	conf.c_dup = "rgb(255,0,0)";
	conf.c_active_node = "rgb(255,128,0)"
	conf.c_hl = "rgb(255, 180, 180)";
	conf.c_hidden = "rgb(0,200,0)";
	conf.c_regex = "rgb(0,128,0)";
//	conf.regex = ':S=([^:\\]]+)';
	conf.regex = ':B=([^:\\]]+)';
	conf.xskip = 3.0;
	conf.yskip = 12;
	conf.box_width = 6.0;
	conf.old_nh = null;
	conf.is_real = true;
	conf.is_circular = false;
	conf.show_dup = true;
	conf.runtime = 0;
	return conf;
}

function kn_drawText(ctx, conf, text, x, y)
{
	ctx.textAlign = "left";
	ctx.fillText(text, x, y);
}

function kn_drawTextRight(ctx, conf, text, x, y)
{
	ctx.textAlign = "right";
	ctx.fillText(text, x, y);
}

/* Plot the tree in the "canvas". Both node.x and node.y MUST BE precomputed by kn_calxy */
function kn_plot_core(canvas, tree, conf)
{
	if (conf.is_circular) {
		kn_plot_core_O(canvas, tree, conf);
		return;
	}
	kn_canvas_hi_res(canvas, conf.width, conf.height);
	var ctx = canvas.getContext("2d");
	ctx.font = conf.fontsize + "px Helvetica";
	ctx.strokeStyle = ctx.fillStyle = "white";
	ctx.fillRect(0, 0, conf.width, conf.height);
	// get maximum name length
	var max_namelen, i;
	for (i = 0, max_namelen = 0; i < tree.node.length; ++i) {
		if (tree.node[i].child.length) continue;
		var tmp = ctx.measureText(tree.node[i].name).width;
		if (tmp > max_namelen) max_namelen = tmp;
	}
	// set transformation
	var real_x, real_y, shift_x, shift_y;
	conf.real_x = real_x = conf.width - 2 * conf.xmargin - max_namelen;
	conf.real_y = real_y = conf.height - 2 * conf.ymargin - conf.fontsize;
	conf.shift_x = shift_x = conf.xmargin;
	conf.shift_y = shift_y = conf.ymargin + conf.fontsize / 2;
	// plot background boxes
	for (i = tree.node.length - 1; i >= 0 ; --i) {
		if (tree.node[i].box) {
			var p = tree.node[i];
			var x = p.x * real_x + shift_x - conf.box_width/2;
			ctx.strokeStyle = ctx.fillStyle = tree.node[i].box;
			ctx.fillRect(x, p.miny * real_y + shift_y - conf.yskip/2,
						 conf.width - conf.xmargin - x, (p.maxy - p.miny) * real_y + conf.yskip);
		}
	}
	// leaf highlight box
	ctx.fillStyle = conf.c_hl;
	for (i = 0; i < tree.node.length; ++i) {
		var p = tree.node[i];
		if (p.hl && (p.child.length == 0 || p.hidden))
			ctx.fillRect(p.x * real_x + conf.xskip * 2 + shift_x, p.y * real_y + shift_y - conf.fontsize * .8,
						 ctx.measureText(tree.node[i].name).width, conf.fontsize * 1.5);
	}
	// leaf name
	ctx.fillStyle = conf.c_ext;
	for (i = 0; i < tree.node.length; ++i) {
		var p = tree.node[i];
		if (p.child.length == 0 || p.hidden)
			kn_drawText(ctx, conf, p.name, p.x * real_x + conf.xskip * 2 + shift_x, p.y * real_y + shift_y + conf.fontsize / 3);
	}
	// internal name
	ctx.fillStyle = conf.c_int;
	for (i = 0; i < tree.node.length; ++i) {
		var p = tree.node[i];
		if (p.child.length && p.name.length > 0 && !p.hidden)
			kn_drawTextRight(ctx, conf, p.name, p.x * real_x - conf.xskip + shift_x, p.y * real_y + shift_y - conf.fontsize / 3);
	}
	// internal name 2
	if (conf.regex && conf.regex.indexOf('(') >= 0) {
		var re = new RegExp(conf.regex);
		if (re) {
			ctx.strokeStyle = conf.c_regex;
			for (i = 0; i < tree.node.length; ++i) {
				var p = tree.node[i];
				if (p.meta) {
					var m = re.exec(p.meta);
					if (m != null) {
						var l = ctx.measureText(m[1]).width;
						kn_drawText(ctx, conf, m[1], p.x * real_x - conf.xskip + shift_x - l, p.y * real_y + shift_y + conf.fontsize * 1.33);
					}
				}
			}
		}
	}
	// horizontal lines
	var y;
	ctx.strokeStyle = conf.c_line;
	ctx.beginPath();
	y = tree.node[tree.node.length-1].y * real_y + shift_y;
	ctx.moveTo(shift_x, y); ctx.lineTo(tree.node[tree.node.length-1].x * real_x + shift_x, y);
	for (i = 0; i < tree.node.length - 1; ++i) {
		var p = tree.node[i];
		y = p.y * real_y + shift_y;
		ctx.moveTo(p.parent.x * real_x + shift_x, y);
		ctx.lineTo(p.x * real_x + shift_x, y);
	}
	// vertical lines
	var x;
	for (i = 0; i < tree.node.length; ++i) {
		var p = tree.node[i];
		if (p.child.length == 0 || p.hidden) continue;
		x = p.x * real_x + shift_x;
		ctx.moveTo(x, p.child[0].y * real_y + shift_y);
		ctx.lineTo(x, p.child[p.child.length-1].y * real_y + shift_y);
	}
	ctx.stroke();
	ctx.closePath();
	// nodes
	for (i = 0; i < tree.node.length; ++i) {
		var tmp_x, tmp_y, tmp_l;
		var p = tree.node[i];
		tmp_x = p.x * real_x + shift_x;
		tmp_y = p.y * real_y + shift_y;
		tmp_l = conf.box_width / 2;
		if (p.hidden) ctx.fillStyle = conf.c_hidden;
		else if (conf.show_dup && /:D=Y/i.test(p.meta)) ctx.fillStyle = conf.c_dup;
		else ctx.fillStyle = conf.c_node;
		ctx.fillRect(tmp_x - tmp_l, tmp_y - tmp_l, conf.box_width, conf.box_width);
	}
}

function kn_plot_core_O(canvas, tree, conf)
{
	kn_canvas_hi_res(canvas, conf.width, conf.height);
	var ctx = canvas.getContext("2d");
	ctx.strokeStyle = ctx.fillStyle = "white";
	ctx.fillRect(0, 0, conf.width, conf.height);
	// get the maximum name length
	var max_namelen, i;
	for (i = 0, max_namelen = max_namechr = 0; i < tree.node.length; ++i) {
		if (tree.node[i].child.length) continue;
		var tmp = ctx.measureText(tree.node[i].name).width;
		if (tmp > max_namelen) max_namelen = tmp;
	}
	// set transformation and estimate the font size
	var real_r, full = 2 * Math.PI * (350/360), fontsize;
	fontsize = Math.ceil((conf.width/2 - conf.xmargin - 1 * tree.n_tips / full) / (max_namelen / conf.fontsize + tree.n_tips / full));
	ctx.font = fontsize + "px Helvetica";
	if (fontsize > conf.fontsize) fontsize = conf.fontsize;
	max_namelen *= fontsize / conf.fontsize;
	conf.real_r = real_r = conf.width/2 - conf.xmargin - max_namelen;
	conf.full_arc = full;
	ctx.save();
	ctx.translate(conf.width/2, conf.height/2);
	// plot background boxes
	for (i = tree.node.length - 1; i >= 0 ; --i) {
		if (tree.node[i].box) {
			var p = tree.node[i];
			var x = (p.parent? (p.parent.x + p.x)/2 : 0) * real_r;
			var miny, maxy;
			ctx.strokeStyle = ctx.fillStyle = tree.node[i].box;
			ctx.beginPath();
			miny = p.miny - 1. / tree.n_tips / 2;
			maxy = p.maxy + 1. / tree.n_tips / 2;
			ctx.moveTo(x * Math.cos(miny * full), x * Math.sin(miny * full));
			ctx.arc(0, 0, x, miny * full, maxy * full, false);
			ctx.lineTo(x * Math.cos(maxy * full), x * Math.sin(maxy * full));
			ctx.arc(0, 0, real_r, maxy * full, miny * full, true);
			ctx.closePath();
			ctx.fill();
		}
	}
	// leaf highlight
	ctx.fillStyle = conf.c_hl;
	for (i = 0; i < tree.node.length; ++i) {
		var p = tree.node[i];
		if (p.child.length || !p.hl) continue;
		ctx.save();
		var tmp = ctx.measureText(tree.node[i].name).width;
		if (p.y * full > Math.PI * .5 && p.y * full < Math.PI * 1.5) {
			ctx.rotate(p.y * full - Math.PI);
			ctx.fillRect(-(real_r + fontsize/2), -fontsize * .8, -tmp, fontsize * 1.5);
		} else {
			ctx.rotate(p.y * full);
			ctx.fillRect(real_r + fontsize/2, -fontsize * .8, tmp, fontsize * 1.5);
		}
		ctx.restore();
	}
	// leaf name
	ctx.fillStyle = conf.c_ext;
	for (i = 0; i < tree.node.length; ++i) {
		var p = tree.node[i];
		if (p.child.length) continue;
		ctx.save();
		if (p.y * full > Math.PI * .5 && p.y * full < Math.PI * 1.5) {
			ctx.rotate(p.y * full - Math.PI);
			kn_drawTextRight(ctx, conf, p.name, -(real_r + fontsize/2), fontsize/3);
		} else {
			ctx.rotate(p.y * full);
			kn_drawText(ctx, conf, p.name, real_r + fontsize/2, fontsize/3);
		}
		ctx.restore();
	}
	// straight lines
	ctx.strokeStyle = "black";
	ctx.beginPath();
	var root = tree.node[tree.node.length-1];
	ctx.moveTo(0, 0);
	ctx.lineTo(root.x * real_r * Math.cos(root.y * full), root.x * real_r * Math.sin(root.y * full));
	for (i = 0; i < tree.node.length - 1; ++i) {
		var p = tree.node[i];
		var cos = Math.cos(p.y * full), sin = Math.sin(p.y * full);
		ctx.moveTo(p.parent.x * real_r * cos, p.parent.x * real_r * sin);
		ctx.lineTo(p.x * real_r * cos, p.x * real_r * sin);
	}
	ctx.stroke();
	ctx.closePath();
	// lines towards the tips
	ctx.strokeStyle = "lightgray";
	ctx.beginPath();
	for (i = 0; i < tree.node.length - 1; ++i) {
		var p = tree.node[i];
		if (p.child.length) continue;
		var cos = Math.cos(p.y * full), sin = Math.sin(p.y * full);
		ctx.moveTo(p.x * real_r * cos, p.x * real_r * sin);
		ctx.lineTo(real_r * cos, real_r * sin);
	}
	ctx.stroke();
	ctx.closePath();
	// arcs
	ctx.strokeStyle = "black";
	ctx.beginPath();
	for (i = 0; i < tree.node.length; ++i) {
		var p = tree.node[i];
		if (p.child.length == 0 || p.hidden) continue;
		var r = p.x * real_r;
		ctx.moveTo(r * Math.cos(p.child[0].y * full), r * Math.sin(p.child[0].y * full));
		ctx.arc(0, 0, r, p.child[0].y * full, p.child[p.child.length-1].y * full, false); // arcTo is preferred, but may have compatibility issues.
	}
	ctx.stroke();
	ctx.closePath();
	ctx.restore();
}

/* Plot the tree "str" in the Newick format in the "canvas" */
function kn_plot_str(canvas, str, conf)
{
	var tree = kn_parse(str);
	if (tree.error) return tree;
	conf.is_real = kn_calxy(tree, conf.is_real);
	conf.height = conf.is_circular? conf.width : conf.ymargin * 2 + tree.n_tips * conf.yskip;
	canvas.width = conf.width;
	canvas.height = conf.height;
	kn_plot_core(canvas, tree, conf);
	return tree;
}


/******************************************************************
 ******************************************************************
 ***** The library ends here. The following are DOM specific. *****
 ******************************************************************
 ******************************************************************/

var kn_g_tree = null;
var kn_g_conf = kn_init_conf();

document.write('<script language="JavaScript" src="menu.js"></script>');
//document.write('<script language="JavaScript" src="canvastext.js"></script>');
document.write('<style type="text/css"><!-- \
	#popdiv a.alt { \
	  padding-left: 9px; \
	  font: 12px monospace; \
	  border: none; \
	  display: inline; \
	} \
--></style>');

/*****************
 * Event handler *
 *****************/

kn_actions = new function() {

	var id, canvas, textarea;

	this.init = function(c, t) { canvas = c; textarea = t; }

	this.set_id = function(_id) { id = _id; }

	this.init = function(c, t) { canvas = c; textarea = t; }

	this.plot = function(str) {
		var time_beg = new Date().getTime();
		if (str) {
			var tree = kn_plot_str(canvas, str, kn_g_conf);
			if (tree.error & 1) alert("Parsing ERROR: missing left parenthesis!");
			else if (tree.error & 2) alert("Parsing ERROR: missing right parenthesis!");
			else if (tree.error & 4) alert("Parsing ERROR: missing brackets!");
			kn_g_tree = tree;
		} else kn_plot_core(canvas, kn_g_tree, kn_g_conf);
		kn_g_conf.runtime = (new Date().getTime() - time_beg)/1000.0;
	}

	this.plot_str = function() { this.plot(textarea.value); }

	this.undo_redo = function() {
		var tmp = kn_g_conf.old_nh; kn_g_conf.old_nh = textarea.value; textarea.value = tmp;
		kn_g_tree = kn_parse(textarea.value);
		kn_g_conf.is_real = kn_calxy(kn_g_tree, kn_g_conf.is_real);
		kn_plot_core(canvas, kn_g_tree, kn_g_conf);
	}

	var set_undo = function(conf, str) {
		conf.old_nh = textarea.value;
		textarea.value = str;
	}

	this.get = function(x, y) {
		var id = kn_get_node(kn_g_tree, kn_g_conf, x, y);
		return (id >= 0 && id < kn_g_tree.node.length)? id : -1;
	}

	this.swap = function() {
		var tree = kn_g_tree, conf = kn_g_conf, i = id;
		if (i < tree.node.length && tree.node[i].child.length) {
			var p = tree.node[i];
			var q = p.child[0];
			for (j = 0; j < p.child.length-1; ++j)
				p.child[j] = p.child[j+1];
			p.child[p.child.length-1] = q;
			tree.node = kn_expand_node(tree.node[tree.node.length-1]);
			conf.is_real = kn_calxy(tree, conf.is_real);
			kn_g_tree = tree; kn_g_conf = conf;
			kn_plot_core(canvas, tree, conf);
			set_undo(conf, kn_write_nh(tree));
		}
	}

	this.sort = function() {
		var tree = kn_g_tree, conf = kn_g_conf, i = id;
		if (i < tree.node.length && tree.node[i].child.length) {
			kn_reorder(tree.node[i]);
			tree.node = kn_expand_node(tree.node[tree.node.length-1]);
			conf.is_real = kn_calxy(tree, conf.is_real);
			kn_g_tree = tree; kn_g_conf = conf;
			kn_plot_core(canvas, tree, conf);
			set_undo(conf, kn_write_nh(tree));
		}
	}

	this.reroot = function() {
		var tree = kn_g_tree, conf = kn_g_conf, i = id;
		if (i < tree.node.length) {
			var new_root = kn_reroot(tree.node[tree.node.length-1], tree.node[i], -1.0);
			tree.node = kn_expand_node(new_root);
			kn_g_tree = tree;
			conf.is_real = kn_calxy(tree, conf.is_real);
			kn_plot_core(canvas, tree, conf);
			set_undo(conf, kn_write_nh(tree));
		}
	}

	this.collapse = function() {
		var tree = kn_g_tree, conf = kn_g_conf, i = id;
		if (i < tree.node.length && tree.node[i].child.length) {
			tree.node[i].hidden = !tree.node[i].hidden;
			var nn = tree.node.length;
			tree.node = kn_expand_node(tree.node[tree.node.length-1]);
			kn_count_tips(tree);
			conf.is_real = kn_calxy(tree, conf.is_real);
			kn_g_tree = tree; kn_g_conf = conf;
			kn_plot_core(canvas, tree, conf);
		}
	}

	this.remove = function() {
		var tree = kn_g_tree, conf = kn_g_conf, i = id;
		if (i < tree.node.length) {
			var new_root = kn_remove_node(tree, tree.node[i]);
			tree.node = kn_expand_node(new_root);
			kn_count_tips(tree);
			kn_g_tree = tree;
			conf.is_real = kn_calxy(tree, conf.is_real);
			kn_plot_core(canvas, tree, conf);
			set_undo(conf, kn_write_nh(tree));
//			document.getElementById("n_leaves").innerHTML = "#leaves: "+tree.n_tips+";";
		}
	}

	this.multifurcate = function() {
		var tree = kn_g_tree, conf = kn_g_conf, i = id;
		if (i < tree.node.length && tree.node[i].child.length) {
			kn_multifurcate(tree.node[i]);
			tree.node = kn_expand_node(tree.node[tree.node.length-1]);
			conf.is_real = kn_calxy(tree, conf.is_real);
			kn_g_tree = tree; kn_g_conf = conf;
			kn_plot_core(canvas, tree, conf);
			set_undo(conf, kn_write_nh(tree));
		}
	}

	function move_clear_mark(tree, conf) {
		if (tree.active_node != null && tree.active_node < tree.node.length) {
			var p = tree.node[tree.active_node];
			tree.active_node = null;
			var ctx = canvas.getContext("2d");
			ctx.fillStyle = (conf.show_dup && /:D=Y/i.test(p.meta))? conf.c_dup : conf.c_node;
			ctx.fillRect(p.x * conf.real_x + conf.shift_x - conf.box_width/2,
						 p.y * conf.real_y + conf.shift_y - conf.box_width/2, conf.box_width, conf.box_width);
		}
	}

	this.move = function() {
		var tree = kn_g_tree, conf = kn_g_conf, i = id;
		if (i < tree.node.length) {
			if (tree.active_node != null && tree.active_node < tree.node.length) {
				//alert(tree.active_node + " -> " + i);
				if (tree.node[tree.active_node].parent == tree.node[i]) {
					alert("Error: cannot move a child to its parent!");
				} else {
					var new_root = kn_move_node(tree, tree.node[tree.active_node], tree.node[i]);
					if (new_root) {
						tree.node = kn_expand_node(new_root);
						kn_g_tree = tree;
						conf.is_real = kn_calxy(tree, conf.is_real);
						kn_plot_core(canvas, tree, conf);
						set_undo(conf, kn_write_nh(tree));
					} else alert("Error: Invalid move!");
				}
				move_clear_mark(tree, conf);
			} else {
				tree.active_node = i;
				var p = tree.node[i];
				var tmp = conf.box_width - 2;
				var ctx = canvas.getContext("2d");
				ctx.fillStyle = conf.c_active_node;
				ctx.fillRect(p.x * conf.real_x + conf.shift_x - tmp/2,
							 p.y * conf.real_y + conf.shift_y - tmp/2, tmp, tmp);
			}
		} else move_clear_mark(tree, conf);
	}

	this.highlight = function(color) {
		var tree = kn_g_tree, conf = kn_g_conf, i = id;
		var lookup = { white : '#FFFFFF', red : '#FFD8D0', green : '#D8FFC0', blue : '#C0D8FF',
					   yellow : '#FFFFC8', pink : '#FFD8FF', cyan : '#D8FFFF', none : 'none' };
		if (lookup[color]) color = lookup[color];
		if (i < tree.node.length) {
			// mark the clade to be highlighted
			var time_beg = new Date().getTime();
			var c = color;
			if (c == 'none') c = null;
			if (c != tree.node[i].box) {
				tree.node[i].box = c;
				kn_g_tree = tree; kn_g_conf = conf;
				kn_plot_core(canvas, tree, conf);
			}
			// highlight text
			var selbeg, selend;
			o = textarea;
			if (tree.node[i].child.length == 0) {
				selbeg = o.value.indexOf(tree.node[i].name);
				selend = selbeg + tree.node[i].name.length;
			} else {
				var left, leftd, str = o.value;
				left = tree.node[i]; leftd = 0;
				while (left.child.length) ++leftd, left = left.child[0]; // descend to the leftmost child
				selbeg = str.indexOf(left.name);
				for (--selbeg; selbeg >= 0; --selbeg) {
					if (str.charAt(selbeg) == '(') --leftd;
					if (leftd == 0) break;
				}
				var rght, rghtd;
				rght = tree.node[i]; rghtd = 0;
				while (rght.child.length) ++rghtd, rght = rght.child[rght.child.length-1];
				selend = str.indexOf(rght.name) + rght.name.length;
				for (; selend < str.length; ++selend) {
					if (str.charAt(selend) == ')') --rghtd;
					if (rghtd == 0) break;
				}
				++selend;
			}
			//o.focus();
			if (o.setSelectionRange) {
				var j, nn, h = o.clientHeight / o.rows;
				var str = o.value.substr(0, selbeg);
				for (j = nn = 0; j < selbeg && j < str.length; ++j)
					if (str.charAt(j) == '\n') ++nn;
				o.scrollTop = nn * h;
				o.setSelectionRange(selbeg, selend);
			} else { // for IE
				var j, nn, r = o.createTextRange();
				var str = o.value.substr(0, selend);
				for (j = nn = 0; j < selbeg; ++j)
					if (str.charAt(j) == '\n') ++nn;
				selbeg -= nn;
				for (;j < selend; ++j)
					if (str.charAt(j) == '\n') ++nn;
				selend -= nn;
				r.collapse(true);
				r.moveEnd('character', selend);
				r.moveStart('character', selbeg);
				r.select();
			}
		}
	}
}

knhx_init = function(canvasId, textareaId) {

	var kn_actions_html = '<h4>Actions</h4>'
		+ '<a href="javascript:void(0);" onClick="kn_actions.swap();">Swap</a>'
		+ '<a href="javascript:void(0);" onClick="kn_actions.sort();">Ladderize</a>'
		+ '<a href="javascript:void(0);" onClick="kn_actions.collapse();">Collapse</a>'
		+ '<a href="javascript:void(0);" onClick="kn_actions.reroot();">Reroot</a>'
		+ '<a href="javascript:void(0);" onClick="kn_actions.move();">Move</a>'
		+ '<a href="javascript:void(0);" onClick="kn_actions.multifurcate();">Multifurcate</a>'
		+ '<a href="javascript:void(0);" onClick="kn_actions.remove();">Remove</a>'
		+ '<a href="javascript:void(0);" onClick="kn_actions.highlight(\'none\');" class="alt">&nbsp;</a>'
		+ '<a href="javascript:void(0);" class="alt" onClick="kn_actions.highlight(\'red\');" style="background-color:#FFD8D0;">&nbsp;</a>'
		+ '<a href="javascript:void(0);" class="alt" onClick="kn_actions.highlight(\'green\');" style="background-color:#D0FFC0;">&nbsp;</a>'
		+ '<a href="javascript:void(0);" onClick="kn_actions.highlight(\'blue\');" class="alt" style="background-color:#C0D8FF;">&nbsp;</a>'
		+ '<a href="javascript:void(0);" onClick="kn_actions.highlight(\'yellow\');" class="alt" style="background-color:#FFFFC8;">&nbsp;</a>'
		+ '<a href="javascript:void(0);" onClick="kn_actions.highlight(\'cyan\');" class="alt" style="background-color:#D8FFFF;">&nbsp;</a>'

	var menu_html = function() {
		return '<h4>Menu</h4>'
		+ '<a href="javascript:void(0);" onClick="kn_actions.plot_str();">Draw tree</a>'
		+ '<a href="javascript:void(0);" onClick="kn_actions.undo_redo();">Undo/Redo</a>'
		+ '<a href="javascript:void(0);" id="searchButton" style="display: inline" onClick="kn_search_leaf(kn_g_tree,document.getElementById(\'searchLeaf\').value);kn_actions.plot();">Search</a>: <input id="searchLeaf" size=12 onkeydown="if (event.keyCode == 13) kn_search_leaf(kn_g_tree,document.getElementById(\'searchLeaf\').value); kn_actions.plot();">'
		+ '<h4>Configurations</h4>'
		+ '<table><tr><td>Width:<td><input size=5 value="' + kn_g_conf.width + '" onBlur="kn_g_conf.width=this.value;">'
		+ '<tr><td>Font size:<td><input size=5 value="' + kn_g_conf.fontsize + '" onBlur="kn_g_conf.fontsize=this.value;">'
		+ '<tr><td>Spacing:<td><input size=5 value="' + kn_g_conf.yskip + '" onBlur="kn_g_conf.yskip=this.value;">'
		+ '<tr><td>2nd label:<td><input size=10 value="' + kn_g_conf.regex + '" onBlur="kn_g_conf.regex=this.value;">'
	    + '<tr><td>Phylogram:<td><input type="checkbox" '+(kn_g_conf.is_real? 'checked="yes"':'')+'" onChange="kn_g_conf.is_real=this.checked;">'
	    + '<tr><td>Circular:<td><input type="checkbox" '+(kn_g_conf.is_circular? 'checked="yes"':'')+'" onChange="kn_g_conf.is_circular=this.checked;">'
		+ '</table>'
		+ '<h4>Information</h4>'
		+ '<table><tr><td># leaves:<td>'+(kn_g_tree?kn_g_tree.n_tips:0)
		+ '<tr><td># nodes:<td>'+(kn_g_tree?kn_g_tree.node.length:0)
		+ '<tr><td>Run time:<td>'+kn_g_conf.runtime+' sec'
		+ '</table>'
	}

	function ev_canvas(ev) {
		if (ev.layerX || ev.layerX == 0) { // Firefox
			ev._x = ev.layerX;
			ev._y = ev.layerY;
		} else if (ev.offsetX || ev.offsetX == 0) { // Opera
			ev._x = ev.offsetX;
			ev._y = ev.offsetY;
		}
		if (navigator.appName == "Microsoft Internet Explorer") { // for IE8
			/* When we click a node on the IE8 canvas, ev.offsetX gives
			 * the offset inside the node instead of inside the canvas.
			 * We have to do something nasty here... */
			var d = document.body;
			var o = document.getElementById("canvasContainer");
			ev._x = ev.clientX - (o.offsetLeft - d.scrollLeft) - 3;
			ev._y = ev.clientY - (o.offsetTop - d.scrollTop) - 3;
		}
		if (kn_g_tree) {
			var id = kn_actions.get(ev._x, ev._y);
			if (id >= 0) {
				kn_actions.set_id(id);
				if (kn_g_tree.active_node == null) popmenu.show(ev, kn_actions_html, "98px");
				else kn_actions.move();
			} else popmenu.show(ev, menu_html());
		} else popmenu.show(ev, menu_html());
	}

	var canvas = document.getElementById(canvasId);
	var textarea = document.getElementById(textareaId);

	kn_actions.init(canvas, textarea);
	if (canvas.addEventListener) canvas.addEventListener('click', ev_canvas, false);
	else canvas.attachEvent('onclick', ev_canvas);

	var insert_elements = function() {
		// put the canvas in a container
		var o = document.createElement("div");
		o.setAttribute('id', 'canvasContainer');
		o.setAttribute('style', 'position: relative;');
		var canvas_parent = canvas.parentNode || canvas.parent;
		canvas_parent.removeChild(canvas);
		canvas_parent.appendChild(o);
		o.appendChild(canvas);
	}

	insert_elements();
}
