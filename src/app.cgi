#!/usr/bin/perl -w
#
#indx#	app.cgi - Yet another application for maintaining todo lists
#@HDR@	$Id: app.cgi,v 1.1 2020/08/12 21:17:31 chris Exp chris $
#@HDR@
#@HDR@	Copyright (c) 2020-2026 Christopher Caldwell (Christopher.M.Caldwell0@gmail.com)
#@HDR@
#@HDR@	Permission is hereby granted, free of charge, to any person
#@HDR@	obtaining a copy of this software and associated documentation
#@HDR@	files (the "Software"), to deal in the Software without
#@HDR@	restriction, including without limitation the rights to use,
#@HDR@	copy, modify, merge, publish, distribute, sublicense, and/or
#@HDR@	sell copies of the Software, and to permit persons to whom
#@HDR@	the Software is furnished to do so, subject to the following
#@HDR@	conditions:
#@HDR@	
#@HDR@	The above copyright notice and this permission notice shall be
#@HDR@	included in all copies or substantial portions of the Software.
#@HDR@	
#@HDR@	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY
#@HDR@	KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
#@HDR@	WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE
#@HDR@	AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
#@HDR@	HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
#@HDR@	WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
#@HDR@	FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
#@HDR@	OTHER DEALINGS IN THE SOFTWARE.
#
#hist#	2024-04-19 - c.m.caldwell@alumni.unh.edu - Created
#hist#	2026-02-19 - Christopher.M.Caldwell0@gmail.com - Standard header
########################################################################
#doc#	app.cgi - Yet another application for maintaining todo lists
########################################################################

use strict;
use MIME::Lite;
use lib "/usr/local/lib/perl";
use cpi_cgi qw(show_vars);
use cpi_setup qw(setup);
use cpi_escape qw(javascript_esc);
use cpi_user qw(logout_select);
use cpi_db qw(dbadd dbdel dbget dbpop dbput dbread dbwrite
 DBread DBwrite DBpop DBget DBput DBdelkey DBadd DBdel DBnewkey);
use cpi_file qw(cleanup fatal read_file);
use cpi_translate qw(xprint);


#$cpi_vars::TABLE_TAGS	= "bgcolor=\"#c0c0d0\"";
$cpi_vars::TABLE_TAGS	= "USECSS";

our $FORMNAME		= "form";

&setup(
	allow_account_creation=>1,
	require_valid_email=>1,
	require_valid_address=>1,
	Qpreset_language=>"en",
	Qrequire_captcha=>1
	);

#########################################################################
#	Variable declarations.						#
#########################################################################

our $AGENT		= $ENV{HTTP_USER_AGENT};

our $form_top;

$cpi_vars::SENDMAIL = "/usr/lib/sendmail";

#########################################################################
#	Return true if the first item appears in the remaining list.	#
#########################################################################
sub inlist
    {
    my( $item, @list ) = @_;
    return grep( $_ eq $item, @list );
    }

#########################################################################
#	Used by the common administrative functions.			#
#########################################################################
sub footer
    {
    my( $mode ) = @_;

    $mode = "admin" if( !defined($mode) );

    my $s = <<EOF;
<script>
function footerfunc( fnc )
    {
    with( window.document.footerform )
	{
	func.value = fnc;
	submit();
	}
    }
</script>
<form name=footerform method=post>
<input type=hidden name=func>
<input type=hidden name=SID value="$cpi_vars::SID">
<input type=hidden name=USER value="$cpi_vars::USER">
EOF
    $s .= <<EOF;
    <center><table $cpi_vars::TABLE_TAGS border=1>
    <tr><th><table $cpi_vars::TABLE_TAGS><tr><th
EOF
    foreach my $button (
	"dirmode:XL(Directory)" )
        {
	my( $butdest, $buttext ) = split(/:/,$button);
	$s .= "><input type=button help='button_$butdest'"
	    . " onClick='footerfunc(\"$butdest\");'" .
	    ( ($butdest eq $mode) ? " style='background-color:cyan'" : "" ) .
	    " value=\"$buttext\"\n";
	}
    $s .= ">" . &logout_select("footerform") . <<EOF;
	</th></tr>
	</table></th></tr></table></center></form>
EOF
    &xprint( $s );
    }

#########################################################################
#	Return true if we need to print content header.			#
#########################################################################
sub check_if_app_needs_header()
    {
    return ! &inlist(($cpi_vars::FORM{func}||""),"download","view");
    }

#########################################################################
#	Display list of all the lists.					#
#########################################################################
sub directory_screen
    {
    my $s = $form_top;
    my @lists = &DBget( "lists" );
    $s .= <<EOF;
$cpi_vars::HELP_IFRAME
<input type=hidden name=listind value="">
<center><table border=1>
<tr><th>XL(Select)</th><th>XL(List name)</th><th>XL(Last modified)</th></tr>
EOF
    foreach my $listind ( @lists )
        {
	$s .= "<tr><th><input type=button onClick='todo_func(\"show\",\"$listind\");'></th><td>"
	    . &DBget("list",$listind,"name")
	    . "</td><td>"
	    . &DBget("list",$listind,"modified")
	    . " XL(by) "
	    . &DBget("list",$listind,"modifier")
	    . "</td></tr>";
	}
    $s .= <<EOF;
<tr><th colspan=3><input type=button onClick='todo_func(\"show\",\"\");' value="XL(Add)"></th></tr>
</table></center></form>
EOF
    $s =~ s+%%JSCRIPT%%++gs;
    &xprint( $s );
    &footer("directory");
    }

