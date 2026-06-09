//function to validate by length
function lengthValid(field, len, text) {
    // text = Trim(text);
	if (field.value.length < len)
  	{
 	  	alert("Please enter a valid " + text + ".");
		field.focus();
		return false;
	}else{
		return true;
	}
}

//function to validate numerical fields
function numberValid(field, text) {
    //text = Trim(text);
	if (isNaN(field.value))
  	{
 	  	alert("Please enter a valid " + text + ".");
		field.focus();
		return false;
	}else{
		return true;
	}
}


//function to validate Zip Code fields
function zipValid(field,len, text) {
    //text = Trim(text);
	if (isNaN(field.value) || field.value.length < len)
  	{
 	  	alert("Please enter a valid " + text + ".");
		field.focus();
		return false;
	}else{
		return true;
	}
}

//function to validate email
function emailValid(mailfield, len, text) {
   // text = Trim(text);
	if(mailfield.value.length < len || mailfield.value.indexOf("@") < 1 || mailfield.value.indexOf(".") < 1)
	{
	    alert("Please enter a valid " + text + ".");
		mailfield.focus();
		return false;
	}else{
		return true;
	}
}

//function to validate select drop-downs
function selectValid(field, text) {
    //text = Trim(text);
	if (field[0].selected)
  	{
 	  	alert("Please select " + text + ".");
		field.focus();
		return false;
	}else{
		return true;
	}
}


//function to check check-box
function chkbox(field, text) {
   // text = Trim(text);
	if(field.checked)
	{
		return true;
	}else{
		alert("Please check the " + text + " box.");
			field.focus();
			return false;
	}
}


//function to eliminate alpha
function digitsonly(field) {
	var string=field.value;
	var num="" ;
	for (var i=0; i < string.length; i=i+1) {
		if (isNaN(string.charAt(i)) || string.charAt(i)==" ") {
			num=num+"";
		}else{
			num=num+string.charAt(i);
		}
	   }
	field.value=num;
   }


function locatezip() {
    window.open('/wc.dll?mputil~zipwc~NEW','EANITHING','toolbar=no,location=no,directories=no,status=no,menubar=no,resizable=no,copyhistory=no,scrollbars=yes,width=550,height=500');
self.name="main"}
