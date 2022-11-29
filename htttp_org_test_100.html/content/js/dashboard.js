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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.7641666666666667, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.92, 500, 1500, "https://httpbin.org/get"], "isController": false}, {"data": [0.92, 500, 1500, "https://httpbin.org/patch"], "isController": false}, {"data": [0.93, 500, 1500, "https://httpbin.org/base64/etu"], "isController": false}, {"data": [0.0, 500, 1500, "Test"], "isController": true}, {"data": [0.945, 500, 1500, "https://httpbin.org/forms/post"], "isController": false}, {"data": [0.935, 500, 1500, "https://httpbin.org/put"], "isController": false}, {"data": [0.36, 500, 1500, "https://httpbin.org/delete"], "isController": false}, {"data": [0.7583333333333333, 500, 1500, "https://httpbin.org/post"], "isController": false}, {"data": [0.95, 500, 1500, "https://httpbin.org/basic-auth/admin/admin123"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 1100, 0, 0.0, 579.584545454546, 292, 3572, 324.0, 1322.8, 1424.0, 2152.59, 5.247741085996164, 4.595966425191065, 2.2595476089383344], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["https://httpbin.org/get", 100, 0, 0.0, 393.83000000000004, 292, 1505, 319.5, 623.9000000000001, 732.2999999999998, 1504.3299999999997, 10.534077741493732, 7.910845491414726, 3.5593661118719053], "isController": false}, {"data": ["https://httpbin.org/patch", 100, 0, 0.0, 397.66, 293, 1394, 325.0, 571.9000000000001, 776.6999999999995, 1392.6599999999994, 10.163634515702816, 9.280271750177864, 4.297708735643866], "isController": false}, {"data": ["https://httpbin.org/base64/etu", 100, 0, 0.0, 375.71999999999974, 293, 1308, 317.5, 598.6, 694.4499999999994, 1304.119999999998, 8.677542519958347, 2.4405588337382853, 2.9320602655328014], "isController": false}, {"data": ["Test", 100, 0, 0.0, 6375.429999999999, 5296, 8956, 6181.5, 7458.7, 8214.249999999998, 8951.239999999998, 5.700929251467989, 54.92154986887863, 27.001471552363036], "isController": true}, {"data": ["https://httpbin.org/forms/post", 100, 0, 0.0, 385.24, 294, 1278, 315.0, 583.7000000000003, 745.1499999999996, 1277.79, 8.710042679209128, 13.91565412420521, 4.269962329065413], "isController": false}, {"data": ["https://httpbin.org/put", 200, 0, 0.0, 382.9650000000001, 294, 1336, 317.5, 582.4000000000002, 756.0499999999995, 1279.8600000000001, 17.826900793297085, 16.242674257955255, 7.468496523754346], "isController": false}, {"data": ["https://httpbin.org/delete", 100, 0, 0.0, 1488.55, 1218, 3335, 1346.0, 1952.8, 2096.5499999999997, 3332.0899999999983, 8.973438621679827, 8.202283740129218, 3.8119587894831297], "isController": false}, {"data": ["https://httpbin.org/post", 300, 0, 0.0, 734.9600000000003, 292, 3572, 353.0, 1359.4, 1538.6499999999996, 2343.9300000000003, 1.450193117383465, 1.4907909715810488, 0.7402027369978103], "isController": false}, {"data": ["https://httpbin.org/basic-auth/admin/admin123", 100, 0, 0.0, 363.6199999999999, 295, 1652, 321.0, 493.5, 638.7499999999993, 1642.6899999999953, 9.148293843198244, 2.474684955630775, 3.2340648156618794], "isController": false}]}, function(index, item){
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
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 1100, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
