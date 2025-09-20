//@HDR@	$Id: todo.js,v 1.1 2020/08/12 21:29:05 chris Exp $
//@HDR@		Copyright 2020-2024 by
//@HDR@		Christopher Caldwell/Brightsands
//@HDR@		P.O. Box 401, Bailey Island, ME 04003
//@HDR@		All Rights Reserved
//@HDR@
//@HDR@	This software comprises unpublished confidential information
//@HDR@	of Brightsands and may not be used, copied or made available
//@HDR@	to anyone, except in accordance with the license under which
//@HDR@	it is furnished.
//  Developed by Philip Hutchison, August 2007. 
//  An explanation for this example (and more examples) can be found
//  at http://pipwerks.com/lab/
//  Modified to be more moduler 02/05/11 c.m.caldwell@alumni.unh.edu.

//////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////
function iePrompt( str, defval )
    {
    var res = window.showModalDialog("ieprompt.html", str,
	"dialogWidth: 290px;"	+
	"dialogHeight: 160px;"	+
	"center: yes;"		+
	"edge: raised;"		+
	"scroll: no;"		+
	"status: no;" );
    return ( res == "" ? defval : res );
    }

//////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////
var usprompt_return;
function usprompt(str,defval)
    {
    var err;
    var ua = navigator.userAgent;
    usprompt_return = "{unset}";
    try	{
	if( window.showModalDialog		&&
	    ( ua.indexOf("MSIE")		>= 0
	     || ua.indexOf("AppleWebKit")	>= 0
	     || ua.indexOf("Safari")	>= 0 )	)
	    {
	    alert("ieprompt logic...");
	    usprompt_return = iePrompt( str, defval );
	    }
	else
	    {
	    alert("Regular prompt logic...");
	    usprompt_return = window.prompt( str, defval );
	    }
	}
    catch (err)
	{ 
	alert("prompt had a problem:  "+err.description);
	usprompt_return = false;
	} 
    if( usprompt_return==false || usprompt_return==null ) { usprompt_return = window.prompt("Try again:  "+str,defval); }
    alert("prompt returning ["+usprompt_return+"]");
    return usprompt_return;
    }

var list = new Array();

var fields =
    {
    Status:
    	{
	xname:	"XL(Status)",
	vals:	["Delete","Untouched","Progress","Waiting","Done"],
	xvals:	["XL(Delete)","XL(Untouched)","XL(Progress)","XL(Waiting)","XL(Done)"],
	attrs:	["style='color:white'","style='color:red'","style='color:yellow'","style='color:#80ff00'","style='color:#40a080'"],
	help:	" help='field_Status'"
	},
    Priority:
        {
	xname:	"XL(Priority)",
	vals:	[1,2,3,4,5],
	xvals:	[
		"XL(Top)",
		"XL(High)",
		"XL(Mid)",
		"XL(Low)",
		"XL(Bottom)"],
	attrs:	["bgcolor=red","bgcolor=orange","bgcolor=yellow","bgcolor=#80ff00","bgcolor=#40a080"],
	attr:	"style='white-space:nowrap'",
	help:	" help='field_Priority'"
	},
    Task:
        {
	xname:	"XL(Task)",
	width:	40,
	help:	" help='field_Task'"
	},
    Rest:
        {
	xname:	"XL(Other information)",
	width:	40,
	help:	" help='field_Rest'"
	}
    };
var table_fields = [ "Status", "Priority", "Task", "Rest" ];
var fields_must_have = [ "Status", "Task", "Priority" ];
var default_sortorder = [ "Priority", "Task", "Status" ];
var sortorder = default_sortorder;

var current_row = -1;
var current_col = -1;

var tableidptr;

//////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////
function add_new_item()
    {
    current_row = list.length;
    current_col = fields_must_have[1];
    list.push( { Status: fields.Status.vals[1] } );
    return draw_list();
    }

//////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////
function change_attr( ind, attrname, ptr )
    {
    if( ind < 0 )
        {
	ind = list.length;
	list[ind] = { Status:  "Untouched" };
	}
    list[ind][attrname+"_changed"] = Date.now();
    if( ptr.value == "Delete" )
        {
	for( var i=ind++; ind<list.length; i++ )
	    { list[i] = list[ind++]; }
	list.length--;
	}
    else
	{
	list[ind][attrname] = ptr.value;
	// alert("list["+ind+"]."+attrname+" set to ["+list[ind][attrname]+"]");
	}
    current_col = "";
    for( current_row=0; current_row<list.length; current_row++ )
	{
	for( fmh_ind=0; fmh_ind<fields_must_have.length; fmh_ind++ )
	    {
	    var field = fields_must_have[fmh_ind];
	    if( emptynull(list[current_row][field])=="" )
		{
		current_col = field;
		}
	    }
	if( current_col == ""
	    && emptynull(list[current_row].Status)=="Waiting"
	    && emptynull(list[current_row].Rest)=="" )
	    { current_col = "Rest"; }
	if( current_col != "" )
	    {
	    // alert("Setting current_row="+current_row+", current_col="+current_col);
	    break;
	    }
	}
    return draw_list();
    }

