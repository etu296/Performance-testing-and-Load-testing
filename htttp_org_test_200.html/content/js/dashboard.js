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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.7716666666666666, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.945, 500, 1500, "https://httpbin.org/get"], "isController": false}, {"data": [0.9175, 500, 1500, "https://httpbin.org/patch"], "isController": false}, {"data": [0.9475, 500, 1500, "https://httpbin.org/base64/etu"], "isController": false}, {"data": [0.0, 500, 1500, "Test"], "isController": true}, {"data": [0.945, 500, 1500, "https://httpbin.org/forms/post"], "isController": false}, {"data": [0.945, 500, 1500, "https://httpbin.org/put"], "isController": false}, {"data": [0.38, 500, 1500, "https://httpbin.org/delete"], "isController": false}, {"data": [0.7566666666666667, 500, 1500, "https://httpbin.org/post"], "isController": false}, {"data": [0.965, 500, 1500, "https://httpbin.org/basic-auth/admin/admin123"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 2200, 0, 0.0, 564.9672727272731, 289, 3639, 317.0, 1297.9, 1448.5999999999985, 2351.9199999999983, 9.983527180152748, 8.743563177575183, 4.298660051823582], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["https://httpbin.org/get", 200, 0, 0.0, 368.8449999999999, 291, 1407, 313.0, 530.4000000000001, 686.9, 1327.5000000000005, 10.060868252930227, 7.555476256350922, 3.3994730620252525], "isController": false}, {"data": ["https://httpbin.org/patch", 200, 0, 0.0, 375.29500000000013, 291, 1564, 313.0, 581.3000000000001, 631.3499999999999, 1303.1500000000017, 10.057832537088256, 9.183665451345234, 4.252970203671109], "isController": false}, {"data": ["https://httpbin.org/base64/etu", 200, 0, 0.0, 358.9749999999999, 293, 1217, 312.0, 515.2, 639.6999999999999, 1200.0200000000018, 9.799118079372857, 2.756001959823616, 3.311030132288094], "isController": false}, {"data": ["Test", 200, 0, 0.0, 6214.6399999999985, 5188, 9945, 6041.0, 7282.200000000001, 7809.65, 9308.610000000006, 7.259001161440186, 69.93168599375726, 34.38101136033682], "isController": true}, {"data": ["https://httpbin.org/forms/post", 200, 0, 0.0, 367.77500000000003, 291, 1272, 313.0, 550.1, 669.75, 1215.6900000000003, 9.809691975671964, 15.67251569550716, 4.80904821463606], "isController": false}, {"data": ["https://httpbin.org/put", 400, 0, 0.0, 365.2325000000001, 289, 1441, 313.0, 546.0, 695.75, 1248.88, 19.201228878648234, 17.494869671658986, 8.044264832949308], "isController": false}, {"data": ["https://httpbin.org/delete", 200, 0, 0.0, 1463.7300000000002, 1196, 3639, 1292.5, 2080.0, 2416.2999999999997, 3217.6900000000005, 9.237021984112323, 8.44321540735267, 3.9239302373914646], "isController": false}, {"data": ["https://httpbin.org/post", 600, 0, 0.0, 734.51, 292, 3065, 322.0, 1446.5999999999995, 1719.6999999999996, 2624.710000000001, 2.75635224344103, 2.8335157502561112, 1.4068881242563591], "isController": false}, {"data": ["https://httpbin.org/basic-auth/admin/admin123", 200, 0, 0.0, 346.0249999999999, 294, 994, 316.0, 451.00000000000006, 597.6999999999992, 711.6600000000003, 9.787129924149744, 2.6474951064350383, 3.4599033520919993], "isController": false}]}, function(index, item){
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
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 2200, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
