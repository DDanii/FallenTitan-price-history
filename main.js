const http = require('http');
const jsdom = require("jsdom");
const fs = require('fs');
const file_database = 'history2.json';
let current_date = new Date().getTime();

var multiple = [
    'rag_baseitems_wall_clock_kit','Ammo_357','M4_CarryHandleOptic','AliceBag_Black','bastard_btr70_nogun_camo','bastard_bigfoot_Doors_Hood_green',
    'bastard_bigfoot_Doors_Hood_white','bastard_bigfoot_Doors_Hood_tan','bastard_bigfoot_Doors_Hood_red','bastard_bigfoot_Doors_Hood_blue',
    'Candy_SWATSUV_Wheel_Green','Candy_Titus_Camonet','Candy_Titus_Camonet_WDL','Candy_Titus_Camonet_CSAT_Grey','Candy_Titus_Camonet_WDL2',
    'Candy_Titus_Camonet_White','SIBPolice_blade1','SIBPolice_blade2','SIBPolice_blade3','SIBPolice_blade4','SIBPolice_bladem1','SIBPolice_bladem2'
];

var n = x => Number.isFinite(x) ? x : 0;

var changed = (last, prev) => {
    if (last.buy != prev.buy || last.sell != prev.sell) return true; 
    if (last.prices.length != prev.prices.length) return true;
    for (var i = 0; i < last.prices.length; ++i) {
        if (last.prices[i].buy != prev.prices[i].buy || last.prices[i].sell != prev.prices[i].sell) {
            return true; 
        }
    }
    return false;
};

jsdom.JSDOM.fromURL("http://188.156.96.32/TraderPrice/TraderPrice.php").then(dom => {

    var collected = {};
    var current_category = null;
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
                'cat': current_category
            };

            if (collected[name]) {
                collected[name].prices.push(entry);
            } else {
                collected[name] = { 'timestamp': current_date, 'buy': entry.buy, 'sell': entry.sell, 'prices': [ entry ] };
            }
        } else if (cells.length > 3) {
            current_category = row.querySelector("th").textContent.toString().trim();
        }
    }

    // calculate main price for collected items
    for (var k in collected) {
        var entry = collected[k];
        if (multiple[k] && entry.prices.length > 1) {
            for (var i = 0; i < entry.prices.length; ++i) {
                if (entry.sell != entry.prices[i].sell) entry.sell = Math.max(entry.sell, entry.prices[i].sell);
                if (entry.buy != entry.prices[i].buy) entry.buy = Math.min(entry.buy, entry.prices[i].buy);
            }
        }
    }

    // update database
    var database = {};
    if (fs.existsSync(file_database)) {
        database = JSON.parse(fs.readFileSync(file_database));
    }

    for (var k in collected) {
        var last = collected[k];

        if (database[k] && database[k].length > 0) {

            var prev = database[k][ database[k].length - 1];
            if (changed(last, prev)) {
                database[k].push( last );

                var db = n(last.buy) - n(prev.buy);
                var ds = n(last.sell) - n(prev.sell);
                console.log([k, db, ds, 'updated']);
            }
        } else {
            database[k] = [ last ];
            console.log([k, n(last.buy), n(last.sell), 'new']);
        }
    }

    fs.writeFileSync(file_database, JSON.stringify(database));
});
