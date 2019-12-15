import express = require('express')
import { MetricsHandler } from './metrics'
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

app.get('/', (req: any, res: any) => {
  res.write('Hello world')
  res.end()
})


app.get(
    '/hello/:name',
    (req: any, res: any) => {
        res.render('index.ejs', {name: req.params.name})
    })

app.get(
    '/metrics',
    (req: any, res: any) => {
        dbMet.getAll((err: Error | null, result: any) => {
            if (err) throw err
            res.status(200).send(result)
        })
    }
)

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


app.post('/metrics/:id', (req: any, res: any) => {
    dbMet.save(req.params.id, req.body, (err: Error | null) => {
        if (err) throw err
        res.status(200).send(req.params.id)
        //res.status(200).send("Generic message for testing")
    })
})

/* User authentication and creation */
app.use(authRouter)

authRouter.get('/login', (req: any, res: any) => {
    res.render('login')
})

authRouter.get('/signup', (req: any, res: any) => {
    res.render('signup')
})

authRouter.get('/index', (req: any, res: any) => {
    res.render('index')
})

authRouter.get('/chart', (req: any, res: any) => {
    res.render('chart')
})

authRouter.get('/logout', (req: any, res: any) => {
    delete req.session.loggedIn
    delete req.session.user
    res.redirect('/login')
})


app.post('/login', (req: any, res: any, next: any) => {
    dbUser.get(req.body.username, (err: Error | null, result?: User) => {
        if (err) next(err)
        if (result === undefined || !result.validatePassword(req.body.password)) {
            console.log('Failed to log in, because result was undefined, or password was incorrect')
            res.redirect('/login')
        } else {
            req.session.loggedIn = true
            req.session.user = result
            res.redirect('/index')
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
    } else res.redirect('/login')
}

app.get('/', authCheck, (req: any, res: any) => {
    res.render('index', { name: req.session.username })
})

/* Listener */ 

app.listen(port, (err: Error) => {
  if (err) {
    throw err
  }
  console.log(`server is listening on port ${port}`)
})
