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

    var data = {"OkPercent": 36.36363636363637, "KoPercent": 63.63636363636363};
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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.20972222222222223, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.0, 500, 1500, "https://httpbin.org/get"], "isController": false}, {"data": [0.0, 500, 1500, "https://httpbin.org/patch"], "isController": false}, {"data": [0.9433333333333334, 500, 1500, "https://httpbin.org/base64/etu"], "isController": false}, {"data": [0.0, 500, 1500, "Test"], "isController": true}, {"data": [0.9583333333333334, 500, 1500, "https://httpbin.org/forms/post"], "isController": false}, {"data": [0.0, 500, 1500, "https://httpbin.org/put"], "isController": false}, {"data": [0.0, 500, 1500, "https://httpbin.org/delete"], "isController": false}, {"data": [0.15555555555555556, 500, 1500, "https://httpbin.org/post"], "isController": false}, {"data": [0.14833333333333334, 500, 1500, "https://httpbin.org/basic-auth/admin/admin123"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 3300, 2100, 63.63636363636363, 691.4839393939401, 0, 11543, 1.0, 2264.1000000000026, 3010.0, 9485.309999999985, 15.095651537469237, 26.142191173847014, 2.56776174944878], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["https://httpbin.org/get", 300, 300, 100.0, 0.4600000000000001, 0, 29, 0.0, 1.0, 1.0, 10.980000000000018, 34.614053305642095, 77.34077535479405, 0.0], "isController": false}, {"data": ["https://httpbin.org/patch", 300, 300, 100.0, 0.3066666666666668, 0, 5, 0.0, 1.0, 1.0, 2.0, 34.62603878116344, 77.36755540166206, 0.0], "isController": false}, {"data": ["https://httpbin.org/base64/etu", 300, 0, 0.0, 336.17999999999984, 269, 1147, 288.0, 523.7, 632.0999999999998, 883.7000000000003, 41.8351694324362, 11.766141402872682, 14.135711546506762], "isController": false}, {"data": ["Test", 300, 300, 100.0, 7606.323333333333, 2119, 17593, 6215.5, 14466.000000000002, 15640.4, 16208.25, 12.476087498960327, 237.6628064438992, 23.343929343757797], "isController": true}, {"data": ["https://httpbin.org/forms/post", 300, 0, 0.0, 362.88666666666694, 271, 1535, 331.5, 484.90000000000003, 580.0499999999995, 1181.8300000000002, 42.69247189412267, 68.20789454959441, 20.929317276220292], "isController": false}, {"data": ["https://httpbin.org/put", 600, 600, 100.0, 0.3250000000000001, 0, 28, 0.0, 1.0, 1.0, 1.0, 69.33210076265311, 154.91391264155305, 0.0], "isController": false}, {"data": ["https://httpbin.org/delete", 300, 300, 100.0, 3324.913333333335, 0, 11543, 1332.5, 9694.700000000003, 10719.65, 11468.33, 15.073104557101944, 33.6885849495051, 0.0], "isController": false}, {"data": ["https://httpbin.org/post", 900, 600, 66.66666666666667, 415.8533333333331, 0, 4120, 1.0, 1178.0, 1340.8999999999999, 2145.430000000001, 4.340361503887035, 8.28653001962808, 0.9974919341615386], "isController": false}, {"data": ["https://httpbin.org/basic-auth/admin/admin123", 300, 0, 0.0, 2333.366666666667, 1109, 3471, 2798.5, 3033.9, 3087.65, 3332.2200000000007, 30.23583954847813, 8.179030815359805, 10.688841715379963], "isController": false}]}, function(index, item){
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
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["Non HTTP response code: java.net.UnknownHostException/Non HTTP response message: httpbin.org", 2100, 100.0, 63.63636363636363], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 3300, 2100, "Non HTTP response code: java.net.UnknownHostException/Non HTTP response message: httpbin.org", 2100, "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": ["https://httpbin.org/get", 300, 300, "Non HTTP response code: java.net.UnknownHostException/Non HTTP response message: httpbin.org", 300, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["https://httpbin.org/patch", 300, 300, "Non HTTP response code: java.net.UnknownHostException/Non HTTP response message: httpbin.org", 300, "", "", "", "", "", "", "", ""], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": ["https://httpbin.org/put", 600, 600, "Non HTTP response code: java.net.UnknownHostException/Non HTTP response message: httpbin.org", 600, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["https://httpbin.org/delete", 300, 300, "Non HTTP response code: java.net.UnknownHostException/Non HTTP response message: httpbin.org", 300, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["https://httpbin.org/post", 900, 600, "Non HTTP response code: java.net.UnknownHostException/Non HTTP response message: httpbin.org", 600, "", "", "", "", "", "", "", ""], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
