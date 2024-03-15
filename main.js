const http = require('http');
const jsdom = require("jsdom");
const fs = require('fs');
const file_database = 'history.json';
const nosell = 'no sell';
const nobuy = 'no buy';
let current_date = new Date();

jsdom.JSDOM.fromURL("http://188.156.96.32/TraderPrice/TraderPrice.php").then(dom => {

    var database = {};
    if (fs.existsSync(file_database)) {
        database = JSON.parse(fs.readFileSync(file_database));
    }

    var rows = dom.window.document.querySelectorAll("tr");
    for (var i = 0; i < rows.length; ++i) {
        var row = rows[i];
        var cells = row.querySelectorAll("td");
        
        if (cells.length > 4) {
            
            var name = cells[0].innerHTML.toString();
            var bprice = parseFloat(cells[2].textContent);
            var sprice = parseFloat(cells[4].textContent);
            var entry = {
                'buy': bprice,
                'sell': sprice,
                'timestamp': current_date.getTime()
            };

            if (database[name]) {
                database[name]['prices'].push(entry);
            } else {
                database[name] = { 'prices': [ entry ] };
            }
        }
    }

    fs.writeFileSync(file_database, JSON.stringify(database));
});
