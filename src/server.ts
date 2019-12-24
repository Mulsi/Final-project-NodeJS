import express = require('express')
import { Metric, MetricsHandler } from './metrics'
import path = require('path')
import bodyparser = require('body-parser')
import session = require('express-session')
import levelSession = require('level-session-store')
import { UserHandler, User } from './users'
let ejs = require('ejs');

const dbUser: UserHandler = new UserHandler('./db/users')
const dbMet: MetricsHandler = new MetricsHandler('./db/metrics')

const app = express()
const LevelStore = levelSession(session)
const authRouter = express.Router()
const userRouter = express.Router()

const port: string = process.env.PORT || '8080'

/* User sessions */
app.use(session({
    secret: 'my very secret phrase',
    store: new LevelStore('./db/sessions'),
    resave: true,
    saveUninitialized: true
}))



app.use('/user', userRouter)
app.use(express.static(path.join(__dirname, '/public')))
app.use(bodyparser.json())
app.use(bodyparser.urlencoded({extended: true}))
app.set('views', __dirname + "/views")
app.set('view engine', 'ejs');

/* Metrics */


/* Old one */
// app.get('/', (req: any, res: any) => {
//   res.write('Hello world')
//   res.end()
// })


app.get(
    '/hello/:name',
    (req: any, res: any) => {
        res.render('index.ejs', {name: req.params.name})
    })


/* Old one as well */
/*
app.get(
    '/metrics',
    (req: any, res: any) => {
        dbMet.getAll((err: Error | null, result: any) => {
            if (err) throw err
            res.status(200).send(result)
        })
    }
)
*/


//Get user's metrics (don't need to be connected)
app.get('/metrics', (req: any, res: any) => {
    console.log("Username: ", req.session.user.username)
    dbMet.getWithUser(req.session.user.username, (err: Error | null, metrics: Metric[] | null) => {
      if (err) throw err
      if (metrics !== null) {
        let DATA : object[]= []
        metrics.sort(function(a : Metric, b : Metric) { //Sort timestamp in the object "metrics" 
          if (Number(a.timestamp) > Number(b.timestamp)) {
            return 1;
          }
          if (Number(a.timestamp) < Number(b.timestamp)) {
            return -1;
          }
          return 0;
        });
        metrics.forEach((data)=> {
          DATA.push({timestamp :Number(data.timestamp), value : Number(data.value)})
        })
        if (DATA.length == 0) res.status(404).render('error.ejs', {})
        else res.status(200).send(DATA)
      }
      
    })
  })



/* Dont think we need this part as well */

/*
app.get(
    '/metrics/:id',
    (req: any, res: any) => {
        dbMet.getOne(req.params.id, (err: Error | null, result: any) => {
            if (err) throw err
            res.status(200).send(result)
        })
    }
)



app.delete(
    '/metrics/:id',
    (req: any, res: any) => {
        dbMet.getActualKey(req.params.id, (err: Error | null, result: string) => {
            if (err) throw err
            dbMet.delete(result, (err: Error | null) => {
                if (err) throw err
                res.status(200).send('Deleted: ' + result)
            })
        })

    }
)
*/

app.post('/metrics', (req: any, res: any) => {
    console.log(req.body)
    if (req.body.timestamp !== "" && !isNaN(Number(req.body.value)) && !isNaN(Number(req.body.timestamp))){
        dbMet.save(req.session.user.username, req.body, (err: Error | null) => {
            if (err) throw err
            res.redirect("/")
        })
    } else{
        res.redirect("/")
    }
})

/* User authentication and creation */
app.use(authRouter)

authRouter.get('/login', (req: any, res: any) => {
    res.render('login', false)
})

// authRouter.get('/login/:error', (req: any, res: any) => {
//     //Alternative render method for giving input to login form    
//     res.render('login', req.params.error)
// })

authRouter.get('/signup', (req: any, res: any) => {
    res.render('signup')
})


authRouter.get('/chart', (req: any, res: any) => {
    res.render('chart')
})

authRouter.get('/logout', (req: any, res: any) => {
    console.log("Anything", req.session.loggedIn)
    delete req.session.loggedIn;
    console.log(req.session.loggedIn)
    delete req.session.user;
    res.redirect('/login')
})


