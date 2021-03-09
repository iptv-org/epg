<?php
        // create curl resource
        $ch = curl_init();
        $agent = 'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1; .NET CLR 1.0.3705; .NET CLR 1.1.4322)';
	$name = $_GET['name'];
	$id = $_GET['id'];
	$displayname = $_GET['displayname'];
	$daydate = $_GET['daydate'];
	$dayname = $_GET['dayname'];

	$name = urlencode($name);
	$displayname = urlencode($displayname);

	$daydate = "&starttime=" . $daydate;

	$skip = "Today";
	if ($dayname == $skip) {
			$daydate = "";
	}

        // epg grabbing enable only 1 $url line below // disables line
	$url = "http://m.whatsonarabia.com/ChannelDetails.aspx?random=42489&channelid=" . $id . "&channelname=" . $name . $daydate . "&valtext=" . $dayname . "&channeldisplayname=" . $displayname;
        // channels.xml creation
	//$url = "http://m.whatsonarabia.com/ChannelList.aspx?type=All&random=42489";

        //return the transfer as a string
	curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_USERAGENT, $agent);
	curl_setopt($ch, CURLOPT_HTTPHEADER, array('Accept-Encoding: gzip,deflate', 'X-Requested-With: XMLHttpRequest'));
       
        // $output contains the output string
        $output = curl_exec($ch);

        // close curl resource to free up system resources
        curl_close($ch);

        echo $output;

?>
