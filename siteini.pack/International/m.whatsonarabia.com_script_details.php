<?php
        // create curl resource
        $ch = curl_init();
        $agent = 'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1; .NET CLR 1.0.3705; .NET CLR 1.1.4322)';
	$starttime = $_GET['starttime'];
	$channelid = $_GET['channelid'];
	$programid = $_GET['programid'];
	$scheduleid = $_GET['scheduleid'];

	// details page url
	$url = "http://m.whatsonarabia.com/ProgrammeDetails.aspx?random=42489&starttime=" . $starttime . "&channelid=" . $channelid . "&programid=" . $programid . "&scheduleid=" . $scheduleid . "&isFav=false";
       
	 //return the transfer as a string
	curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_USERAGENT, $agent);
	curl_setopt($ch, CURLOPT_HTTPHEADER, array('Accept-Encoding: gzip,deflate'));
       
        // $output contains the output string
        $output = curl_exec($ch);

        // close curl resource to free up system resources
        curl_close($ch);

        echo $output;

?>
