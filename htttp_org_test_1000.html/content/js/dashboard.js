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

    var data = {"OkPercent": 99.92727272727272, "KoPercent": 0.07272727272727272};
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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.7972083333333333, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.963, 500, 1500, "https://httpbin.org/get"], "isController": false}, {"data": [0.952, 500, 1500, "https://httpbin.org/patch"], "isController": false}, {"data": [0.952, 500, 1500, "https://httpbin.org/base64/etu"], "isController": false}, {"data": [0.0, 500, 1500, "Test"], "isController": true}, {"data": [0.953, 500, 1500, "https://httpbin.org/forms/post"], "isController": false}, {"data": [0.958, 500, 1500, "https://httpbin.org/put"], "isController": false}, {"data": [0.4775, 500, 1500, "https://httpbin.org/delete"], "isController": false}, {"data": [0.8001666666666667, 500, 1500, "https://httpbin.org/post"], "isController": false}, {"data": [0.9525, 500, 1500, "https://httpbin.org/basic-auth/admin/admin123"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 11000, 8, 0.07272727272727272, 459.88818181818135, 247, 2806, 275.0, 1075.0, 1153.0, 1419.9799999999996, 37.952366330040675, 33.20152455841559, 16.34135091447952], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["https://httpbin.org/get", 1000, 1, 0.1, 298.6030000000002, 247, 1316, 262.0, 412.79999999999995, 560.7999999999997, 700.8500000000001, 11.148023455441349, 8.360048671573654, 3.7668126128737374], "isController": false}, {"data": ["https://httpbin.org/patch", 1000, 0, 0.0, 310.0030000000001, 247, 1259, 264.0, 488.79999999999995, 580.8999999999999, 911.8200000000002, 11.148023455441349, 10.16821670642795, 4.713959136920024], "isController": false}, {"data": ["https://httpbin.org/base64/etu", 1000, 0, 0.0, 307.1430000000003, 247, 1166, 258.0, 477.79999999999995, 603.9499999999999, 792.7900000000002, 11.103462059470141, 3.122848704225978, 3.7517557349381536], "isController": false}, {"data": ["Test", 1000, 8, 0.8, 5058.770999999995, 4341, 7041, 4994.0, 5690.9, 5893.799999999999, 6571.530000000001, 10.449648369332373, 100.55728260486222, 49.4929634680293], "isController": true}, {"data": ["https://httpbin.org/forms/post", 1000, 2, 0.2, 308.42400000000066, 248, 1364, 263.0, 478.9, 584.9499999999999, 742.8300000000002, 11.116051578479324, 17.738851816084928, 5.449470598043575], "isController": false}, {"data": ["https://httpbin.org/put", 2000, 2, 0.1, 305.07749999999936, 248, 1388, 263.0, 460.9000000000001, 576.0, 802.7300000000002, 22.14030310074945, 20.145665032435545, 9.275576201388198], "isController": false}, {"data": ["https://httpbin.org/delete", 1000, 0, 0.0, 1160.7260000000006, 1023, 2675, 1096.0, 1356.8, 1469.0, 2153.96, 10.911074740861975, 9.962748908892525, 4.635075695581015], "isController": false}, {"data": ["https://httpbin.org/post", 3000, 2, 0.06666666666666667, 582.8669999999987, 248, 2806, 280.0, 1148.0, 1202.9499999999998, 1504.8699999999972, 10.449903164230678, 10.730512998808711, 5.333804740076075], "isController": false}, {"data": ["https://httpbin.org/basic-auth/admin/admin123", 1000, 1, 0.1, 315.1150000000002, 248, 1202, 264.5, 484.0, 583.6999999999996, 992.96, 11.098532773967282, 3.0022398226454463, 3.923504750172027], "isController": false}]}, function(index, item){
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
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["502/Bad Gateway", 8, 100.0, 0.07272727272727272], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 11000, 8, "502/Bad Gateway", 8, "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": ["https://httpbin.org/get", 1000, 1, "502/Bad Gateway", 1, "", "", "", "", "", "", "", ""], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": ["https://httpbin.org/forms/post", 1000, 2, "502/Bad Gateway", 2, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["https://httpbin.org/put", 2000, 2, "502/Bad Gateway", 2, "", "", "", "", "", "", "", ""], "isController": false}, {"data": [], "isController": false}, {"data": ["https://httpbin.org/post", 3000, 2, "502/Bad Gateway", 2, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["https://httpbin.org/basic-auth/admin/admin123", 1000, 1, "502/Bad Gateway", 1, "", "", "", "", "", "", "", ""], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
