function signatureCaptureInsur() {
	var siginsur = document.getElementById("siginsur");
	var context = siginsur.getContext("2d");

	if (!context) {
		throw new Error("Failed to get canvas' 2d context");
	}

	//canvas.width = 474 ;
	//canvas.height = 314 ;
	
	context.fillStyle = "#ffffff";
	//context.strokeStyle = "#444";
	//context.lineWidth = 1.2;
	context.lineCap = "round";

	context.fillRect(0, 0, siginsur.width, siginsur.height);

	//context.fillStyle = "#ffffff";
	context.strokeStyle = "#000080";
	context.lineWidth = 2;
	context.moveTo(20,220);
	context.lineTo(454,220);
	context.stroke();

	//context.fillStyle = "#fff";
	//context.strokeStyle = "#444";
	
	
	var disableSave = true;
	var pixels = [];
	var cpixels = [];
	var xyLast = {};
	var xyAddLast = {};
	var calculate = false;
	//functions
	{
		function remove_event_listeners() {
			siginsur.removeEventListener('mousemove', on_mousemove, false);
			siginsur.removeEventListener('mouseup', on_mouseup, false);
			siginsur.removeEventListener('touchmove', on_mousemove, false);
			siginsur.removeEventListener('touchend', on_mouseup, false);

			document.body.removeEventListener('mouseup', on_mouseup, false);
			document.body.removeEventListener('touchend', on_mouseup, false);
		}

		function get_board_coords(e) {
			var x, y;

			if (e.changedTouches && e.changedTouches[0]) {
				var offsety = siginsur.offsetTop || 0;
				var offsetx = siginsur.offsetLeft || 0;

				x = e.changedTouches[0].pageX - offsetx;
				y = e.changedTouches[0].pageY - offsety;
			} else if (e.layerX || 0 == e.layerX) {
				x = e.layerX;
				y = e.layerY;
			} else if (e.offsetX || 0 == e.offsetX) {
				x = e.offsetX;
				y = e.offsetY;
			}

			return {
				x : x,
				y : y
			};
		};

		function on_mousedown(e) {
			e.preventDefault();
			e.stopPropagation();

			siginsur.addEventListener('mousemove', on_mousemove, false);
			siginsur.addEventListener('mouseup', on_mouseup, false);
			siginsur.addEventListener('touchmove', on_mousemove, false);
			siginsur.addEventListener('touchend', on_mouseup, false);

			document.body.addEventListener('mouseup', on_mouseup, false);
			document.body.addEventListener('touchend', on_mouseup, false);

			empty = false;
			var xy = get_board_coords(e);
			context.beginPath();
			pixels.push('moveStart');
			context.moveTo(xy.x, xy.y);
			pixels.push(xy.x, xy.y);
			xyLast = xy;
		};

		function on_mousemove(e, finish) {
			e.preventDefault();
			e.stopPropagation();

			var xy = get_board_coords(e);
			var xyAdd = {
				x : (xyLast.x + xy.x) / 2,
				y : (xyLast.y + xy.y) / 2
			};

			if (calculate) {
				var xLast = (xyAddLast.x + xyLast.x + xyAdd.x) / 3;
				var yLast = (xyAddLast.y + xyLast.y + xyAdd.y) / 3;
				pixels.push(xLast, yLast);
			} else {
				calculate = true;
			}

			context.quadraticCurveTo(xyLast.x, xyLast.y, xyAdd.x, xyAdd.y);
			pixels.push(xyAdd.x, xyAdd.y);
			context.stroke();
			context.beginPath();
			context.moveTo(xyAdd.x, xyAdd.y);
			xyAddLast = xyAdd;
			xyLast = xy;

		};

		function on_mouseup(e) {
			remove_event_listeners();
			disableSave = false;
			context.stroke();
			pixels.push('e');
			calculate = false;
		};

	}//end

	siginsur.addEventListener('mousedown', on_mousedown, false);
	siginsur.addEventListener('touchstart', on_mousedown, false);
}

function signatureClearInsur() {
	var siginsur = document.getElementById("siginsur");
	var context = siginsur.getContext("2d");
	context.clearRect(0, 0, siginsur.width, siginsur.height);
}