//////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////
function fix_quote( s )
    {
    return s.replace( "'", "&#39;", 'gm' );
    }

//////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////
function draw_list()
    {
    var s = "<table border=0>" + gen_list() + "</table>";

    tableidptr.innerHTML = s;
    // (s.replace("XL{","","gm")).replace("}","","gm");
    var focusptrid = window.document.getElementById("focuspt");
    if( focusptrid )
        { focusptrid.focus(); }
//    else
//        { alert("No focus!"); }
    return 0;
    }

//////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////
function emptynull(txt)
    {
    return ( (typeof(txt) == "undefined") ? "" : txt );
    }

//////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////
function jquote(txt)
    {
    return emptynull( txt );
    }

//////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////
function refocus( row, col )
    {
    current_row = row;
    current_col = col;
    return draw_list();
    }

//////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////
function findval( f, v )
    {
    var i;
    for( i=0; i<fields[f].vals.length; i++ )
        {
	if( fields[f].vals[i] == v ) { return i; }
	}
    return -1;
    }

//////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////
function gl_sortp( a, b, f )
    {
    var as = emptynull( list[a][f] ) + "";
    var bs = emptynull( list[b][f] ) + "";

    if( fields[f].vals )
        { return( findval(f,as) - findval(f,bs) ); }
    else
	{ return as.localeCompare( bs ); }
    }

//////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////
function gl_sort( a, b )
    {
    var res;
    for( var field_ind=0; field_ind<sortorder.length; field_ind++ )
        {
	if( res = gl_sortp( a, b, sortorder[field_ind] ) ) { return res; }
	}
    return res;
    }

//////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////
function set_sortorder( new_first )
    {
    var old_position = sortorder.indexOf( new_first );
    if( old_position >= 0 ) { sortorder.splice( old_position, 1 ); }
    sortorder.unshift( new_first );
    return draw_list();
    }