//delete a user's metric
authRouter.post('/delete', (req: any, res: any, next: any) => {
    if (!isNaN(Number(req.body.timestamp)) && req.body.timestamp !=="") {
      dbMet.delete(req.session.user.username, req.body.timestamp)
      res.redirect('/')
    }
  })

//delete all metrics of a user
authRouter.post('/deleteAll', (req: any, res: any, next: any) => {
    console.log(req.session.user.username)
    dbMet.deleteAllByUser(req.session.user.username)
    res.redirect('/')
})


//Add a new metric in user's database
authRouter.post('/add', (req: any, res: any, next: any) => {
    if (req.body.timestamp !=="" && req.body.value !=="" && !isNaN(Number(req.body.value)) && !isNaN(Number(req.body.timestamp))) {
      dbMet.save(req.session.user.username, req.body.timestamp, req.body.value)
      res.redirect('/')
    }
  })


//Datetime into timestamp
authRouter.post('/convert', (req: any, res: any, next: any) => {
    var time : string = String(new Date(req.body.dateTime).getTime())
    var Datetime : string = "The timestamp of "+req.body.dateTime+" is : "+time+""
    var Timestamp : string = ""
    res.render('index', { username: req.session.user.username, datetime : Datetime, timestamp : Timestamp})
  })


app.post('/login', (req: any, res: any, next: any) => {
    dbUser.get(req.body.username, (err: Error | null, result?: User) => {
        if (result === undefined || !result.validatePassword(req.body.password)) {
            console.log('Failed to log in, because result was undefined, or password was incorrect')
            // res.redirect('/login/bad_login_error')
            res.redirect("/login")
        } else if (err) {
            console.log("Failed due to some unknown error");
            // res.redirect('/login/unknown_error')
            res.redirect("/login")
        } else {
            req.session.loggedIn = true
            req.session.user = result
            res.redirect('/')
        }
    })
})

app.post('/signup', (req: any, res: any, next: any) => {
    dbUser.get(req.body.username, function (err: Error | null, result?: User) {
        if (!err || result !== undefined) {
            res.status(409).send("user already exists")
        } else {
            let newUser = new User(req.body.username, req.body.email, req.body.password, false);
            dbUser.save(newUser, function (err: Error | null) {
                if (err) next(err)
                else {
                    res.status(201);
                    res.redirect('/login');
                }
                // else res.status(201).send("user persisted")
            })
        }
    })
})


app.get(
    // This is mainly for testing purposes
    '/login/allusers',
    (req: any, res: any) => {
        dbUser.getAllUsernames((err: Error | null, result: any) => {
            if (err) throw err
            res.status(200).send(result)
        })
    }
)



/* User stuff? */

userRouter.post('/', (req: any, res: any, next: any) => {
    dbUser.get(req.body.username, function (err: Error | null, result?: User) {
        if (!err || result !== undefined) {
            res.status(409).send("user already exists")
        } else {
            dbUser.save(req.body, function (err: Error | null) {
                if (err) next(err)
                else res.status(201).send("user persisted")
            })
        }
    })
})

userRouter.get('/:username', (req: any, res: any, next: any) => {
    dbUser.get(req.params.username, function (err: Error | null, result?: User) {
        if (err || result === undefined) {
            res.status(404).send("user not found")
        } else res.status(200).json(result)
    })
})



// }) // <= Dont know why this is here, but am scared of removing it

const authCheck = function (req: any, res: any, next: any) {
    if (req.session.loggedIn) {
        next()
    } else {
        res.redirect('/login')
    }
}

app.get('/', authCheck, (req: any, res: any) => {
    var datetime : string = ""
    var timestamp : string = ""
    res.render('index', { 
        username: req.session.user.username,
        email: req.session.user.email,
        metrics: req.session.user.metrics,
        datetime : datetime,
        timestamp : timestamp
    })
})

/* Listener */ 

app.listen(port, (err: Error) => {
  if (err) {
    throw err
  }
  console.log(`server is listening on port ${port}`)
})
