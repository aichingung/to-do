const express = require('express')
const app = express()
const { Pool } = require('pg')
const expressLayouts = require('express-ejs-layouts')
const methodOverride = require('method-override')
const bcrypt = require('bcrypt')
const session = require('express-session')
const { user } = require('pg/lib/defaults')


let password = 'aiching'

let db

if(process.env.NODE_ENV === 'production') {

  db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl : {
      rejectUnauthorized: false
    }
  })

} else {
  
  db = new Pool({
    user: 'postgres',
    database: 'todo',
    password: password
  })

}

app.set('view engine', 'ejs')

app.use(express.urlencoded({extended: true}))

app.use(methodOverride(function (req, res) {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    // look in urlencoded POST bodies and delete it
    var method = req.body._method
    delete req.body._method
    return method
  }
}))

app.use(expressLayouts);

app.use(express.static('public'))

app.use(session({ 
  secret: 'keyboard cat', 
  resave: true, 
  saveUninitialized: true 
}))

app.use(function(req, res, next) {
  if (req.session.userId) {
    res.locals.isLoggedIn = true
  
    const sql = `select * from users where id = $1`

    db.query(sql, [req.session.userId], (err, dbRes) => {
      res.locals.currentUser = dbRes.rows[0]
      next()
    })

  } else {
    res.locals.isLoggedIn = false
    res.locals.currentUser = {}
    next()
  }
})

app.get('/', (req, res) => {

    res.render('index', {userId: req.session.userId})
  })

app.get('/todo/newaccount', (req, res) => {
  res.render('signup')
})

app.post('/todo/signup', (req, res, next) => {
  if (req.body.username === '' || req.body.email === '' || req.body.password === '') {
    res.redirect('/todo/newaccount')
    return
  }
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(req.body.password, salt, (err, passwordDigest) => {
  
        let sql = `INSERT INTO users (username, email, password_digest) VALUES ($1, $2, $3);`
  
        db.query(sql, [req.body.username, req.body.email, passwordDigest], (err, dbRes) => {
          if (err) {
            next(err)
            return
          }
          res.redirect('/')
        })
    });
  });
})

app.get('/todo/login', (req, res) => {
  res.render('login')
})

app.post('/todo/login', (req, res) => {

  if (req.body.email === '' || req.body.password === '') {
    res.redirect('/todo/login')
    return
  }

  const sql = `select * from users where email = $1;`

  db.query(sql, [req.body.email], (err, dbRes) => {
    console.log(err);
    // console.log(dbRes.rows.length);
    if (dbRes.rows.length === 0) {
      res.render('login')
      return
    }
    
    let user = dbRes.rows[0] 

    // console.log(req.body.password);
    // console.log(user.password_digest);

    bcrypt.compare(req.body.password, user.password_digest, (err, result) => {

      if (result) {

        req.session.userId = user.id

        res.redirect(`/todo/usergroups/${user.id}`)

      } else {

        res.render('login')

      }
    });

  })

}) 

app.delete('/todo/logout', (req, res) => {
  // destroy the session

  req.session.destroy()
  // req.session.userId = undefined
  res.redirect('/')

})

app.get('/todo/usergroups/:id', (req, res) => {
  let sql = `SELECT * from list where user_id = $1 order by id;`
  let user_id = req.params.id
  db.query(sql, [user_id], (err, dbRes) => {
    if (err) {
      next(err)
      return
    }
    
    let lists = dbRes.rows
    
    res.render('user_page', { lists : lists, user_id : user_id})
    
  })
})

app.post('/todo/usergroups/:id', (req, res) => {
  
  let userId = req.params.id

  if (req.body.name === '') {
    res.redirect(`/todo/usergroups/${userId}`)
    return
  }


  let sql =`insert into list (list_name, user_id) values ($1, $2);`

  db.query(sql, [req.body.name, userId], (err, dbRes) => {
    
    if(err) {
      console.log(err);
      return
    }

    res.redirect(`/todo/usergroups/${userId}`)
  })
})

app.delete('/todo/:id/delete', (req, res) => {
  
  let sql = `delete from list where id = $1`

  db.query(sql, [req.params.id], (err,dbRes) => {
    if (err) {
      console.log(err)
      return
    }

    res.redirect(`/todo/usergroups/${req.body.user_id}`)
  })
})

app.put('/todo/:id/edit', (req, res) => {
  let sql = 'update list set list_name = $1 where id = $2;'

  db.query(sql, [req.body.list_name, req.params.id], (err, dbRes) => {
    console.log(err);
    
    res.redirect(`/todo/usergroups/${req.body.user_id}`)
  })

})


app.post('/todo/details/:id', (req, res) => {
  
  let groupId = req.params.id

  let sql = `insert into item (description, group_id) values ($1,$2);`

  db.query(sql, [req.body.description, groupId], (err, dbRes) => {

    if(err) {
      console.log(err);
      return
    }

    res.redirect('/todo/details/'+ groupId)
  })

})

app.get('/todo/details/:id', (req, res) => {
  
  let sql = `SELECT * from item where group_id = $1 order by id desc;`
  let group_id = req.params.id
  db.query(sql, [group_id], (err, dbRes) => {
    if (err) {
      next(err)
      return
    }
    
    let items = dbRes.rows
    
    res.render('group_list_page', { items : items, group_id : group_id })
    
  })
})

app.delete('/todo/:id', (req, res) => {
  
  let sql = `delete from item where id = $1`

  db.query(sql, [req.params.id], (err,dbRes) => {
    if (err) {
      console.log(err)
      return
    }

    res.redirect(`/todo/details/${req.body.group_id}`)
  })
})


app.put('/todo/:id', (req, res) => {
  
  let sql = 'update item set description = $1 where id = $2;'

  db.query(sql, [req.body.name, req.params.id], (err, dbRes) => {
    if (err) {
      console.log(err)
      return
    }
    
    res.redirect(`/todo/details/${req.body.group_id}`)
  })

})


app.listen(process.env.PORT || 3000)