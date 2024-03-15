const http = require('http');
const jsdom = require("jsdom");
const fs = require('fs');
const file_database = 'history.json';
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
            
            var name = cells[0].innerHTML.toString().trim();
            var bprice = parseFloat(cells[2].textContent);
            var sprice = parseFloat(cells[4].textContent);
            var entry = {
                'buy': Number.isFinite(bprice) ? bprice : null,
                'sell': Number.isFinite(sprice) ? sprice : null,
                'timestamp': current_date.getTime()
            };

            if (database[name]) {
                var prices = database[name]['prices'];
                if (prices.length > 0) {

                    var existed_entry_index = prices.findIndex( (x) => x.timestamp == entry.timestamp );
                    if (existed_entry_index > -1) {
                        var e = prices[existed_entry_index];
                        if (e.sell != entry.sell) e.sell = Math.max(e.sell, entry.sell);
                        if (e.buy != entry.buy) e.buy = Math.min(e.buy, entry.buy);
                    } else {
                        database[name]['prices'].push(entry);
                    }                    
                } else {
                    database[name]['prices'].push(entry);
                }
            } else {
                database[name] = { 'prices': [ entry ] };
            }
        }
    }

    // remove latest price if didnt changed
    for (var k in database) {
        var prices = database[k]['prices'];
        if (prices.length > 1) {
            var last = prices[prices.length - 1];
            var prev = prices[prices.length - 2];

            if (last.buy == prev.buy && last.sell == prev.sell) {
                prices.splice(prices.length - 1, 1);
            }
        }
    }

    fs.writeFileSync(file_database, JSON.stringify(database));
});