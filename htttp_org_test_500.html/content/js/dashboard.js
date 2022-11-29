/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 100.0, "KoPercent": 0.0};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.7123333333333334, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.904, 500, 1500, "https://httpbin.org/get"], "isController": false}, {"data": [0.888, 500, 1500, "https://httpbin.org/patch"], "isController": false}, {"data": [0.894, 500, 1500, "https://httpbin.org/base64/etu"], "isController": false}, {"data": [0.0, 500, 1500, "Test"], "isController": true}, {"data": [0.882, 500, 1500, "https://httpbin.org/forms/post"], "isController": false}, {"data": [0.896, 500, 1500, "https://httpbin.org/put"], "isController": false}, {"data": [0.268, 500, 1500, "https://httpbin.org/delete"], "isController": false}, {"data": [0.677, 500, 1500, "https://httpbin.org/post"], "isController": false}, {"data": [0.889, 500, 1500, "https://httpbin.org/basic-auth/admin/admin123"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 5500, 0, 0.0, 707.913272727271, 274, 9152, 305.0, 1472.7000000000016, 2260.399999999998, 4493.919999999998, 21.91156492396687, 19.19012677334279, 9.434578292013434], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["https://httpbin.org/get", 500, 0, 0.0, 426.37999999999977, 279, 2440, 298.0, 690.8000000000001, 1302.85, 1967.6400000000021, 10.948585442760795, 8.222131060042043, 3.699424378120347], "isController": false}, {"data": ["https://httpbin.org/patch", 500, 0, 0.0, 438.42999999999995, 280, 2565, 297.0, 742.2000000000003, 1307.75, 1655.98, 10.916077198497947, 9.967316582612872, 4.61588029975548], "isController": false}, {"data": ["https://httpbin.org/base64/etu", 500, 0, 0.0, 417.7259999999998, 274, 2479, 294.0, 677.0, 1166.9, 1653.820000000001, 10.206789556412925, 2.8706595627411353, 3.4487785024598363], "isController": false}, {"data": ["Test", 500, 0, 0.0, 7787.048000000001, 4993, 18097, 7343.0, 10741.2, 11533.8, 13701.640000000001, 8.378998877214151, 80.72150773800546, 39.6856880414928], "isController": true}, {"data": ["https://httpbin.org/forms/post", 500, 0, 0.0, 446.6460000000002, 277, 3038, 295.0, 1073.1000000000006, 1191.8, 1710.96, 10.209498917793114, 16.31126975538041, 5.005047321027484], "isController": false}, {"data": ["https://httpbin.org/put", 1000, 0, 0.0, 411.9330000000003, 275, 1997, 298.0, 675.9, 999.8499999999998, 1564.4100000000005, 20.68808573142727, 18.849593737716447, 8.667176541779588], "isController": false}, {"data": ["https://httpbin.org/delete", 500, 0, 0.0, 2064.263999999998, 1130, 8696, 1439.5, 3993.3000000000006, 5302.799999999999, 6894.610000000001, 9.557488292076844, 8.73614164197649, 4.060065827200612], "isController": false}, {"data": ["https://httpbin.org/post", 1500, 0, 0.0, 916.1979999999995, 277, 9152, 396.0, 2166.4000000000005, 2746.900000000001, 4195.540000000001, 6.160670280926565, 6.333136961968129, 3.144508789222934], "isController": false}, {"data": ["https://httpbin.org/basic-auth/admin/admin123", 500, 0, 0.0, 421.1399999999997, 279, 2690, 297.0, 691.9000000000001, 1141.85, 1565.7700000000002, 10.205956196036007, 2.7607908850605214, 3.6079649833642913], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": []}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 5500, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