#########################################################################
#	Create some e-mail.						#
#########################################################################
sub generate_email
    {
    my( $dest ) = @_;

    my $s = $form_top;

    &DBread() if( $dest );

    my @table_entries = ();
    my @lists = &DBget( "lists" );
    foreach my $listind ( @lists )
        {
	my @items = ();
        my $list = ( &DBget( "list", $listind, "data" ) || "" );
	foreach my $itempiece ( split(/type:/,$list) )
	    {
	    if( $itempiece =~ /"(.*)".*quantity:(\d+)/s )
		{
		push( @items, "<td align=right>$2</td><td>$1</td>" );
		}
	    }
	next if( ! @items );
	push( @table_entries,
	    "<td colspan=2>&nbsp;<p><b>"
		. &DBget("list",$listind,"name")
		. "</b> XL(modified) "
		. &DBget("list",$listind,"modified")
		. " XL(by) "
		. &DBget("list",$listind,"modifier")
		. "</th>",
	    "<th align=right>Quantity</th><th align=left>Items</th>",
	    @items);
	}
    if( ! $cpi_vars::URL )
	{
	$cpi_vars::PROG = $0;
	$cpi_vars::PROG=~ s+^.*/++;
	$cpi_vars::PROG = "Groceries.cgi" if( $cpi_vars::PROG eq "app.cgi" );
	$cpi_vars::URL = "http://www.brightsands.com/~chris/$cpi_vars::PROG";
	}

    $s .= <<EOF
<center><table border=1><tr>
EOF
    . join("</tr>\n<tr>",@table_entries) . "</tr></table>"
    . "<a href=$cpi_vars::URL>Application</a></center>\n";
    if( ! $dest )
	{
	&xprint( $s );
	&footer("directory");
	}
    else
        {
	if( ! @table_entries )
	    {
	    print "No appropriate items in any grocery list.\n";
	    }
	else
	    {
	    my $mime_msg = MIME::Lite->new
		(
		From	=> "groceries\@www.brightsands.com",
		To		=> $dest,
		Subject	=> "Grocery lists",
		Type	=> "Multipart/mixed"
		) || die("Cannot setup mime:  $!");

	    $s =~ s/XL\((.*?)\)/$1/gs;

	    $mime_msg->attach
		(
		Type	=> "text/html",
		Data	=> "<html><head></head><body>$s</body></html>"
		) || die("Cannot attach to mime message:  $!");

	    open( OUT, "| $cpi_vars::SENDMAIL -t 2>&1" )
		|| die("Cannot run $cpi_vars::SENDMAIL:  $!");
	    print OUT $mime_msg->as_string;
	    close( OUT );
	    }
	}
    &cleanup(0);
    }

#########################################################################
#	Turn a filename into the probable menu item name.		#
#########################################################################
sub filename_to_item
    {
    my( $fn ) = @_;
    $fn =~ s+.*/++;
    $fn =~ s+\.jpg$++;
    $fn =~ s/_/ /g;
    return $fn;
    }

#########################################################################
#	Default screen							#
#########################################################################
sub show_list
    {
    my $s = $form_top;
    $_=$cpi_vars::BASEDIR; # Eliminate message about variable used only once
    my $jscript=&read_file("$cpi_vars::BASEDIR/lib/$cpi_vars::PROG.js");

    my $sortorder = ( &DBget( "sortorder", $cpi_vars::FORM{listind}, "data" ) || "" );
    my $list = ( &DBget( "list", $cpi_vars::FORM{listind}, "data" ) || "" );
    my $listname = ( &DBget( "list", $cpi_vars::FORM{listind}, "name" ) || "" );

    $list = &javascript_esc( $list, '"', "&quot;" );
    $sortorder = &javascript_esc( $sortorder, '"', "&quot;" );

    $s .= <<EOF;
$cpi_vars::HELP_IFRAME
<input type=hidden name=listind value="$cpi_vars::FORM{listind}">
<input type=hidden name=sortorder value="$sortorder">
<input type=hidden name=list value="$list">
<input type=hidden name=listname value="$listname">
<input type=hidden name=displaying value=show_list>
<center id=tableid></center>
<script type="text/javascript">setup();</script>
</form>
EOF

    $s =~ s+%%JSCRIPT%%+$jscript+gs;
    $s =~ s+%%FORMNAME%%+$FORMNAME+gs;
    $s =~ s+%%WEB%%+$cpi_vars::PROG+gs;

    &xprint( $s );
    &footer("list");
    }

