module.exports = function(app, shopData) {

    // allows HTTP requests to be made to an API and returns the result
    const request = require('request');
    // adding here in order to access the apiKey within the config.js file
    const config = require('./config.js');
    // all routes within main.js would be able to access this
    const redirectLogin = (req, res, next) => {
        // checking to see if the a session has been created for the user
        if (!req.session.userId ) {
            // if not, redirecting to the login page
            res.redirect('./login')
        } 
        // if so, application will keep running
        else { next (); }
    }

    // added here so all routes can access it
    const { check, validationResult, body } = require('express-validator');

    // calling on bcrypt - so it'll be used within the different routes
    const bcrypt = require('bcrypt');

    // Handle our routes
    // Home page
    app.get('/',function(req,res){
        res.render('index.ejs', shopData)
    });
    // About page
    app.get('/about',function(req,res){
        res.render('about.ejs', shopData);
    });
    // Search page
    app.get('/search',function(req,res){
        res.render("search.ejs", shopData);
    });
    // Route that handle that results when search is complete
    app.get('/search-result', function (req, res) {
        //searching in the database
        let sqlquery = "SELECT * FROM books WHERE name LIKE '%" + req.sanitize(req.query.keyword) + "%'"; // query database to get all the books
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
    // User registration page
    app.get('/register', function (req,res) {
        res.render('register.ejs', shopData);                                                                     
    });             

    // isEmail() = function of express-validator that validates a form input as an email address                                                                                    
    var loginValidation = [
        check('email').isEmail().normalizeEmail(),
        check('plainPassword').isLength({ min: 8 }).notEmpty()]

    // Route to handle and process a user being registered
    // forcing user to enter a correct email input
    app.post('/registered', loginValidation, function (req, res) {
        const errors = validationResult(req);
        // if invalid email is inputted, user is redirected to the register page
        if (!errors.isEmpty()) {
            const errMessage = 'Password was too short. <a href="/register"> Please try again </a>';
            res.send(errMessage);
        }
        else { 
            // setting the inputted password as the plainPassword
            const plainPassword = req.sanitize(req.body.password);
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
                // selecting the fields (from the HTML body) that would be used within the query
                let newrecord = [req.sanitize(req.body.user), req.sanitize(req.body.first), req.sanitize(req.body.last), req.sanitize(req.body.email), hashedPassword];
                // execute sql query
                db.query(sqlquery, newrecord, (err, result) => {
                    if (err) {
                        return console.error(err.message);
                    }
                    else {
                        console.log('Successful!');

                        // saving data in database
                        // username = d.york, password = blackyellowred
                        // j.eyre, washedlineplay
                        // j.smith, playpianoletter
                        // o.lonely, oldrosstrust

                        /* writing a message that will displayed within the console when the user registers */
                        const success_message = 'Hello ' + req.sanitize(req.body.first) + ' ' + req.sanitize(req.body.last) + ' you are now registered! We will send an email to you at ' 
                        + req.body.email + '.Your password is: ' + req.sanitize(req.body.password) + ' and your hashed password is: ' + hashedPassword;
                        console.log(success_message);

                        // redirecting the user to the home page when logged in
                        res.redirect(301, '/');
                    }
                });
            }); 
        }                                                                                   
    }); 

    // Login page
    app.get('/login', function(req, res) {
        res.render('login.ejs', shopData); 
    });
    // Route that handle and process user logging in
    app.post('/loggedin', [check('user').notEmpty(), check('password').notEmpty()] ,function(req, res) {
        const errors = validationResult(req);
        // if invalid email is inputted, user is redirected to the register page
        if (!errors.isEmpty()) {
            const errMessage = 'Please enter the correct details. <a href="/login"> Please try again </a>';
            res.send(errMessage);
        }
        else {
            // query to select the user's username and hashedPassword from the database
            let sqlquery = `SELECT username, hashedPassword
                            FROM users
                            WHERE username = ?`

                            console.log(req.body.user)
                            console.log(req.body.password)
            //let newrecord = [req.body.user]
            
            // executing the query
            db.query(sqlquery, req.sanitize(req.body.user), (err, result) => {
                if (err) {
                    
                    return console.error(err.message);
                }
                else
                {
                    console.log(result);
                    // getting the hashsedPassword from the query
                    hashedPassword = result[0].hashedPassword;
                    console.log(hashedPassword)

                    // Compare the password supplied with the password in the database
                    bcrypt.compare(req.sanitize(req.body.password), hashedPassword, function(err, result) {
                        if (err) {
                            // Handling error
                            res.send('Sorry, your password seems to be incorrect');
                        }
                        else if (result == true) {
                            // Sending message to client to say successful
                            //res.send('Login successful');

                            // Save user session here, when login is successful
                            req.session.userId = req.sanitize(req.body.user);
                            // redirecting the user to the homepage after they've logged in successfully
                            res.redirect('/');

                        }
                        else {
                            // Sending message to client to make them aware something has gone wrong
                            res.send('Please try again');
                        };
                    });                
                }
            }); 
        }
    });
    // Route to handle and process when user logs out of the application
    app.get('/logout', redirectLogin, (req,res) => {
        // destroying the session after the user has logged out
        req.session.destroy(err => {
        if (err) {
          return res.redirect('./')
        }
            // sending message to user to indicate logging out has been successful
            res.send('You are now logged out. Please return to <a href='+'./'+'>Home</a>');
        })
    });
    // Deleting User page
    app.get('/deleteuser', redirectLogin, function (req, res) {
            res.render('deleteusers.ejs', shopData);
    });
    // Route to handle and process a user being deleted from the server
    app.post('/deleteuser', redirectLogin, function(req, res) {

        // query that deletes user from the database
        let sqlquery = `DELETE FROM users
                        WHERE username = ? `

        // getting the username from the HTML body that will be deleted
        const user_to_delete = req.sanitize(req.body.user)
        console.log(user_to_delete)
        
        // executing sql query
        db.query(sqlquery, user_to_delete, (err, result) => {
            if (err) {
                // error message to be sent to the browser if deletion of user doesn't work
                res.write("User could not be deleted. Please try again!");
                return console.error(err.message);
            }
            else {
                // redirecting to the homepage when finished
                res.redirect('/');
                //res.write(' All information related to username ('+ req.body.user + ') has been deleted');
            }
        });
    });

    // Route that lists the users registered on the app
    app.get('/listusers', redirectLogin, function(req, res) {
        // selecting user information that will be displayed on the page
        let sqlquery = `SELECT username, first_name, last_name, email 
                        FROM users
                        GROUP BY username, first_name, last_name, email`

        // executing query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./'); 
            }
                let newData = Object.assign({}, shopData, {availableUsers:result});
                console.log(newData)
                res.render("listusers.ejs", newData)
            });                
    });
    // Listing Books page
    app.get('/list', redirectLogin, function(req, res) {
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
    // Adding Book page
    app.get('/addbook', redirectLogin, function (req, res) {
        res.render('addbook.ejs', shopData);
     });
    // Route to handle and process when a book has been added
    app.post('/bookadded', redirectLogin, function (req,res) {
        // saving data in database
        let sqlquery = "INSERT INTO books (name, price) VALUES (?,?)";
        // Selecting fields that will be inputted into the database from the HTML body
        let newrecord = [req.sanitize(req.body.name), req.sanitize(req.body.price)]
        // execute sql query
        db.query(sqlquery, newrecord, (err, result) => {
            if (err) {
                return console.error(err.message);
            }
            else {
                // Message to send when book has been added to the database
                res.send('This book is added to database, name: '+ req.sanitize(req.body.name) + ' price '+ req.sanitize(req.body.price));
            }
        });
    });    
    // Bargain books page
    app.get('/bargainbooks', function(req, res) {
    // Query to select all books that are less than £20
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

    // Getting and rendering the form users will input the weather
    app.get('/weather-form', function(req, res) {
        res.render('weather.ejs', shopData);
    })

    // Incorporating a Web API - a weather API
    app.get('/weather', function(req, res) {  
        let apiKey = config.apiKey;
        // Variable will get the city name inputted by the user
        let city = req.query.city;
        let url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`

        request(url, function(err, response, body) {
            if(err) {
                console.log('error:', error);
            }
            else {
                //res.send(body);
                // Making the weather forecast more human-friendly
                // parsing the body information, which turns the JSON into a Javascript array
                var weather = JSON.parse(body);
                console.log(weather);
                // Adding error handling in case the app crashes
                if(weather !== undefined && weather.main !== undefined) {
                    var wmsg = 'It is ' + weather.main.temp + ' degrees in ' + weather.name +
                    '! <br> The humidity now is: ' + weather.main.humidity + '. But the wind is '
                    + weather.wind.speed + weather.wind.deg;
                    res.send(wmsg);
                    //res.render('weather.ejs', shopData)
                }
                // Message to be sent back if user enters a non-existent place name
                else {
                    res.send("No data found. Please try again");
                }
            }
        });
    }); 
    app.get('/api', function(req, res) {
        let sqlquery = "SELECT * FROM books";

        db.query(sqlquery, (err, result) => {
            if(err) {
                res.redirect('./');
            }
            // Returning the results as a JSON object
            res.json(result);
        });
    });

}
