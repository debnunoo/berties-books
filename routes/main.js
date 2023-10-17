module.exports = function(app, shopData) {
    const bcrypt = require('bcrypt');

    // Handle our routes
    app.get('/',function(req,res){
        res.render('index.ejs', shopData)
    });
    app.get('/about',function(req,res){
        res.render('about.ejs', shopData);
    });
    app.get('/search',function(req,res){
        res.render("search.ejs", shopData);
    });
    app.get('/search-result', function (req, res) {
        //searching in the database
        //res.send("You searched for: " + req.query.keyword);

        let sqlquery = "SELECT * FROM books WHERE name LIKE '%" + req.query.keyword + "%'"; // query database to get all the books
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./'); 
            }
            let newData = Object.assign({}, shopData, {availableBooks:result});
            console.log(newData)
            res.render("list.ejs", newData)
         });        
    });
    app.get('/register', function (req,res) {
        res.render('register.ejs', shopData);                                                                     
    });                                                                                                 
    app.post('/registered', function (req,res) {

        // setting the inputted password as the plainPassword
        const plainPassword = req.body.password;
        // initialising the number of rounds that should be applied on the Salt
        const saltRounds = 10;
        // creating the hashedPassword using the password entered and the salt
        const hashedPassword = bcrypt.hashSync(plainPassword, saltRounds);

        // function to hash the passwords
        bcrypt.hash(plainPassword, saltRounds, function(err, hashedPassword) {
            // Storing the hashed password within the database
           
            /* creating a query to insert the user's details into the users database (in mysql)
            - details from the register.ejs input form */
            let sqlquery = "INSERT INTO users (username, first_name, last_name, email, hashedPassword) VALUES (?,?,?,?,?)";
            // execute sql query
            let newrecord = [req.body.user, req.body.first, req.body.last, req.body.email, hashedPassword];
            db.query(sqlquery, newrecord, (err, result) => {
                if (err) {
                    return console.error(err.message);
                }
                else {
                    //res.send(' Your details has been registered, '+ req.body.first + req.body.last);
                    console.log('Successful!');

                    // saving data in database
                    // username = d.york, password = blackyellowred
                    // j.eyre, washedlineplay
                    // j.smith, playpianoletter
                    // o.lonely, oldrosstrust
                    const success_message = 'Hello ' + req.body.first + ' ' + req.body.last + ' you are now registered! We will send an email to you at ' 
                    + req.body.email + '.Your password is: ' + req.body.password + ' and your hashed password is: ' + hashedPassword;
                
                    res.send(success_message);
                }
            });
        })                                                                                    
    }); 

    app.get('/login', function(req, res) {

        res.render('login.ejs', shopData); 

    });

    app.post('/loggedin', function(req, res) {

        let sqlquery = `SELECT username, hashedPassword
                        FROM users
                        WHERE username = ?`

                        console.log(req.body.user)
                        console.log(req.body.password)
        //let newrecord = [req.body.user]
        
        db.query(sqlquery, req.body.user, (err, result) => {
            if (err) {
                
                return console.error(err.message);
            }
            else
            {
                console.log(result);
                //res.send("Done")
                hashedPassword = result[0].hashedPassword;
                console.log(hashedPassword)

                // Compare the password supplied with the password in the database
                bcrypt.compare(req.body.password, hashedPassword, function(err, result) {
                    if (err) {
                        // Handling error
                        res.send('Sorry, your password seems to be incorrect');
                    }
                    else if (result == true) {
                        // TODO: Send message
                        res.send('Login successful');
                    }
                    else {
                        // TODO: Send message
                        res.send('Please try again');
                    };
                });                
            }
        }); 
    });
        
    app.get('/deleteuser', function(req, res) {

        res.render('deleteusers.ejs', shopData);

    });

    app.post('/deleteuser', function(req, res) {

        let sqlquery = `DELETE FROM users
                        WHERE username = ? `

        const user_to_delete = req.body.user
        console.log(user_to_delete)
        

        //let newrecord = [req.body.user];
        
        db.query(sqlquery, user_to_delete, (err, result) => {
            if (err) {
                res.write("User could not be deleted. Please try again!");
                return console.error(err.message);
            }
            else {
                res.redirect('/');
                //res.write(' All information related to username ('+ req.body.user + ') has been deleted');
            }
        });


    });


    // Route that lists the users registered on the app
    app.get('/listusers', function(req, res) {

        let sqlquery = `SELECT username, first_name, last_name, email 
                        FROM users
                        GROUP BY username, first_name, last_name, email`

        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./'); 
            }
                let newData = Object.assign({}, shopData, {availableUsers:result});
                console.log(newData)
                res.render("listusers.ejs", newData)
            });                

    });

    app.get('/list', function(req, res) {
        let sqlquery = "SELECT * FROM books"; // query database to get all the books
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./'); 
            }
            let newData = Object.assign({}, shopData, {availableBooks:result});
            console.log(newData)
            res.render("list.ejs", newData)
         });
    });

    app.get('/addbook', function (req, res) {
        res.render('addbook.ejs', shopData);
     });
 
     app.post('/bookadded', function (req,res) {
           // saving data in database
           let sqlquery = "INSERT INTO books (name, price) VALUES (?,?)";
           // execute sql query
           let newrecord = [req.body.name, req.body.price];
           db.query(sqlquery, newrecord, (err, result) => {
             if (err) {
               return console.error(err.message);
             }
             else
             res.send(' This book is added to database, name: '+ req.body.name + ' price '+ req.body.price);
             });
       });    

       app.get('/bargainbooks', function(req, res) {
        let sqlquery = "SELECT * FROM books WHERE price < 20";
        db.query(sqlquery, (err, result) => {
          if (err) {
             res.redirect('./');
          }
          let newData = Object.assign({}, shopData, {availableBooks:result});
          console.log(newData)
          res.render("bargains.ejs", newData)
        });
    });       

}
