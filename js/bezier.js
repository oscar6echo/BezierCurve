
// x y coordinates extraction functions, and line
function x(d){ return d.x; }
function y(d){ return d.y; }
var	line = d3.svg.line().x(x).y(y);


function interpolate(previous_level, lambda) {
	// return one level of bezier points given the previous level
	var bezier_points = [];
	for (var i=1; i<previous_level.length; i++) {
		var p0 = previous_level[i-1],
			p1 = previous_level[i];
		bezier_points.push({x: p0.x + (p1.x - p0.x) * lambda, y: p0.y + (p1.y - p0.y) * lambda});
	}
	return bezier_points;
}

function get_bezier_levels(d, t_) {
	// return all Bezier points for the d first points of points, and time t_ (local)
	// b = array of levels of Bezier points [[level 0 points], [level 1 points], [level 2 points], etc]
	// level 0 = control points
	// level 1 = on segments joining level 0 points
	// level 2 = on segments joining level 1 points, etc
	var bezier_levels = [points.slice(0, d)];
	for (var i=1; i<d; i++) {
		// add level i points
		bezier_levels.push(interpolate(bezier_levels[bezier_levels.length-1], t_));
	}
	return bezier_levels;
}

function get_bezier_curve(d) {
	// return bezier curve for d, after creating if necessary
	var curve = bezier_curve[d];
	if (dir>0){
		displayed_curve = [curve.slice(0, Math.floor(t / timestep_0) + 1)];
	}
	else {
		displayed_curve = [curve.slice(Math.floor(t / timestep_0)-1)];
	}
	return displayed_curve;
}

function update_bezier_curve() {
	// create bezier curve for all orders (and for a set of control points) and store in bezier_curve
	var bezier_curve_ = {};
	for (var d=order[0]; d<=order[order.length-1]; d++) {
		console.log(d);
		var curve = [];
		for (var t_=0; t_<=1; t_+=timestep) {
			var b = get_bezier_levels(d, t_);
			curve.push(b[b.length-1][0]);
		}
		bezier_curve_[d] = curve.slice(0);
	}
	return bezier_curve_;
}

function update() {
	// update display every timestep, cf next_step()
	var bezier_obj = vis.selectAll("g")
			.data(function(d, i) { return get_bezier_levels(d, t); });
			// .data(function(d, i) { console.log("d="+d+", i="+i); return get_bezier_levels(d, t); });

	bezier_obj.enter()
		.append("g")
			.style("fill", function (d, i) { return color(d, i); })
			.style("stroke", function (d, i) { return color(d, i); });

	var circle = bezier_obj.selectAll("circle")
			.data(function(d, i) { return d; });

	circle.enter()
		.append("circle")
			.attr("r", 4);

	circle.transition()
			.duration(0)
			.attr("cx", x)
			.attr("cy", y);

	var path = bezier_obj.selectAll("path")
			.data(function(d) { return [d]; });

	path.enter()
		.append("path")
			.attr("class", "line")
			.attr("d", line);

	path.transition()
			.duration(0)
			.attr("d", line);

	var curve = vis.selectAll("path.curve")
			.data(function (d) { return get_bezier_curve(d); });

	curve.enter()
		.append("path")
			.attr("class", "curve");

	curve.transition()
			.duration(0)
			.attr("d", line);

	vis.selectAll("text.controltext")
			.attr("x", x)
			.attr("y", y);

	vis.selectAll("text.time")
			.text("t=" + t.toFixed(2));
}

// key function definitions and attach key function to body
function keydown_function() {
	console.log("d3.event.keyCode = ", d3.event.keyCode);
	// right
	if (d3.event.keyCode==39) {
		timestep *= 1.1;
	}
	// left
	if (d3.event.keyCode==37) {
		timestep /= 1.1;
	}
	// down
	if (d3.event.keyCode==40) {
		timestep = timestep_0 / 7;
	}
	// up
	if (d3.event.keyCode==38) {
		timestep = timestep_0;
	}
	console.log("timestep="+timestep);
}
d3.select("body").on("keydown", keydown_function);


// manage timer
function next_step() {
	t += dir*timestep;
	if (t<0) {
		t = 0;
		dir = 1;
	}
	if (t>1) {
		t = 1;
		dir = -1;
	}
	update();
	// if (t<-0.05) {clearInterval(myTimer)}
}


// --------------------------------------global variables

var w = 300, h = 325, padding = 10,
	// nb of bezier orders from linear (1) to ....
	nb_order = 6,
	// array of orders
	order = d3.range(2, nb_order + 2),
	// inital points, draggable
	points = [
		{x: 0, y: 320},
		{x: 0, y: 0},
		{x: 120, y: 10},
		{x: 180, y: 250},
		{x: 225, y: 50},
		{x: 300, y: 280},
		{x: 200, y: 300}
		],
	// resulting bezier curve to be constructed
	bezier_curve = {},
	// initial time in [0, 1]
	t = 0.5,
	// time step
	// 1/timestep is the number of steps to go from t=0 to t=1
	timestep_0 = 1/200,
	timestep = timestep_0,
	// initial direction
	 dir = +1,
	// period in ms to go from t=0 to t=1 with initial time step
	period = 5000;

// color brewer alternative color scale
// var stroke = d3.scale.ordinal().domain(order).range(colorbrewer.PRGn[order.length]);
var	stroke = d3.scale.category20b();
function color(d, i) { return d.length >1 ? stroke(1+1*i) : "red"; }

for (var k=0; k<=19; k++) {
	console.log("k="+k+", stroke="+stroke(k))
	console.log("k="+k+", color="+color([0, 1], k))
}


// layout
var vis = d3.select("#vis").selectAll("svg")
		.data(order)
	.enter().append("svg")
		.attr("width", w + 2 * padding)
		.attr("height", h + 2 * padding)
	.append("g")
		.attr("transform", "translate(" + padding + "," + padding + ")");

// compute bezier curve for all orders and for initial control points
bezier_curve = update_bezier_curve();
// compute all bezier levels / points
update();

// create control points
vis.selectAll("circle.control")
		.data(function(d) { return points.slice(0, d) })
	.enter().append("circle")
		.attr("class", "control")
		.attr("r", 4)
		.attr("cx", x)
		.attr("cy", y)
		.call(d3.behavior.drag()
			.on("dragstart", function(d) {
				this.__origin__ = [d.x, d.y];
			})
			.on("drag", function(d) {
				d.x = Math.min(w, Math.max(0, this.__origin__[0] += d3.event.dx));
				d.y = Math.min(h, Math.max(0, this.__origin__[1] += d3.event.dy));
				bezier_curve = update_bezier_curve();
				update();
				vis.selectAll("circle.control").transition()
					.duration(0)
					.attr("cx", x)
					.attr("cy", y);
			})
			.on("dragend", function() {
				// bezier_curve = {};
				delete this.__origin__;
			}));

// create control point labels
vis.selectAll("text.controltext")
		.data(function(d) { return points.slice(0, d); })
	.enter().append("text")
		.attr("class", "controltext")
		.attr("dx", "10px")
		.attr("dy", ".4em")
		.text(function(d, i) { return "P" + i });

// create time placeholder
vis.append("text")
	.attr("class", "time")
	.attr("x", w / 2)
	.attr("y", h)
	.attr("text-anchor", "middle");


var myTimer = setInterval(function() { next_step() }, period*timestep);