//////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////
function gen_list()
    {
    var sorted_list = [];
    for( var i=0; i<list.length; i++ ) { sorted_list.push( i ); }
    sorted_list.sort( function(a,b) { return gl_sort(a,b); } );

    var s = "<tr>";
    for( var field_ind=0; field_ind<table_fields.length; field_ind++ )
        {
	s += "<th onClick='javascript:set_sortorder(" + '"'
	    + table_fields[field_ind] + '"' + ");'>"
	    + fields[ table_fields[field_ind] ].xname;
	for( var ti=0; ti<sortorder.length; ti++ )
	    {
	    if( sortorder[ti] == table_fields[field_ind] )
	        {
		s += "(" + ti + ")";
		break;
		}
	    }
	s += "</th>";
	}
    s += "</tr>";

    for( var s_list_ind=0; s_list_ind<sorted_list.length; s_list_ind++ )
	{
	var list_ind = sorted_list[ s_list_ind ];
	s += "<tr>";
	for( var field_ind=0; field_ind<table_fields.length; field_ind++ )
	    {
	    var field = table_fields[field_ind];
	    if( current_row!=list_ind || current_col!=field )
		{
		var tdattr = "";
		var toprint = emptynull( list[list_ind][field] );
		if( fields[field].attr )
		    { tdattr = tdattr + " " + fields[field].attr; }
		if( fields[field].xvals )
		    {
		    for( var valind=0; valind<fields[field].xvals.length; valind++ )
			{
			if( list[list_ind][field] == fields[field].vals[valind] )
			    {
			    toprint = fields[field].xvals[valind];
			    if( fields[field].attrs && fields[field].attrs[valind] )
				{ tdattr = tdattr + " " + fields[field].attrs[valind]; }
			    }
			}
		    }
		else
		    {
		    var httpregex = /(http:[^"' ]*)/;
		    var mailtoregex = /([^, ]*@[^, ]*)/;
		    toprint = toprint.replace( httpregex, "<a target=_new href='$1'>$1</a>", "g" );
		    toprint = toprint.replace( mailtoregex, "<a href=mailto:$1>$1</a>", "g" );
		    }
		s += "<td"+fields[field].help+tdattr+" onClick='refocus("+list_ind+",\""+field+"\");'>" + toprint;
		}
	    else
		{
		s += "<td"+fields[field].help+">";
		if( fields[field].xvals )
		    {
		    s += "<select id=focuspt "+fields[field].help+" onChange='change_attr("+list_ind+",\""+field+"\",this);'>";
		    s += "<option value=''" +
			( list[list_ind][field] ? "" : " selected" )
			+ ">" + "XL(Set) " + fields[field].xname +"\n";
		    for( var valind=0; valind<fields[field].vals.length; valind++ )
			{
			var v = fields[field].vals[valind];
			s += "<option value='"+v+"'";
			if( v == list[list_ind][field] )
			    { s += " selected"; }
			s += ">" + fields[field].xvals[valind] + "\n";
			}
		    s += "</select>";
		    }
		else
		    {
		    s += "<input type=text "+fields[field].help+" placeholder='XL(Set) "+fields[field].xname+"' id=focuspt value='"+jquote(list[list_ind][field])+"' onChange='change_attr("+list_ind+",\""+field+"\",this);'>";
		    }
		}
	    var field_changed = list[list_ind][field+"_changed"];
	    if( 0 && field_changed )
	        { s+= "<br><font color=black>" + new Date(field_changed).toString() + "</font>"; }
	    s += "</td>";
	    }
	s += "</tr>";
	}
    s += "<tr><th colspan="+table_fields.length+">";
    s += "<button help='button_add_task' onClick='add_new_item();'>+</button><br>";
    s += "<center><table border=0 width=90%>";
    s += "<tr><th bgcolor='#8080c0'>";
    s += "<input type=button help='button_save_list' value='XL(Save)' onClick='save_lists();'>";
    s += "</th><th bgcolor='#8080c0'><input type=text help='field_input_list_name' value='";
    s += window.document.%%FORMNAME%%.listname.value;
    s += "' onChange='window.document.%%FORMNAME%%.listname.value=this.value;'";
    s += "></th><th bgcolor='#8080c0'>";
    s += "<input type=button help='button_clear_list' value='XL(Clear)' onClick='init_list();'>";
    s += "</th></tr></table>";
    s += "</center></th></tr>";
    return s;
    }

//////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////
function init_list()
    {
    if( confirm("XL(Clear list?)") )
	{
	list = new Array();
	return draw_list();
	}
    return 0;
    }

//////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////
function obj_to_str( obj, lvl )
    {
    var s = "";
    if( typeof(lvl) == "undefined" ) { lvl=0; }
    var cnt = lvl;
    var spc = "";
    while( cnt-- > 0 ) { spc += " "; }

    var need_sep = "";
    var ind = 0;
    var is_array = 1;
    for( v in obj )
        {
	if( v != ind ) { is_array = 0; }
	ind++;
	}

    for( v in obj )
        {
	s += need_sep;
	if( ! is_array )
	    {
	    s += spc;
	    if( /^[A-Za-z_][A-Za-z0-9_]*$/.test(v)
	     || /^[1-9]\d*$/.test(v)
	     || v == "0" )
		{ s += v; }
	    else
		{ s += '"' + v + '"'; }
	    s += ":";
	    }
	if( typeof( obj[v] ) == "object" )
	    { s += obj_to_str( obj[v], lvl+1 ); }
	else
	    {
	    if( is_array ) { s += spc; }
	    if( /^[1-9]\d*$/.test(obj[v]) || obj[v] == "0" )
	        { s += obj[v]; }
	    else
		{ s += '"' + obj[v] + '"'; }
	    }
	need_sep = ",\n";
	ind++;
	}
    if( is_array )
        { s = "\n" + spc + "[\n" + s + "\n" + spc +"]"; }
    else
        { s = "\n" + spc + "{\n" + s + "\n" + spc +"}"; }
    return s;
    }

//////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////
function save_list( varname, obj )
    {
    window.document.%%FORMNAME%%[varname].value = obj_to_str( obj, 0 );
    }

//////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////
function restore_list( varname, maxlen, defval )
    {
    var res;
    var val = window.document.%%FORMNAME%%[varname].value;
    if( val.length <= maxlen )
        { res = defval; }
    else
	{
	eval( "res = " + val + ";" );
	}
    return res;
    }

//////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////
function save_lists()
    {
    save_list( "list", list );
    save_list( "sortorder", sortorder );
    // window.document.%%FORMNAME%%.submit();
    var submit_button_id = window.document.getElementById("stupid_firefox_submit_button_bug");
    // alert("submit = " + window.document.%%FORMNAME%%.submit + " submitted" );
    submit_button_id.click();
    return 0;
    }

//////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////
function setup()
    {
    tableidptr = window.document.getElementById("tableid");

    if( 1 )
	{
	list = restore_list("list",7,list);
	sortorder = restore_list("sortorder",7,default_sortorder);
	}
    else
	{
	list = new Array();
	sortorder = new Array();
	}

    draw_list();
//    window.addEventListener(
//        'deviceorientation',
//	    function (e) { orientationChanged(e); },
//	    false);
    return 0;
    }
