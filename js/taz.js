var runTaz;
var convertId;
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
			   		var HourList = [], WeekdayList = [], HeatmapList = [];
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

					var _keys = [];
						for(var key in sortByReplySent) _keys.push({Id:key, Count: sortByReplySent[key] });
					sortByReplySent = _keys.sort(function(a,b){
						return b.Count-a.Count;
					});

					for(var i in sortByHour)
						HourList.push({X:i,Count:sortByHour[i]});
					

					for(var i in sortByDay){

						WeekdayList.push({X:daysKor[i], Count: sortByDay[i], DayOfWeek: i});

						for(var j in sortByHour)
							HeatmapList.push({Day:i,Hour:j,Count:heatmap[i][j]});

					}

					drawBarChart('#hour-stats',HourList);
					drawBarChart('#weekday-stats',WeekdayList);
					drawHeatmap('#heatmap-stats',HeatmapList);
					
					for(var i=0;i<Math.min(20,sortByReplySent.length);i++)
						$('#reply-stats tbody').append('<tr><th class="text-center">{0}(<a href="#;" onclick="convertId($(this).parent(),{0})">아이디 보기</a>)</th><td class="text-center">{1}</td></tr>'.format(sortByReplySent[i].Id, sortByReplySent[i].Count));
					
					$('#loading').hide();
					$('#result').show();
	    		}
	    	});
		}
		catch(error) {
			alert('Error : ' + error.message);
		}
	}


	convertId = function(obj,id){
		$(obj).html('{0} (변환 중)'.format(id));
		$.ajax({
			url: 'https://twitter.com/intent/user?user_id='+id,
			type: 'get',
			success: function (response) {
				$(obj).html('<a href="https://twitter.com/{0}">{0}</a>'.format($($.parseHTML(response.responseText)).find('.nickname').text()));
			},
			error: function(jqXHR, status, error){
				$(obj).html('{0} <span class="error">실패</span>'.fomat(id));
			}
		});
	}

	$('#reply-stats').stupidtable();

	$(window).on("resize", function() {
	    var targetWidth = $('svg').parent().width(),
	    	aspect = $('svg').width() / $('svg').height();
	    $('svg').attr("width", targetWidth);
	    $('svg').attr("height", Math.round(targetWidth / aspect))
	});
});