const express = require("express");
const app = express();
const dblib = require("./dblib.js");
const path = require("path");
const multer = require("multer");
const upload = multer();

app.use(express.urlencoded({ extended: false }));

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
});

app.use(express.static("public"));

app.listen(process.env.PORT || 3000, () => {
    console.log("Server started (http://localhost:3000/) !");
});

app.get("/", (req, res) => {
    res.render("index");
});

// GET manage
app.get("/views/manage.ejs", async (req, res) => {
    const totRecs = await dblib.getTotalRecords();
    const customer = {
        cusId: "",
        cusFname: "",
        cusLname: "",
        cusState: "",
        cusSalesYTD: "",
        cusSalesPrev: ""
    };
    res.render("manage", {
        type: "get",
        totRecs: totRecs.totRecords,
        customer: customer
    });
});

// POST manage
app.post("/views.nanage.ejs", async (req, res) => {
    const totRecs = await dblib.getTotalRecords();
    dblib.findCustomer(req.body)
        .then(result => {
            res.render("manage", {
                type: "post",
                totRecs: totRecs.totRecords,
                result: result,
                customer: req.body
            })
        })
        .catch(err => {
            res.render("manage", {
                type: "post",
                totRecs: totRecs.totRecords,
                result: `Unexpected Error: ${err.message}`,
                customer: req.body
            });
        });
});

//get create
app.get("/views/create.ejs", (req, res) => {
    res.render("create", { model: {} });
});

//post create
app.post("/views/create.ejs", (req, res) => {
    const sql = "INSERT INTO customer (cusId, cusFname, cusLname, cusState, cusSalesYTD, cusSalesPrev) VALUES ($1, $2, $3, $4, $5, $6)";
    const customer = [req.body.cusId, req.body.cusFname, req.body.cusLname, req.body.cusState, req.body.cusSalesYTD, req.body.cusSalesPrev];
    db.run(sql, customer, err => {
        if (err) {
            return console.error(err.message);
        }
        res.redirect("/views/manage.ejs");
    });
});

//get import
app.get("/views/import.ejs", async (req, res) => {
    const totRecs = await dblib.getTotalRecords();
    const customer = {
        cusId: "",
        cusFname: "",
        cusLname: "",
        cusState: "",
        cusSalesYTD: "",
        cusSalesPrev: ""
    };
    res.render("import", {
        type: "get",
        totRecs: totRecs.totRecords,
        customer: customer
    });
});
// post import
app.post("/views/import.ejs", upload.single('filename'), (req, res) => {
    if (!req.file || Object.keys(req.file).length === 0) {
        message = "Error: Import file not uploaded";
        return res.send(message);
    };
    const buffer = req.file.buffer;
    const lines = buffer.toString().split(/\r?\n/);

    lines.forEach(line => {
        customer = line.split(",");
        const sql = "INSERT INTO CUSTOMER(cusId, cusFname, cusLname, cusState, cusSalesYTD, cusSalesPrev ) VALUES ($1, $2, $3, $4, $5, $6)";
        pool.query(sql, customer, (err, result) => {
            if (err) {
                console.log(`Insert Error.  Error message: ${err.message}`);
            } else {
                console.log(`Inserted successfully`);
            }
        });
    });
    message = `Processing Complete - Processed ${lines.length} records`;
    res.send(message);
});

//get Export
// app.get("/views/export.ejs", (req, res) => {
//    const totRecs = await dblib.getTotalRecords();
//     const customer = {
//         cusId: "",
//         cusFname: "",
//         cusLname: "",
//         cusState: "",
//         cusSalesYTD: "",
//         cusSalesPrev: ""
//     };
//     res.render("export", {
//         type: "get",
//         totRecs: totRecs.totRecords,
//         customer: customer
//     });
// });

app.get("/views/export.ejs", (req, res) => {
    res.render("export", { model: {} });
});
// post export   
app.post("/views/export.ejs", (req, res) => {
    const sql = "SELECT * FROM customer ORDER BY cusId";
    pool.query(sql, [], (err, result) => {
        var message = "";
        if (err) {
            message = `Error - ${err.message}`;
            res.render("export", { message: message })
        } else {
            var output = "";
            result.rows.forEach(customer => {
                output += `${customer.cusId},${customer.cusFname},${customer.cusLname},${customer.cusState},${customer.cusSalesYTD},${customer.cusSalesPrev},\r\n`;
            });
            res.header("Content-Type", "text/csv");
            res.attachment("export.csv");
            return res.send(output);
        };
    });
});