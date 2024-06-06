const express = require('express')
const app = express()
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')
app.use(express.json())

const dbpath = path.join(__dirname, 'userData.db')

let db = null

const instalizeserver = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server running on port 3000')
    })
  } catch (e) {
    console.log(`dberror ${e.message}`)
    process.exit(1)
  }
}
instalizeserver()

app.post('/register', async (resquest, response) => {
  const details = resquest.body
  const {username, name, password, gender, location} = details
  const query = `select * from user where username="${username}"`
  const res = await db.get(query)
  if (res === undefined) {
    if (password.length < 5) {
      response.status = 400
      response.send('Password is too short')
    } else {
      const hashp = await bcrypt.hash(password, 10)
      const postquery = `insert into user(username,name,password,gender,location)
        values ("${username}","${name}","${hashp}","${gender}","${location}")`
      const dbresponse = await db.run(postquery)
      response.status = 200
      response.send('User created successfully')
    }
  } else {
    response.status = 400
    response.send('User already exists')
  }
})
//
app.post('/login', async (request, response) => {
  const details = request.body
  const {username, password} = details
  const query = `select * from user where username="${username}"`
  const res = await db.get(query)

  if (res !== undefined) {
    const check = await bcrypt.compare(password, res.password)
    if (check === true) {
      response.status = 200
      response.send('Login success!')
    } else {
      response.status = 400
      response.send('Invalid password')
    }
  } else {
    response.status = 400
    response.send('Invalid user')
  }
})

app.put('/change-password', async (request, response) => {
  const details = request.body
  const {username, oldPassword, newPassword} = details
  const query = `select * from user where username="${username}"`
  const res = await db.get(query)
  if (res !== undefined) {
    const check = await bcrypt.compare(oldPassword, res.password)

    if (check === false) {
      response.status = 400
      response.send('Invalid current password')
    } else {
      if (newPassword.length < 5) {
        response.status = 400
        response.send('Password is too short')
      } else {
        const hash = await bcrypt.hash(newPassword, 10)
        const q = `update user set password="${hash}" where username="${username}"`
        const dbres = await db.run(q)
        response.status = 200
        response.send('Password updated')
      }
    }
  } else {
    response.status = 400
    response.send('User not exist')
  }
})
module.exports = app
