var runTaz;
$(document).ready(function(){
	String.prototype.format = function() {
	    var formatted = this;
	    for (var i = 0; i < arguments.length; i++) {
	        var regexp = new RegExp('\\{'+i+'\\}', 'gi');
	        formatted = formatted.replace(regexp, arguments[i]);
	    }
	    return formatted;
	};

    if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
        alert('The File APIs are not fully supported by your browser. Fallback required.');
        return;
    }

    //set file drop event 
    var dropzoneText = $('.dropzone').text();
    $('.dropzone')
    .on('dragover',function(e){
    	e.stopPropagation();
    	e.preventDefault();
    	e.originalEvent.dataTransfer.dropEffect = 'copy';
    })
    .on('drop',function(e){
    	e.stopPropagation();
    	e.preventDefault();

    	var files = e.originalEvent.dataTransfer.files;
    	runTaz(files[0]);
    })
    .on('click',function(){
    	$('#fileloader').trigger('click');
    });

    $('.panel-heading').click(function(){
    	$(this).next().toggle();
    })
    
    runTaz = function(__file__){
    	
    	try{

	    	$('#init').hide();
	    	$('#loading').show();
	    	if(__file__.name.substr(__file__.name.length-4) != '.csv'){
	    		$('#init').show();
	    		$('#loading').hide();
	    		throw new Error("The file is not csv file.");
	    	}

	    	Papa.parse(__file__,{
	    		header: true,
	    		complete: function(result){

			   		var sortByReplySent = {}, sortByHour = [], sortByDay = [], heatmap = {}, retweetCount = 0;
			   		var daysKor = ['월','화','수','목','금','토','일'];

					for(var i=0; i<7;i++){
						sortByDay[i] =0;
						heatmap[i] = {};
						for(var j=0; j<24;j++) {
							sortByHour[j] =0;
							heatmap[i][j] = 0;
						}
					}

					for (var i in result.data){
						var $t = result.data[i];
						
						if($t.tweet_id == "") continue;

						$('#loading-status').text("Parsing Tweets ({0} of {1})".format(i,$t.length));
						var d = new Date($t.timestamp);
						if($t.retweeted_status_id != '') retweetCount++;

						if($t.in_reply_to_user_id != '' && $t.retweeted_status_user_id == ''){
							if(sortByReplySent[$t.in_reply_to_user_id]) sortByReplySent[$t.in_reply_to_user_id]++;
							else sortByReplySent[$t.in_reply_to_user_id] = 1;
						}

						sortByHour[d.getHours()]++;
						sortByDay[d.getDay()]++;
						heatmap[d.getDay()][d.getHours()]++;
					}

					start = performance.now();
					var _keys = [];
						for(var key in sortByReplySent) _keys.push({key, val: sortByReplySent[key] });
					sortByReplySent = _keys.sort(function(a,b){
						return b.val-a.val;
					});
					$('#loading').hide();
					$('#result').show();

					for(var i in sortByHour){
						$('#hour-stats').append('<tr><th class="text-center">{0}시 ~ {1}시</th><td class="text-center">{2}</td></tr>'.format(i, parseInt(i)+1,  sortByHour[i]));

						$('#heatmap-stats').append('<tr><th class="text-center">{0}시 ~ {1}시</th><td class="text-center">{2}</td><td class="text-center">{3}</td><td class="text-center">{4}</td><td class="text-center">{5}</td><td class="text-center">{6}</td><td class="text-center">{7}</td><td class="text-center">{8}</td></tr>'
							.format(i,parseInt(i)+1, heatmap[0][i], heatmap[1][i],heatmap[2][i],heatmap[3][i],heatmap[4][i],heatmap[5][i],heatmap[6][i]));
					}

					for(var i in sortByDay)
						$('#weekday-stats').append('<tr><th class="text-center">{0}</th><td class="text-center">{1}</td></tr>'.format(daysKor[i], sortByDay[i]));  			

	    		}
	    	});
	   			

	   		
		}
		catch(error) {
			alert('Error : ' + error.message);
		}
	}

	$('#hour-stats, #weekday-stats, #heatmap-stats').stupidtable();
});
