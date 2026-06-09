function selecteditems() 
  {	
	window.searchtxt.focus();
	var j=0 ;

	//++ Hide all items
	for (var i=0; i < document.theForm.length; i=i+2)
	 {
		document.theForm.elements[i].style.visibility = "hidden" ;
		document.theForm.elements[i+1].style.visibility = "hidden" ;
		document.theForm.elements[i+1].style.background= "white" ;

		if (theArray[i/2][3] > 0)
		  {
			document.theForm.elements[j].value = theArray[i/2][2] ;
			document.theForm.elements[j+1].name = theArray[i/2][0] ;
			document.theForm.elements[j+1].value = theArray[i/2][3] ;
			document.theForm.elements[j].style.visibility = "visible" ;
			document.theForm.elements[j+1].style.visibility = "visible" ;
			
			document.theForm.elements[j+1].style.background= "#FFFF99" ;
			j=j+2;
		  }
	 }
  }


function printall() 
  {	
	var j=0 ;
	for (var i in theArray)
		  {
			document.theForm.elements[j].value = theArray[i][2] ;
			document.theForm.elements[j+1].name = theArray[i][0] ;
			document.theForm.elements[j+1].value = theArray[i][3] ;
			document.theForm.elements[j].style.visibility = "visible" ;
			document.theForm.elements[j+1].style.visibility = "visible" ;

			document.theForm.elements[j+1].style.background= "#FFFF99" ;
			if (theArray[i][3] < 1)
			  {
				document.theForm.elements[j+1].style.background= "white" ;
			  }
			j=j+2;
		  }
  }


function filtera(typea) 
  {	
	var j=0 ;

	//++ Hide all items
	for (var i=0; i < document.theForm.length; i=i+2)
	 {
		document.theForm.elements[i].style.visibility = "hidden" ;
		document.theForm.elements[i+1].style.visibility = "hidden" ;
		document.theForm.elements[i+1].style.background= "white" ;

	    if (typea.length==1)
		  {
	    	//++ print items by letter'A'
		    if (theArray[i/2][2].charAt(0)==typea)
			  {
				document.theForm.elements[j].value = theArray[i/2][2] ;
				document.theForm.elements[j+1].name = theArray[i/2][0] ;
				document.theForm.elements[j+1].value = theArray[i/2][3] ;
				document.theForm.elements[j].style.visibility = "visible" ;
				document.theForm.elements[j+1].style.visibility = "visible" ;
				
				if (theArray[i/2][3] > 0)
				  {
					document.theForm.elements[j+1].style.background= "FFFF99" ;
				  }
				j=j+2;
			  }
		   }
		  else 
		   {
	    	//++ print items by Subject 'BR'
		    if (theArray[i/2][1]==typea)
			  {
				document.theForm.elements[j].value = theArray[i/2][2] ;
				document.theForm.elements[j+1].name = theArray[i/2][0] ;
				document.theForm.elements[j+1].value = theArray[i/2][3] ;
				document.theForm.elements[j].style.visibility = "visible" ;
				document.theForm.elements[j+1].style.visibility = "visible" ;
				
				if (theArray[i/2][3] > 0)
				  {
					document.theForm.elements[j+1].style.background= "FFFF99" ;
				  }
	
				j=j+2;
			  }
		   }
	 }
  }



function searchitem(item) 
  {	
	var j=0 ;

	//++ Hide all items
	for (var i=0; i < document.theForm.length; i=i+2)
	 {
		document.theForm.elements[i].style.visibility = "hidden" ;
		document.theForm.elements[i+1].style.visibility = "hidden" ;
		document.theForm.elements[i+1].style.background= "white" ;

	    	//++ print items by letter'A'
	    if (theArray[i/2][2].substring(0,item.length)==item.toUpperCase())
		  {
			document.theForm.elements[j].value = theArray[i/2][2] ;
			document.theForm.elements[j+1].name = theArray[i/2][0] ;
			document.theForm.elements[j+1].value = theArray[i/2][3] ;
			document.theForm.elements[j].style.visibility = "visible" ;
			document.theForm.elements[j+1].style.visibility = "visible" ;
			
			if (theArray[i/2][3] > 0)
			  {
				document.theForm.elements[j+1].style.background= "FFFF99" ;
			  }

			j=j+2;
		  }
	   }
  }

function updatearray(item,qty)
  {
	
	//theArray[i][2].substring(0,item.length)==item.toUpperCase())
	//var Yindex=eval(item.indexOf('Y',0));

	var i=eval(item.substr(3,item.length))-1;
	//window.alert(i+", "+qty);
	theArray[i][3]=eval(qty);
  }



function delall() 
  {  
	var Message = "Are you sure you want to delete?";
	if (confirm (Message))
	  {
	      for (var i=0; i < document.theForm.length; i=i+2)
		 {
			document.theForm.elements[i].style.visibility = "hidden" ;
			document.theForm.elements[i+1].style.visibility = "hidden" ;
			document.theForm.elements[i+1].value = 0 ;
			theArray[i/2][3]=0 ;

		 }
	  }
  }




function focuson(elem) 
    {  
  	   if (elem.length==1)
		  eval(elem).className="ABCON";
		else
		  eval(elem).className="SUBON";
    }

function focusoff(elem) 
    {  
  	   if (elem.length==1)
		  eval(elem).className="ABCOFF";
		else
		  eval(elem).className="SUBOFF";
    }



function closeform() {
	window.close()}	