#########################################################################
#	Write form data to database.					#
#########################################################################
sub update_list
    {
    my $datetime = `date +"%m/%d/%Y %H:%M"`;
    chomp( $datetime );

    my @probs;
    foreach my $vn ( "list", "listind", "listname", "sortorder" )
        {
        push(@probs,"$vn XL(is truncated)") if( ! $cpi_vars::FORM{$vn} );
        }

    if( @probs )
        {
        &xprint( join("<br>",@probs) );
        &cleanup();
        return;
        }

    &DBwrite();
    if( $cpi_vars::FORM{list} )
	{
	&DBput( "sortorder", $cpi_vars::FORM{listind},
	    "data", $cpi_vars::FORM{sortorder} );
	&DBput( "list", $cpi_vars::FORM{listind},
	    "data", $cpi_vars::FORM{list} );
	&DBput( "list", $cpi_vars::FORM{listind},
	    "name", $cpi_vars::FORM{listname} );
	&DBput( "list", $cpi_vars::FORM{listind},
	    "modifier", $cpi_vars::USER );
	&DBput( "list", $cpi_vars::FORM{listind},
	    "modified", $datetime );
	&DBadd( "lists", $cpi_vars::FORM{listind} );
	}
    else
        {
	&DBdel( "lists", $cpi_vars::FORM{listind} );
	$cpi_vars::FORM{listind} = "";
	}
    &DBpop();
    }


#########################################################################
#	Handle regular user commands					#
#########################################################################
sub user_logic
    {
    my $fnc = ( $cpi_vars::FORM{func} || "" );
    if( $fnc ne "" && $fnc ne "email" && $fnc ne "dirmode" && $fnc ne "dologin" && $fnc ne "show" )
        { &fatal("Unrecognized function \"$fnc\"."); }
    if( $fnc eq "show" )
        {
	if( $cpi_vars::FORM{arg} )
	    { $cpi_vars::FORM{listind} = $cpi_vars::FORM{arg}; }
	else
	    {
	    $cpi_vars::FORM{listind} = `date +%s`;
	    chomp( $cpi_vars::FORM{listind} );
	    }
	}
    &update_list() if( $cpi_vars::FORM{displaying} );
    if( $fnc eq "email" )
	{
	generate_email();
	}
    elsif( $cpi_vars::FORM{listind} )
        { &show_list(); }
    else
	{ &directory_screen(); }
    }

#########################################################################
#	Main								#
#########################################################################

if( ($ENV{SCRIPT_NAME}||"") eq "" )
    {
    my $fnc = ( $ARGV[0] || "" );
    if(    $fnc eq "reindex" )		{ reindex( $ARGV[1] );	}
    elsif( $fnc eq "print" )		{ dump_indices();	}
    elsif( $fnc eq "sanity" )		{ sanity();		}
    elsif( $fnc =~ /email=(.*)/ )	{ generate_email($1);	}
    else
	{
	&fatal("XL(Usage):  $cpi_vars::PROG.cgi (dump|dumpaccounts|dumptranslations|undump|undumpaccounts|undumptranslations) [ dumpname ]",0)
	}
    }

my $using_agent =
    $ENV{HTTP_USER_AGENT}
    || $cpi_vars::FORM{genform}
    || $cpi_vars::FORM{client}
    || "unknown";
my $agent =
#    ( $cpi_vars::FORM{genform} ? "PhoneGap_" . $cpi_vars::FORM{genform}
#    : $cpi_vars::FORM{client} ? "PhoneGap_" . $cpi_vars::FORM{client}
#    : $ENV{HTTP_USER_AGENT}
#    );
    (($cpi_vars::FORM{genform} || $cpi_vars::FORM{client}) ? "PhoneGap_" : "") .
    ( $using_agent =~ /iPhone/ ? "iPhone"
        : ( $using_agent =~ /Wget/ ? "iPhone"
	: ( $using_agent =~ /iPad/ ? "iPad"
	: $using_agent ) ) );

printf STDERR ( "CMC got to %d.\n", __LINE__ );
print STDERR "Using_agent=[$using_agent], Agent=[$agent]\n";

#my($nam,$pass,$uid,$gid,$quota,$comment,$gcos,$dir,$shell)
#    = getpwnam("$cpi_vars::USER");

#&show_vars()
#    if( ! &inlist(($cpi_vars::FORM{func}||""),"download","view") );

$form_top = <<EOF;
<script>
//////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////
function todo_func( fnc, val )
    {
    with( window.document.$FORMNAME )
	{
	func.value = fnc;
	if( typeof(val) != "undefined" ) { arg.value = val ; }
	submit();
	}
    }
%%JSCRIPT%%
</script>
</head><body $cpi_vars::BODY_TAGS>
<form name=$FORMNAME method=post ENCTYPE="multipart/form-data">
<input type=submit id=stupid_firefox_submit_button_bug style='display:none'>
<input type=hidden name=func>
<input type=hidden name=arg>
<input type=hidden name=SID value="$cpi_vars::SID">
<input type=hidden name=USER value="$cpi_vars::USER">
EOF

&user_logic();

&cleanup(0);
